import { blogTools } from "./tools.js";
import { stepPrompt, planningPrompt } from "./prompts.js";
import webSearch from "../../tools/web_search.js";
import { EventTypes } from "@blog-agent/shared";

/**
 * Blog Writing Preset
 *
 * Configuration for the blog writing agent preset.
 * Defines phases, tools, prompts, and state management.
 */
const blogPreset = {
  // Preset identification
  name: "blog",
  displayName: "Blog Writing Agent",
  description: "Researches topics and writes high-quality blog articles",

  // Workflow phases
  phases: ["research", "outline", "write", "edit", "finalize"],

  // Tools to register (names for shared tools, objects for preset-specific)
  tools: [
    "web_search",
    "save_research_note",
    "create_outline",
    "write_section",
    "compile_draft",
    "edit_draft",
    "finalize_article"
  ],

  // Tool implementations (shared tools loaded separately)
  toolImplementations: [...blogTools, webSearch],

  // Initial state for working memory
  initialState: {
    research: [],
    outline: null,
    sections: {},
    draft: null,
    finalArticle: null
  },

  // Prompt builders
  stepPrompt,
  planningPrompt,

  // Context builder for step execution
  contextBuilder: (memory) => ({
    researchNotes: memory.get("research") || [],
    outline: memory.get("outline"),
    sections: memory.get("sections") || {},
    draft: memory.get("draft"),
    finalArticle: memory.get("finalArticle")
  }),

  // Extract final result from memory
  extractResult: (memory) => ({
    article: memory.get("finalArticle") || memory.get("draft"),
    outline: memory.get("outline"),
    researchNotes: memory.get("research") || []
  }),

  // Extract stats from memory
  extractStats: (memory) => ({
    completedSteps: memory.currentStepIndex,
    totalSteps: memory.plan?.steps?.length || 0,
    researchNotes: (memory.get("research") || []).length,
    wordCount: (memory.get("finalArticle") || memory.get("draft") || "")
      .split(/\s+/)
      .filter(Boolean).length
  }),

  // Custom events for this preset
  events: {
    RESEARCH_ADDED: EventTypes.RESEARCH_ADDED,
    OUTLINE_CREATED: EventTypes.OUTLINE_CREATED,
    DRAFT_UPDATED: EventTypes.DRAFT_UPDATED,
    ARTICLE_FINALIZED: EventTypes.ARTICLE_FINALIZED
  },

  // Agent configuration
  maxIterationsPerStep: 5,
  model: "claude-sonnet-4-20250514",
  plannerMaxTokens: 1500,
  stepMaxTokens: 4000
};

export default blogPreset;
