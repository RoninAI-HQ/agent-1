import Agent from "./packages/server/src/core/Agent.js";
import ToolRegistry from "./packages/server/src/core/ToolRegistry.js";
import { getPreset, listPresets } from "./packages/server/src/presets/index.js";

async function main() {
  // Parse arguments
  const presetName = process.argv[2] === "--preset" ? process.argv[3] : "general";
  const topicArg = process.argv[2] === "--preset" ? process.argv.slice(4).join(" ") : process.argv.slice(2).join(" ");

  const preset = getPreset(presetName);
  if (!preset) {
    console.error(`Unknown preset: ${presetName}`);
    console.error("Available presets:", listPresets().map(p => p.name).join(", "));
    process.exit(1);
  }

  // Require a topic/task
  if (!topicArg) {
    console.error("Usage: node index.js [--preset <name>] <task>");
    console.error("       node index.js \"What is the capital of France?\"");
    console.error("       node index.js --preset blog \"Write about AI trends\"");
    process.exit(1);
  }

  // Create tool registry and register tools
  const registry = new ToolRegistry();
  registry.registerMany(preset.toolImplementations);

  // Create agent
  const agent = new Agent(preset, registry, { verbose: true });

  // Set up event logging - common events
  agent.on("phase:start", (data) => {
    console.log(`\n[PHASE] ${data.phase}${data.message ? `: ${data.message}` : ""}`);
  });

  agent.on("step:start", (data) => {
    console.log(`  [STEP ${data.stepId}/${data.totalSteps}] ${data.action}`);
  });

  agent.on("tool:start", (data) => {
    console.log(`    [TOOL] ${data.tool}`);
  });

  // Blog preset events
  agent.on("research:added", (data) => {
    console.log(`    [RESEARCH] ${data.note.topic}: ${data.note.content.substring(0, 80)}...`);
  });

  agent.on("outline:created", (data) => {
    console.log(`    [OUTLINE] ${data.outline.title}`);
  });

  agent.on("draft:updated", (data) => {
    console.log(`    [DRAFT] ${data.wordCount} words`);
  });

  // General preset events
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

  console.log(`\nUsing preset: ${preset.displayName}`);
  console.log(`Task: ${topicArg}\n`);

  const result = await agent.run(topicArg);

  console.log("\n" + "=".repeat(60));
  console.log("RESULT:");
  console.log("=".repeat(60));

  // Handle different result structures based on preset
  if (result.article) {
    // Blog preset
    console.log(result.article);
  } else if (result.answer) {
    // General preset
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
