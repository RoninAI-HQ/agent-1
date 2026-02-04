import "dotenv/config";
import readline from "readline";
import Agent from "./src/core/Agent.js";
import ToolRegistry from "./src/core/ToolRegistry.js";
import { ToolDeniedError } from "./src/core/ToolExecutor.js";
import PermissionManager from "./src/core/PermissionManager.js";
import { createAgentConfig } from "./src/config/index.js";
import { createBrowserSession, VALID_TYPES } from "./src/tools/browser/sessions/index.js";
import { BROWSER_TOOL_NAMES, createBrowserTools } from "./src/tools/browser/index.js";
import { initLLMClient } from "./src/core/client.js";
import { VALID_PROVIDERS, DEFAULT_MODELS } from "./src/core/providers/index.js";
import DebugLogger from "./src/debug/DebugLogger.js";

const fmt = {
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
};

async function main() {
  const { browserType, headless, provider, model, debug, task } = parseArgs(process.argv);

  if (!task) {
    printUsage();
    process.exit(1);
  }

  // Initialize LLM provider
  try {
    initLLMClient(provider, { defaultModel: model || undefined });
  } catch (error) {
    console.error(`${fmt.red}●${fmt.reset} ${fmt.bold}Error${fmt.reset} ${error.message}`);
    process.exit(1);
  }

  const displayModel = model || DEFAULT_MODELS[provider];
  console.log(`\n${fmt.cyan}●${fmt.reset} ${fmt.bold}Provider${fmt.reset}(${provider}) ${fmt.dim}model=${displayModel}${fmt.reset}`);

  let session = null;
  let agentConfig = null;

  if (browserType) {
    if (!headless && browserType === "lightpanda") {
      console.error("Error: Lightpanda only supports headless mode. Use --headless true or choose a different browser (e.g. chrome).");
      process.exit(1);
    }
    session = createBrowserSession(browserType, { headless });
    const browserTools = createBrowserTools(session);
    agentConfig = createAgentConfig({
      browserToolNames: BROWSER_TOOL_NAMES,
      browserTools,
      provider,
      model
    });
  } else {
    agentConfig = createAgentConfig({ provider, model });
  }

  const { agent, approvalHandler } = await createAgent(agentConfig);

  setupEventLogging(agent);

  if (debug) {
    const debugLogger = new DebugLogger(agent);
    console.log(`${fmt.yellow}●${fmt.reset} ${fmt.bold}Debug${fmt.reset} snapshots → ${fmt.dim}${debugLogger.getDir()}/${fmt.reset}`);
  }

  console.log(`\n${fmt.blue}●${fmt.reset} ${fmt.bold}Task${fmt.reset}(${task})\n`);

  const startTime = Date.now();
  try {
    const result = await agent.run(task);
    const elapsed = Date.now() - startTime;
    printResult(result, elapsed);
  } catch (error) {
    if (error instanceof ToolDeniedError) {
      console.log(`\n${fmt.red}●${fmt.reset} ${fmt.bold}Aborted${fmt.reset} ${error.message}`);
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
  let browserType = "lightpanda";
  let headless = true;
  let cliProvider = null;
  let cliModel = null;
  let debug = false;
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
      i++;
    } else if (args[i] === "--headless") {
      if (i + 1 >= args.length) {
        console.error("Error: --headless requires a value (true or false)");
        process.exit(1);
      }
      const val = args[i + 1].toLowerCase();
      if (val !== "true" && val !== "false") {
        console.error(`Error: --headless must be "true" or "false", got "${args[i + 1]}"`);
        process.exit(1);
      }
      headless = val === "true";
      i++;
    } else if (args[i] === "--provider") {
      if (i + 1 >= args.length) {
        console.error(`Error: --provider requires a value. Valid providers: ${VALID_PROVIDERS.join(", ")}`);
        process.exit(1);
      }
      cliProvider = args[i + 1];
      if (!VALID_PROVIDERS.includes(cliProvider)) {
        console.error(`Error: Unknown provider "${cliProvider}". Valid providers: ${VALID_PROVIDERS.join(", ")}`);
        process.exit(1);
      }
      i++;
    } else if (args[i] === "--model") {
      if (i + 1 >= args.length) {
        console.error("Error: --model requires a value");
        process.exit(1);
      }
      cliModel = args[i + 1];
      i++;
    } else if (args[i] === "--debug") {
      debug = true;
    } else {
      taskParts.push(args[i]);
    }
  }

  // Resolve with env var fallbacks
  const provider = cliProvider || process.env.LLM_PROVIDER || "anthropic";
  const model = cliModel || process.env.LLM_MODEL || null;

  return { browserType, headless, provider, model, debug, task: taskParts.join(" ") };
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
  const bullet = (color = fmt.blue) => `${color}●${fmt.reset}`;
  const sub = (text) => `  └ ${text}`;

  agent.on("agent:started", () => {});

  agent.on("plan:created", (data) => {
    const { plan } = data;
    console.log(`${bullet(fmt.green)} ${fmt.bold}Plan${fmt.reset}(${plan.approach})`);
    for (const step of plan.steps) {
      const last = step.id === plan.steps.length;
      const connector = last ? "└" : "├";
      console.log(`  ${connector} ${fmt.dim}${step.id}.${fmt.reset} ${step.action} ${fmt.dim}(${step.tool})${fmt.reset}`);
    }
  });

  agent.on("phase:start", (data) => {
    if (data.message) {
      console.log(`${bullet(fmt.cyan)} ${fmt.bold}${data.phase}${fmt.reset} ${fmt.dim}${data.message}${fmt.reset}`);
    }
  });

  agent.on("step:start", (data) => {
    console.log(`${bullet()} ${fmt.bold}Step ${data.stepId}/${data.totalSteps}${fmt.reset} ${data.action}`);
  });

  agent.on("tool:start", (data) => {
    if (data.tool === "browser_navigate") {
      console.log(sub(`${fmt.bold}${data.tool}${fmt.reset} ${fmt.dim}${data.input.url}${fmt.reset}`));
    } else {
      console.log(sub(`${fmt.bold}${data.tool}${fmt.reset}`));
    }
  });

  agent.on("tool:result", (data) => {
    if (data.tool === "browser_navigate" && data.result?.success) {
      console.log(`    ${fmt.dim}↳ "${data.result.title}"${fmt.reset}`);
    } else if (data.tool === "browser_read_page" && data.result?.success) {
      console.log(`    ${fmt.dim}↳ "${data.result.title}" (${data.result.url})${fmt.reset}`);
    }
  });

  agent.on("note:saved", (data) => {
    console.log(sub(`${fmt.green}Note${fmt.reset} [${data.note.category}] ${data.note.content.substring(0, 80)}...`));
  });

  agent.on("thought:recorded", (data) => {
    console.log(sub(`${fmt.cyan}Think${fmt.reset} ${data.thought.thought.substring(0, 100)}...`));
  });

  agent.on("result:stored", (data) => {
    console.log(sub(`${fmt.green}Result${fmt.reset} stored: ${fmt.bold}${data.key}${fmt.reset}`));
  });

  agent.on("task:completed", (data) => {
    console.log(sub(`${fmt.green}Done${fmt.reset} ${data.summary}`));
  });

  agent.on("approval:denied", (data) => {
    console.log(sub(`${fmt.red}Denied${fmt.reset} tool '${data.tool}' was not approved`));
  });

  agent.on("browser:closed", () => {
    console.log(sub(`${fmt.dim}Browser closed${fmt.reset}`));
  });
}

