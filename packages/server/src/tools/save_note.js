import { EventTypes } from "@blog-agent/shared";

/**
 * Save Note Tool - Store research, decisions, and findings
 *
 * A general-purpose tool for storing notes with category tags.
 * Can be used by any preset to track information during execution.
 */
export default {
  name: "save_note",
  schema: {
    name: "save_note",
    description: "Store a note capturing research, decisions, or findings. Use this to record important information discovered during task execution.",
    input_schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The note content - the information to save"
        },
        category: {
          type: "string",
          description: "Category tag for the note (e.g., 'research', 'decision', 'finding', 'observation')"
        }
      },
      required: ["content", "category"]
    }
  },
  execute: async ({ content, category }, { memory, emit }) => {
    const note = {
      content,
      category,
      timestamp: Date.now()
    };

    memory.update("notes", (notes = []) => [...notes, note]);
    const totalNotes = memory.get("notes").length;

    emit(EventTypes.NOTE_SAVED, { note, totalNotes });

    return {
      success: true,
      noteCount: totalNotes,
      category
    };
  }
};
