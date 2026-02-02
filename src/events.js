// Event Types for Agent Framework

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

  // Approval events
  APPROVAL_REQUIRED: 'approval:required',
  APPROVAL_DENIED: 'approval:denied',

  // Agent events
  NOTE_SAVED: 'note:saved',
  THOUGHT_RECORDED: 'thought:recorded',
  RESULT_STORED: 'result:stored',
  TASK_COMPLETED: 'task:completed',

  // Agent lifecycle events
  AGENT_STARTED: 'agent:started',
  AGENT_COMPLETE: 'agent:complete',
  AGENT_ERROR: 'agent:error'
};

export default EventTypes;