function printUsage() {
  console.error("Usage: node index.js [options] <task>");
  console.error("\nOptions:");
  console.error("  --provider <name>      LLM provider (anthropic, openai, ollama). Default: anthropic");
  console.error("  --model <name>         Model name. Default: per-provider (claude-sonnet-4-20250514, gpt-4o, llama3.2)");
  console.error("  --browser <type>       Browser type for web tasks. Default: lightpanda");
  console.error("  --headless true/false  Run browser in headless mode. Default: true");
  console.error("  --debug                Write agent state snapshots to debug/ folder");
  console.error("\nExamples:");
  console.error("  node index.js \"What is the capital of France?\"");
  console.error("  node index.js --provider openai --model gpt-4o \"Summarize the news\"");
  console.error("  node index.js --browser chrome \"Search for cats on Wikipedia\"");
  console.error("\nEnvironment variables:");
  console.error("  LLM_PROVIDER    LLM provider (overridden by --provider)");
  console.error("  LLM_MODEL       Model name (overridden by --model)");
  console.error("  OPENAI_API_KEY  Required when using the openai provider");
  console.error("  OLLAMA_BASE_URL Ollama server URL (default: http://localhost:11434/v1)");
  console.error(`\nBrowser types: ${VALID_TYPES.join(", ")} (default: lightpanda)`);
  console.error(`Providers: ${VALID_PROVIDERS.join(", ")} (default: anthropic)`);
}

function printResult(result, elapsed) {
  console.log(`\n${fmt.green}●${fmt.reset} ${fmt.bold}Result${fmt.reset} ${fmt.dim}(${formatElapsed(elapsed)})${fmt.reset}`);

  if (result.answer) {
    console.log(result.answer);
  } else {
    console.log(JSON.stringify(result, null, 2));
  }

  const stats = result.stats || {};
  const statParts = [];
  if (stats.totalSteps) statParts.push(`${stats.completedSteps}/${stats.totalSteps} steps`);
  if (stats.notesCount) statParts.push(`${stats.notesCount} notes`);
  if (stats.thoughtsCount) statParts.push(`${stats.thoughtsCount} thoughts`);
  if (stats.resultsCount) statParts.push(`${stats.resultsCount} results`);
  if (statParts.length > 0) {
    console.log(`\n  ${fmt.dim}${statParts.join(" · ")}${fmt.reset}`);
  }
}

function formatElapsed(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(1);
  return `${minutes}m ${remainingSeconds}s`;
}
