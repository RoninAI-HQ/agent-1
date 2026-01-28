import { EventTypes } from "@blog-agent/shared";

/**
 * Blog Writing Tools
 *
 * Tool implementations for the blog writing preset.
 * Each tool updates working memory and emits events.
 */

export const saveResearchNote = {
  name: "save_research_note",
  schema: {
    name: "save_research_note",
    description: "Save an important piece of research or insight that should be included in the article. Use this to build up your research before writing.",
    input_schema: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description: "The topic or category of this note"
        },
        content: {
          type: "string",
          description: "The research finding, fact, or insight"
        },
        source: {
          type: "string",
          description: "Where this information came from"
        }
      },
      required: ["topic", "content"]
    }
  },
  execute: async ({ topic, content, source }, { memory, emit }) => {
    const note = {
      topic,
      content,
      source: source || "research",
      timestamp: Date.now()
    };

    memory.update("research", (research = []) => [...research, note]);
    const totalNotes = memory.get("research").length;

    emit(EventTypes.RESEARCH_ADDED, { note, totalNotes });

    return { success: true, noteCount: totalNotes };
  }
};

export const createOutline = {
  name: "create_outline",
  schema: {
    name: "create_outline",
    description: "Create a structured outline for the blog article. Do this after research is complete but before writing.",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "The article title"
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: {
              heading: { type: "string" },
              key_points: {
                type: "array",
                items: { type: "string" }
              }
            }
          },
          description: "The sections of the article with their key points"
        },
        target_length: {
          type: "string",
          description: "Target word count, e.g., '800-1000 words'"
        }
      },
      required: ["title", "sections"]
    }
  },
  execute: async ({ title, sections, target_length }, { memory, emit }) => {
    const outline = { title, sections, target_length };
    memory.set("outline", outline);

    emit(EventTypes.OUTLINE_CREATED, { outline });

    return {
      success: true,
      title,
      sectionCount: sections.length,
      sections: sections.map(s => s.heading)
    };
  }
};

export const writeSection = {
  name: "write_section",
  schema: {
    name: "write_section",
    description: "Write a specific section of the blog article based on the outline.",
    input_schema: {
      type: "object",
      properties: {
        section_heading: {
          type: "string",
          description: "The heading of the section to write"
        },
        content: {
          type: "string",
          description: "The full written content for this section"
        }
      },
      required: ["section_heading", "content"]
    }
  },
  execute: async ({ section_heading, content }, { memory }) => {
    memory.update("sections", (sections = {}) => ({
      ...sections,
      [section_heading]: content
    }));

    const wordCount = content.split(/\s+/).length;

    return { success: true, section: section_heading, wordCount };
  }
};

export const compileDraft = {
  name: "compile_draft",
  schema: {
    name: "compile_draft",
    description: "Compile all written sections into a complete first draft.",
    input_schema: {
      type: "object",
      properties: {
        full_draft: {
          type: "string",
          description: "The complete article draft with all sections"
        }
      },
      required: ["full_draft"]
    }
  },
  execute: async ({ full_draft }, { memory, emit }) => {
    memory.set("draft", full_draft);
    const wordCount = full_draft.split(/\s+/).length;

    emit(EventTypes.DRAFT_UPDATED, {
      draft: full_draft,
      wordCount,
      preview: full_draft.substring(0, 500)
    });

    return {
      success: true,
      wordCount,
      preview: full_draft.substring(0, 200) + "..."
    };
  }
};

export const editDraft = {
  name: "edit_draft",
  schema: {
    name: "edit_draft",
    description: "Edit and improve the current draft. Use this for revisions.",
    input_schema: {
      type: "object",
      properties: {
        edit_type: {
          type: "string",
          enum: ["grammar", "clarity", "flow", "tone", "comprehensive"],
          description: "The type of edit to perform"
        },
        edited_content: {
          type: "string",
          description: "The edited/improved content"
        },
        changes_made: {
          type: "string",
          description: "Summary of changes made"
        }
      },
      required: ["edit_type", "edited_content", "changes_made"]
    }
  },
  execute: async ({ edit_type, edited_content, changes_made }, { memory, emit }) => {
    memory.set("draft", edited_content);
    const wordCount = edited_content.split(/\s+/).length;

    emit(EventTypes.DRAFT_UPDATED, {
      draft: edited_content,
      wordCount,
      editType: edit_type,
      changes: changes_made
    });

    return {
      success: true,
      editType: edit_type,
      wordCount,
      changes: changes_made
    };
  }
};

export const finalizeArticle = {
  name: "finalize_article",
  schema: {
    name: "finalize_article",
    description: "Mark the article as complete and finalized.",
    input_schema: {
      type: "object",
      properties: {
        final_article: {
          type: "string",
          description: "The final, polished article"
        },
        word_count: {
          type: "number",
          description: "Final word count"
        }
      },
      required: ["final_article", "word_count"]
    }
  },
  execute: async ({ final_article, word_count }, { memory, emit }) => {
    memory.set("finalArticle", final_article);

    emit(EventTypes.ARTICLE_FINALIZED, {
      article: final_article,
      wordCount: word_count
    });

    return { success: true, wordCount: word_count, complete: true };
  }
};

// Export all tools as an array for easy registration
export const blogTools = [
  saveResearchNote,
  createOutline,
  writeSection,
  compileDraft,
  editDraft,
  finalizeArticle
];

export default blogTools;
