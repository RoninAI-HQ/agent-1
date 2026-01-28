import { EventTypes } from "@blog-agent/shared";

/**
 * Think Tool - Record reasoning and analysis
 *
 * A tool for recording thought processes, reasoning steps, and analysis.
 * Useful for complex problems that require explicit reasoning.
 */
export default {
  name: "think",
  schema: {
    name: "think",
    description: "Record your reasoning, analysis, or thought process. Use this to think through complex problems step by step before taking action.",
    input_schema: {
      type: "object",
      properties: {
        thought: {
          type: "string",
          description: "Your reasoning, analysis, or thought process"
        }
      },
      required: ["thought"]
    }
  },
  execute: async ({ thought }, { memory, emit }) => {
    const thoughtEntry = {
      thought,
      timestamp: Date.now()
    };

    memory.update("thoughts", (thoughts = []) => [...thoughts, thoughtEntry]);
    const totalThoughts = memory.get("thoughts").length;

    emit(EventTypes.THOUGHT_RECORDED, { thought: thoughtEntry, totalThoughts });

    return {
      success: true,
      thoughtCount: totalThoughts
    };
  }
};
