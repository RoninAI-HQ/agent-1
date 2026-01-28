import { EventTypes } from "@blog-agent/shared";

/**
 * Complete Task Tool - Mark the task as complete
 *
 * A tool for marking the task as complete with a final answer.
 * Should be called when all work is done to deliver the result.
 */
export default {
  name: "complete_task",
  schema: {
    name: "complete_task",
    description: "Mark the task as complete and provide the final answer. Use this when you have finished all required work and are ready to deliver the result.",
    input_schema: {
      type: "object",
      properties: {
        answer: {
          type: "string",
          description: "The final answer or result to deliver"
        },
        summary: {
          type: "string",
          description: "A brief summary of what was accomplished"
        }
      },
      required: ["answer", "summary"]
    }
  },
  execute: async ({ answer, summary }, { memory, emit }) => {
    memory.set("finalAnswer", answer);
    memory.set("completionSummary", summary);

    emit(EventTypes.TASK_COMPLETED, { answer, summary });

    return {
      success: true,
      complete: true,
      summary
    };
  }
};
