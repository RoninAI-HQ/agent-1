import "dotenv/config";
import Agent from "./packages/server/src/core/Agent.js";
import ToolRegistry from "./packages/server/src/core/ToolRegistry.js";
import agentConfig from "./packages/server/src/config/index.js";

async function main() {
  // Get task from arguments
  const task = process.argv.slice(2).join(" ");

  if (!task) {
    console.error("Usage: node index.js <task>");
    console.error("       node index.js \"What is the capital of France?\"");
    console.error("       node index.js \"Research the latest AI developments\"");
    process.exit(1);
  }

  // Create tool registry and register tools
  const registry = new ToolRegistry();
  registry.registerMany(agentConfig.toolImplementations);

  // Create agent
  const agent = new Agent(agentConfig, registry, { verbose: true });

  // Set up event logging
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

  console.log(`\nTask: ${task}\n`);

  const result = await agent.run(task);

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

main().catch(console.error);
