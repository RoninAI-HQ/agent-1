import client from "./client.js";
import ContextManager from "./ContextManager.js";
import WorkingMemory from "./WorkingMemory.js";
import ToolExecutor from "./ToolExecutor.js";
import Planner from "./Planner.js";
import { tools } from "./tools.js";

class BlogWritingAgent {
  constructor(options = {}) {
    this.contextManager = new ContextManager(options);
    this.workingMemory = new WorkingMemory();
    this.toolExecutor = new ToolExecutor(this.workingMemory);
    this.planner = new Planner();
    this.verbose = options.verbose ?? true;
  }

  async run(blogIdea) {
    console.log("\n" + "=".repeat(60));
    console.log("BLOG WRITING AGENT STARTED");
    console.log("=".repeat(60));
    console.log(`\nBlog idea: "${blogIdea}"`);

    // Phase 1: Set goal and create plan
    this.workingMemory.setGoal(blogIdea);

    const plan = await this.planner.createPlan(blogIdea);
    this.workingMemory.setPlan(plan);

    if (this.verbose) {
      console.log("\nPLAN:");
      console.log(`   Approach: ${plan.approach}`);
      for (const step of plan.steps) {
        console.log(`   ${step.id}. [${step.phase}] ${step.action}`);
      }
    }

    // Phase 2: Execute the plan step by step
    console.log("\n" + "-".repeat(60));
    console.log("EXECUTING PLAN");
    console.log("-".repeat(60));

    for (const step of plan.steps) {
      console.log(`\nStep ${step.id}/${plan.steps.length}: ${step.action}`);

      await this.executeStep(step);

      this.workingMemory.completeStep(step);

      // Small delay to avoid rate limits
      await this.delay(500);
    }

    // Phase 3: Return the final result
    console.log("\n" + "=".repeat(60));
    console.log("BLOG WRITING COMPLETE");
    console.log("=".repeat(60));

    return {
      success: true,
      article: this.workingMemory.finalArticle || this.workingMemory.draft,
      outline: this.workingMemory.outline,
      researchNotes: this.workingMemory.research,
      stats: {
        stepsCompleted: this.workingMemory.currentStepIndex,
        researchNotes: this.workingMemory.research.length,
        wordCount: (this.workingMemory.finalArticle || this.workingMemory.draft || "")
          .split(/\s+/).length
      }
    };
  }

  async executeStep(step) {
    // Build context for this step
    const memoryContext = this.workingMemory.getContext();

    const systemPrompt = `You are an expert blog writer executing a specific step in the writing process.

CURRENT GOAL: ${memoryContext.goal}

CURRENT STEP: ${step.action}
PHASE: ${step.phase}
TOOL TO USE: ${step.tool}
DETAILS: ${step.details}

PROGRESS: Step ${memoryContext.completedSteps + 1} of ${memoryContext.totalSteps}

${memoryContext.researchNotes.length > 0 ? `
RESEARCH COLLECTED SO FAR:
${memoryContext.researchNotes.map(n => `- [${n.topic}]: ${n.content}`).join("\n")}
` : ""}

${memoryContext.hasOutline ? `
CURRENT OUTLINE:
Title: ${this.workingMemory.outline.title}
Sections: ${this.workingMemory.outline.sections.map(s => s.heading).join(", ")}
` : ""}

${this.workingMemory.draft ? `
CURRENT DRAFT LENGTH: ${this.workingMemory.draft.split(/\s+/).length} words
` : ""}

Execute this step by using the ${step.tool} tool. Be thorough and produce high-quality content.

The content should be written so it reads as if written by a thoughtful, competent human — not a bot, not a press release not a forensic report. Keep the facts, intent, and structure intact, but elevate:
- **Rhythm**: Mix up short, punchy sentences with longer, more descriptive ones, break up dense paragraphs to keep readers engaged. Use line breaks strategically it will add a sense of rhythm and allow for moments of emphasis and silence. Ultimately, your goal is to create a natural flow where each paragraph, regardless of its length, contributes to the overall cadence of the piece.
- **Specificity**: Don't just make a general claim; back it up with a specific example or precise wording. *But only do this if the original text provides the details.* If it doesn't, you'll need to point out that the information is missing.
- **Clarity**: Write with clarity. Get straight to the point without oversimplifying. Use simple, direct language and strong, active verbs instead of complicated terms or clunky phrases.
- **Voice**: Show the writer's personality. Let their unique voice come through. Are they calm, urgent, or witty? Do they sound like an expert you can easily talk to? Capture their tone and style without adding extra words.
- **Flow**: To connect your ideas, focus on creating a smooth flow rather than relying on transition words. Make sure your points follow each other naturally and that the rhythm of your sentences guides the reader from one thought to the next. The goal is to make the progression feel effortless and logical.

`;

    const messages = [
      ...this.contextManager.getMessages(),
      { role: "user", content: `Execute step ${step.id}: ${step.action}` }
    ];

    // Agent loop for this step
    let iterations = 0;
    const maxIterations = 5;

    while (iterations < maxIterations) {
      iterations++;

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
        system: systemPrompt,
        tools: tools,
        messages: messages
      });

      // Process response
      if (response.stop_reason === "tool_use") {
        // Add assistant message to history
        messages.push({ role: "assistant", content: response.content });

        // Execute tools
        const toolResults = [];
        for (const block of response.content) {
          if (block.type === "tool_use") {
            const result = await this.toolExecutor.execute(block.name, block.input);
            toolResults.push({
              type: "tool_result",
              tool_use_id: block.id,
              content: JSON.stringify(result)
            });
          }
        }

        messages.push({ role: "user", content: toolResults });

      } else if (response.stop_reason === "end_turn") {
        // Step complete
        const text = response.content
          .filter(b => b.type === "text")
          .map(b => b.text)
          .join("\n");

        if (text) {
          await this.contextManager.addMessage({ role: "assistant", content: text });
        }

        break;
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default BlogWritingAgent;
