import { getLLMClient } from "./client.js";
import { EventTypes } from "../events.js";

/**
 * Planner - Dynamic plan creation with preset awareness
 *
 * Creates execution plans using Claude, with tool and phase
 * information derived from the preset configuration.
 */
class Planner {
  /**
   * Create a new Planner
   * @param {Object} preset - Preset configuration
   * @param {ToolRegistry} registry - Tool registry instance
   * @param {Function} eventEmitter - Event emitter function
   */
  constructor(preset, registry, eventEmitter = null) {
    this.preset = preset;
    this.registry = registry;
    this.emitter = eventEmitter;
  }

  /**
   * Emit an event
   * @param {string} type - Event type
   * @param {*} data - Event data
   */
  emit(type, data) {
    if (this.emitter) {
      this.emitter(type, data);
    }
  }

  /**
   * Build tool descriptions for the planning prompt
   * @returns {string} Formatted tool descriptions
   */
  buildToolDescription() {
    const toolNames = this.preset.tools || this.registry.list();
    return toolNames.map(name => {
      const tool = this.registry.get(name);
      if (tool) {
        return `- ${name}: ${tool.schema.description}`;
      }
      return `- ${name}`;
    }).join("\n");
  }

  /**
   * Build phase list for the planning prompt
   * @returns {string} Comma-separated phase list
   */
  buildPhaseList() {
    return this.preset.phases?.join("|") || "execute";
  }

  /**
   * Create an execution plan
   * @param {string} goal - The goal to plan for
   * @param {Object} context - Additional context
   * @returns {Promise<Object>} Execution plan
   */
  async createPlan(goal, context = {}) {
    const toolDescriptions = this.buildToolDescription();
    const phaseList = this.buildPhaseList();

    // Use preset's planning prompt if available
    let prompt;
    if (this.preset.planningPrompt) {
      prompt = this.preset.planningPrompt(goal, toolDescriptions, phaseList);
    } else {
      prompt = this.buildDefaultPrompt(goal, toolDescriptions, phaseList);
    }

    const response = await getLLMClient().createMessage({
      model: this.preset.model,
      maxTokens: this.preset.plannerMaxTokens || 1500,
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.content[0].text;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const plan = JSON.parse(jsonMatch[0]);

      this.emit(EventTypes.PLAN_CREATED, { plan });

      return plan;
    } catch (e) {
      throw new Error(`Failed to parse plan: ${e.message}`);
    }
  }

  /**
   * Build default planning prompt
   * @private
   */
  buildDefaultPrompt(goal, toolDescriptions, phaseList) {
    return `You are a planning agent.

GOAL: ${goal}

AVAILABLE TOOLS:
${toolDescriptions}

AVAILABLE PHASES: ${phaseList}

Create a detailed plan. Output ONLY valid JSON:

{
  "goal": "the goal",
  "approach": "brief description of approach",
  "steps": [
    {
      "id": 1,
      "phase": "phase_name",
      "action": "what to do",
      "tool": "tool_name",
      "details": "specific details for this step"
    }
  ]
}`;
  }
}

export default Planner;
