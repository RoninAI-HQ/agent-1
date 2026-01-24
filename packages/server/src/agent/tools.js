export const tools = [
  {
    name: "web_search",
    description: "Search the web for information on a topic. Use this to research facts, find examples, get current data, or discover expert opinions for the blog article.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query"
        }
      },
      required: ["query"]
    }
  },
  {
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
  {
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
  {
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
  {
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
  {
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
  {
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
  }
];
