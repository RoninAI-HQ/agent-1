import "dotenv/config";
import readline from "readline";
import Agent from "./src/core/Agent.js";
import ToolRegistry from "./src/core/ToolRegistry.js";
import { ToolDeniedError } from "./src/core/ToolExecutor.js";
import PermissionManager from "./src/core/PermissionManager.js";
import { createAgentConfig } from "./src/config/index.js";
import { createBrowserSession, VALID_TYPES } from "./src/tools/browser/sessions/index.js";
import { BROWSER_TOOL_NAMES, createBrowserTools } from "./src/tools/browser/index.js";

async function main() {
  const { browserType, task } = parseArgs(process.argv);

  if (!task) {
    printUsage();
    process.exit(1);
  }

  let session = null;
  let agentConfig;

  if (browserType) {
    session = createBrowserSession(browserType);
    const browserTools = createBrowserTools(session);
    agentConfig = createAgentConfig({
      browserToolNames: BROWSER_TOOL_NAMES,
      browserTools
    });
  } else {
    agentConfig = createAgentConfig();
  }

  const { agent, approvalHandler } = await createAgent(agentConfig);

  setupEventLogging(agent);

  console.log(`\nTask: ${task}\n`);

  try {
    const result = await agent.run(task);
    printResult(result);
  } catch (error) {
    if (error instanceof ToolDeniedError) {
      console.log(`\n[ABORTED] ${error.message}. Task cancelled.`);
    } else {
      throw error;
    }
  } finally {
    if (session) {
      await session.close();
    }
    approvalHandler.close();
  }
}

main().catch(console.error);

// --- Helpers ---

function parseArgs(argv) {
  const args = argv.slice(2);
  let browserType = null;
  const taskParts = [];

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--browser") {
      if (i + 1 >= args.length) {
        console.error(`Error: --browser requires a value. Valid types: ${VALID_TYPES.join(", ")}`);
        process.exit(1);
      }
      browserType = args[i + 1];
      if (!VALID_TYPES.includes(browserType)) {
        console.error(`Error: Unknown browser type "${browserType}". Valid types: ${VALID_TYPES.join(", ")}`);
        process.exit(1);
      }
      i++; // skip the value
    } else {
      taskParts.push(args[i]);
    }
  }

  return { browserType, task: taskParts.join(" ") };
}

async function createAgent(agentConfig) {
  const registry = new ToolRegistry();
  registry.registerMany(agentConfig.toolImplementations);

  const permissionManager = new PermissionManager(process.cwd());
  await permissionManager.loadPermissions();

  const approvalHandler = createApprovalHandler();
  permissionManager.setApprovalHandler(approvalHandler.handler);

  const agent = new Agent(agentConfig, registry, {
    verbose: true,
    permissionManager
  });
  return { agent, approvalHandler };
}

function createApprovalHandler() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const handler = async (toolName, input) => {
    console.log(`\n[APPROVAL]\nTool: ${toolName}`);
    console.log(`Input: ${JSON.stringify(input, null, 2)}`);

    return new Promise((resolve) => {
      rl.question("Allow? [y]es / [n]o / [a]lways: ", (answer) => {
        const normalized = answer.toLowerCase().trim();

        if (normalized === "y" || normalized === "yes") {
          resolve({ approved: true, persist: false });
        } else if (normalized === "a" || normalized === "always") {
          resolve({ approved: true, persist: true });
        } else {
          resolve({ approved: false, persist: false });
        }
      });
    });
  };

  return { handler, close: () => rl.close() };
}

function setupEventLogging(agent) {
  agent.on("agent:started", (data) => {
    console.log(`\n[AGENT] Started working on topic: ${data.topic}`);
  });

  agent.on("plan:created", (data) => {
    const { plan } = data;
    console.log(`\n[PLAN] ${plan.approach}`);
    console.log("Steps:");
    for (const step of plan.steps) {
      console.log(`  ${step.id}. [${step.phase}] ${step.action} (${step.tool})`);
    }
  });

  agent.on("phase:start", (data) => {
    console.log(`\n[PHASE] ${data.phase}${data.message ? `: ${data.message}` : ""}`);
  });

  agent.on("step:start", (data) => {
    console.log(`  [STEP ${data.stepId}/${data.totalSteps}] ${data.action}`);
  });

  agent.on("tool:start", (data) => {
    console.log(`    [TOOL] ${data.tool}`);
  });

  agent.on("note:saved", (data) => {
    console.log(`    [NOTE] [${data.note.category}] ${data.note.content.substring(0, 80)}...`);
  });

  agent.on("thought:recorded", (data) => {
    console.log(`    [THINK] ${data.thought.thought.substring(0, 80)}...`);
  });

  agent.on("result:stored", (data) => {
    console.log(`    [RESULT] Stored: ${data.key}`);
  });

  agent.on("task:completed", (data) => {
    console.log(`    [COMPLETE] ${data.summary}`);
  });

  agent.on("approval:denied", (data) => {
    console.log(`    [DENIED] Tool '${data.tool}' was not approved`);
  });

  agent.on("browser:closed", () => {
    console.log("    [BROWSER] Closed");
  });
}

function printUsage() {
  console.error("Usage: node index.js [--browser <type>] <task>");
  console.error("  node index.js \"What is the capital of France?\"");
  console.error("  node index.js --browser lightpanda \"Search for cats on Wikipedia\"");
  console.error("  node index.js --browser chrome \"Search for cats on Wikipedia\"");
  console.error(`\nBrowser types: ${VALID_TYPES.join(", ")}`);
}

function printResult(result) {
  console.log("\n" + "=".repeat(60));
  console.log("RESULT:");
  console.log("=".repeat(60));

  if (result.answer) {
    console.log(result.answer);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }

  console.log("\n" + "=".repeat(60));
  console.log("STATS:");
  console.log(JSON.stringify(result.stats, null, 2));
  console.log("=".repeat(60));
}
