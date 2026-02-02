import { EventTypes } from "../events.js";

/**
 * Store Result Tool - Store intermediate or final outputs
 *
 * A tool for storing results with a key for later retrieval.
 * Useful for multi-step tasks where results need to be passed between steps.
 */
export default {
  name: "store_result",
  schema: {
    name: "store_result",
    description: "Store an intermediate or final result with a key. Use this to save outputs that may be needed in later steps or as part of the final answer.",
    input_schema: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: "A unique key to identify this result (e.g., 'analysis', 'summary', 'data')"
        },
        value: {
          type: "string",
          description: "The result value to store"
        }
      },
      required: ["key", "value"]
    }
  },
  execute: async ({ key, value }, { memory, emit }) => {
    memory.update("results", (results = {}) => ({
      ...results,
      [key]: value
    }));

    const resultCount = Object.keys(memory.get("results")).length;

    emit(EventTypes.RESULT_STORED, { key, resultCount });

    return {
      success: true,
      key,
      resultCount
    };
  }
};
