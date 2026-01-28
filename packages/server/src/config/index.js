import { stepPrompt, planningPrompt } from "./prompts.js";
import webSearch from "../tools/web_search.js";
import saveNote from "../tools/save_note.js";
import think from "../tools/think.js";
import storeResult from "../tools/store_result.js";
import completeTask from "../tools/complete_task.js";
import { EventTypes } from "@blog-agent/shared";

/**
 * Agent Configuration
 *
 * Configuration for the general-purpose agent that can handle any task
 * by planning and executing steps.
 */
const agentConfig = {
  // Agent identification
  name: "agent",
  displayName: "General Purpose Agent",
  description: "A flexible agent that can handle any task by planning and executing steps",

  // Workflow phases
  phases: ["understand", "work", "deliver"],

  // Tools available to the agent
  tools: [
    "web_search",
    "save_note",
    "think",
    "store_result",
    "complete_task"
  ],

  // Tool implementations
  toolImplementations: [
    webSearch,
    saveNote,
    think,
    storeResult,
    completeTask
  ],

  // Initial state for working memory
  initialState: {
    notes: [],
    thoughts: [],
    results: {},
    finalAnswer: null,
    completionSummary: null
  },

  // Prompt builders
  stepPrompt,
  planningPrompt,

  // Context builder for step execution
  contextBuilder: (memory) => ({
    notes: memory.get("notes") || [],
    thoughts: memory.get("thoughts") || [],
    results: memory.get("results") || {},
    finalAnswer: memory.get("finalAnswer"),
    completionSummary: memory.get("completionSummary")
  }),

  // Extract final result from memory
  extractResult: (memory) => ({
    answer: memory.get("finalAnswer"),
    summary: memory.get("completionSummary"),
    notes: memory.get("notes") || [],
    thoughts: memory.get("thoughts") || [],
    results: memory.get("results") || {}
  }),

  // Extract stats from memory
  extractStats: (memory) => ({
    completedSteps: memory.currentStepIndex,
    totalSteps: memory.plan?.steps?.length || 0,
    notesCount: (memory.get("notes") || []).length,
    thoughtsCount: (memory.get("thoughts") || []).length,
    resultsCount: Object.keys(memory.get("results") || {}).length
  }),

  // Events emitted by this agent
  events: {
    NOTE_SAVED: EventTypes.NOTE_SAVED,
    THOUGHT_RECORDED: EventTypes.THOUGHT_RECORDED,
    RESULT_STORED: EventTypes.RESULT_STORED,
    TASK_COMPLETED: EventTypes.TASK_COMPLETED
  },

  // Agent configuration
  maxIterationsPerStep: 5,
  model: "claude-sonnet-4-20250514",
  plannerMaxTokens: 1500,
  stepMaxTokens: 4000
};

export default agentConfig;
