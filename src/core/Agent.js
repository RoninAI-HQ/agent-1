import { EventEmitter } from "events";
import client from "./client.js";
import ContextManager from "./ContextManager.js";
import WorkingMemory from "./WorkingMemory.js";
import ToolExecutor from "./ToolExecutor.js";
import Planner from "./Planner.js";
import { EventTypes } from "../events.js";

/**
 * Agent - Generic agent with preset-based configuration
 *
 * Orchestrates planning and execution using a preset's
 * configuration for tools, prompts, and state management.
 */
class Agent extends EventEmitter {
  /**
   * Create a new Agent
   * @param {Object} preset - Preset configuration
   * @param {ToolRegistry} registry - Tool registry with registered tools
   * @param {Object} options - Agent options
   * @param {PermissionManager} options.permissionManager - Permission manager for tool approval
   */
  constructor(preset, registry, options = {}) {
    super();
    this.preset = preset;
    this.registry = registry;
    this.options = options;

    // Initialize components
    this.contextManager = new ContextManager(options);
    this.workingMemory = new WorkingMemory(preset.initialState || {});

    // Create bound emit function
    const emitFn = (type, data) => this.emit(type, data);

    // Pass permission manager to tool executor if provided
    this.toolExecutor = new ToolExecutor(
      registry,
      this.workingMemory,
      emitFn,
      options.permissionManager || null
    );
    this.planner = new Planner(preset, registry, emitFn);

    this.verbose = options.verbose ?? false;
    this.aborted = false;
  }

  /**
   * Abort the agent's execution
   */
  abort() {
    this.aborted = true;
  }

  /**
   * Run the agent with an input
   * @param {string} input - The goal/topic to work on
   * @returns {Promise<Object>} Result object
   */
  async run(input) {
    this.aborted = false;

    try {
      this.emit(EventTypes.AGENT_STARTED, { topic: input });

      // Set goal and create plan
      this.workingMemory.setGoal(input, this.preset.initialState || {});

      this.emit(EventTypes.PHASE_START, {
        phase: this.preset.phases?.[0] || "planning",
        message: "Creating plan..."
      });

      const plan = await this.planner.createPlan(input);
      this.workingMemory.setPlan(plan);

      // Execute the plan step by step
      for (const step of plan.steps) {
        if (this.aborted) {
          throw new Error("Agent aborted");
        }

        // Emit phase change
        const currentPhase = step.phase;
        this.emit(EventTypes.PHASE_START, { phase: currentPhase });

        this.emit(EventTypes.STEP_START, {
          stepId: step.id,
          totalSteps: plan.steps.length,
          action: step.action,
          phase: step.phase,
          tool: step.tool
        });

        await this.executeStep(step);

        this.workingMemory.completeStep(step);

        this.emit(EventTypes.STEP_COMPLETE, {
          stepId: step.id,
          totalSteps: plan.steps.length,
          action: step.action
        });

        // Small delay to avoid rate limits
        await this.delay(500);
      }

      // Build result using preset's extractors
      const result = {
        success: true,
        ...(this.preset.extractResult
          ? this.preset.extractResult(this.workingMemory)
          : { state: this.workingMemory.state }),
        stats: this.preset.extractStats
          ? this.preset.extractStats(this.workingMemory)
          : {
              stepsCompleted: this.workingMemory.currentStepIndex,
              totalSteps: plan.steps.length
            }
      };

      this.emit(EventTypes.AGENT_COMPLETE, result);

      return result;
    } catch (error) {
      this.emit(EventTypes.AGENT_ERROR, {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Execute a single step
   * @param {Object} step - Step to execute
   */
  async executeStep(step) {
    // Build context
    const memoryContext = this.workingMemory.getContext();

    // Build system prompt using preset's prompt builder
    const systemPrompt = this.preset.stepPrompt
      ? this.preset.stepPrompt(step, memoryContext, this.workingMemory)
      : this.buildDefaultStepPrompt(step, memoryContext);

    // Get tool schemas for this step
    const toolSchemas = this.registry.getSchemas(this.preset.tools);

    const messages = [
      ...this.contextManager.getMessages(),
      { role: "user", content: `Execute step ${step.id}: ${step.action}` }
    ];

    // Agent loop for this step
    let iterations = 0;
    const maxIterations = this.preset.maxIterationsPerStep || 5;

    while (iterations < maxIterations) {
      if (this.aborted) {
        throw new Error("Agent aborted");
      }

      iterations++;

      const response = await client.messages.create({
        model: this.preset.model || "claude-sonnet-4-20250514",
        max_tokens: this.preset.stepMaxTokens || 4000,
        system: systemPrompt,
        tools: toolSchemas,
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

  /**
   * Build default step prompt
   * @private
   */
  buildDefaultStepPrompt(step, context) {
    return `You are an agent executing a specific step.

CURRENT GOAL: ${context.goal}

CURRENT STEP: ${step.action}
PHASE: ${step.phase}
TOOL TO USE: ${step.tool}
DETAILS: ${step.details}

PROGRESS: Step ${context.completedSteps + 1} of ${context.totalSteps}

Execute this step by using the ${step.tool} tool.`;
  }

  /**
   * Get current state
   * @returns {Object} Full state
   */
  getState() {
    return this.workingMemory.getFullState(this.preset.extractStats);
  }

  /**
   * Delay helper
   * @param {number} ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default Agent;
