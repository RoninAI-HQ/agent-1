// SSE Event Types for Blog Agent

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

  // Content events
  RESEARCH_ADDED: 'research:added',
  OUTLINE_CREATED: 'outline:created',
  DRAFT_UPDATED: 'draft:updated',
  ARTICLE_FINALIZED: 'article:finalized',

  // Agent lifecycle events
  AGENT_STARTED: 'agent:started',
  AGENT_COMPLETE: 'agent:complete',
  AGENT_ERROR: 'agent:error',

  // Connection events
  CONNECTED: 'connected',
  HEARTBEAT: 'heartbeat'
};

export const Phases = {
  RESEARCH: 'research',
  OUTLINE: 'outline',
  WRITE: 'write',
  EDIT: 'edit',
  FINALIZE: 'finalize'
};

export default EventTypes;
