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

    const plan = this._parseJSON(text);
    this.emit(EventTypes.PLAN_CREATED, { plan });
    return plan;
  }

  /**
   * Extract the first balanced JSON object from text using brace matching
   * @private
   */
  _extractJSON(text) {
    const start = text.indexOf("{");
    if (start === -1) return null;

    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\" && inString) { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      if (ch === "}") { depth--; if (depth === 0) return text.slice(start, i + 1); }
    }
    return null;
  }

  /**
   * Parse JSON from LLM output with progressive repair for local models
   * @private
   */
  _parseJSON(text) {
    const raw = this._extractJSON(text);
    if (!raw) throw new Error("Failed to parse plan: no JSON object found in response");

    // Try raw first, then apply increasingly aggressive repairs
    const attempts = [
      raw,
      raw.replace(/[\x00-\x1f]/g, " "),
      raw.replace(/[\x00-\x1f]/g, " ").replace(/,\s*([}\]])/g, "$1")
    ];

    for (const attempt of attempts) {
      try { return JSON.parse(attempt); } catch {}
    }

    throw new Error("Failed to parse plan: LLM returned malformed JSON");
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
