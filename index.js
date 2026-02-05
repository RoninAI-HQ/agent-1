import "dotenv/config";
import readline from "readline";
import Agent from "./src/core/Agent.js";
import ToolRegistry from "./src/core/ToolRegistry.js";
import { ToolDeniedError } from "./src/core/ToolExecutor.js";
import PermissionManager from "./src/core/PermissionManager.js";
import { createAgentConfig } from "./src/config/index.js";
import { createBrowserSession } from "./src/tools/browser/sessions/index.js";
import { BROWSER_TOOL_NAMES, createBrowserTools } from "./src/tools/browser/index.js";
import { initLLMClient } from "./src/core/client.js";
import { DEFAULT_MODELS } from "./src/core/providers/index.js";
import DebugLogger from "./src/debug/DebugLogger.js";
import { parseCLI, generateHelp } from "./src/cli/index.js";
import { ProgressRenderer } from "./src/display/index.js";

async function main() {
  const { config, errors } = parseCLI(process.argv);

  if (errors.length > 0) {
    errors.forEach(err => console.error(`Error: ${err}`));
    console.error("\n" + generateHelp());
    process.exit(1);
  }

  const { browser: browserType, headless, provider, model, debug, task } = config;

  if (!task) {
    console.error(generateHelp());
    process.exit(1);
  }

  // Create renderer for progress display
  const renderer = new ProgressRenderer();

  // Initialize LLM provider
  try {
    initLLMClient(provider, { defaultModel: model || undefined });
  } catch (error) {
    renderer.renderError(error.message);
    process.exit(1);
  }

  const displayModel = model || DEFAULT_MODELS[provider];
  renderer.renderProvider(provider, displayModel);

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

  // Attach renderer to agent events
  renderer.attach(agent);

  if (debug) {
    const debugLogger = new DebugLogger(agent);
    renderer.renderDebug(debugLogger.getDir());
  }

  renderer.renderTask(task);

  const startTime = Date.now();
  try {
    const result = await agent.run(task);
    const elapsed = Date.now() - startTime;
    renderer.renderResult(result, elapsed);
  } catch (error) {
    if (error instanceof ToolDeniedError) {
      renderer.renderAborted(error.message);
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
