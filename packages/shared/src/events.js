// SSE Event Types for Agent Framework

export const EventTypes = {
  // Phase events
  PHASE_START: 'phase:start',
  PHASE_END: 'phase:end',

  // Plan events
  PLAN_CREATED: 'plan:created',

  // Step events
  STEP_START: 'step:start',
  STEP_COMPLETE: 'step:complete',

  // Tool events
  TOOL_START: 'tool:start',
  TOOL_RESULT: 'tool:result',

  // Content events (used by blog preset, but available for any preset)
  RESEARCH_ADDED: 'research:added',
  OUTLINE_CREATED: 'outline:created',
  DRAFT_UPDATED: 'draft:updated',
  ARTICLE_FINALIZED: 'article:finalized',

  // General preset events
  NOTE_SAVED: 'note:saved',
  THOUGHT_RECORDED: 'thought:recorded',
  RESULT_STORED: 'result:stored',
  TASK_COMPLETED: 'task:completed',

  // Agent lifecycle events
  AGENT_STARTED: 'agent:started',
  AGENT_COMPLETE: 'agent:complete',
  AGENT_ERROR: 'agent:error',

  // Connection events
  CONNECTED: 'connected',
  HEARTBEAT: 'heartbeat'
};

// Note: Phases are now preset-specific and defined in each preset configuration.
// The blog preset defines: research, outline, write, edit, finalize
// Other presets can define their own phases.

export default EventTypes;
