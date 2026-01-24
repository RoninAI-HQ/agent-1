import React, { createContext, useContext, useReducer, useCallback } from 'react';

const AgentContext = createContext(null);

const initialState = {
  sessionId: null,
  status: 'idle', // idle, connecting, running, completed, error
  topic: null,
  currentPhase: null,
  plan: null,
  currentStep: null,
  completedSteps: 0,
  totalSteps: 0,
  toolActivity: [],
  research: [],
  outline: null,
  draft: null,
  finalArticle: null,
  error: null,
  wordCount: 0
};

function agentReducer(state, action) {
  switch (action.type) {
    case 'SET_SESSION':
      return { ...state, sessionId: action.payload, status: 'connecting' };

    case 'SET_STATUS':
      return { ...state, status: action.payload };

    case 'SET_TOPIC':
      return { ...state, topic: action.payload };

    case 'AGENT_STARTED':
      return { ...state, status: 'running', topic: action.payload.topic };

    case 'PHASE_START':
      return { ...state, currentPhase: action.payload.phase };

    case 'PLAN_CREATED':
      return {
        ...state,
        plan: action.payload.plan,
        totalSteps: action.payload.plan.steps.length
      };

    case 'STEP_START':
      return {
        ...state,
        currentStep: {
          id: action.payload.stepId,
          action: action.payload.action,
          phase: action.payload.phase,
          tool: action.payload.tool
        }
      };

    case 'STEP_COMPLETE':
      return {
        ...state,
        completedSteps: action.payload.stepId,
        currentStep: null
      };

    case 'TOOL_START':
      return {
        ...state,
        toolActivity: [
          ...state.toolActivity,
          {
            id: Date.now(),
            tool: action.payload.tool,
            input: action.payload.input,
            status: 'running',
            timestamp: Date.now()
          }
        ].slice(-50) // Keep last 50 entries
      };

    case 'TOOL_RESULT':
      return {
        ...state,
        toolActivity: state.toolActivity.map((activity, idx) =>
          idx === state.toolActivity.length - 1
            ? { ...activity, result: action.payload.result, status: 'complete' }
            : activity
        )
      };

    case 'RESEARCH_ADDED':
      return {
        ...state,
        research: [...state.research, action.payload.note]
      };

    case 'OUTLINE_CREATED':
      return { ...state, outline: action.payload.outline };

    case 'DRAFT_UPDATED':
      return {
        ...state,
        draft: action.payload.draft,
        wordCount: action.payload.wordCount
      };

    case 'ARTICLE_FINALIZED':
      return {
        ...state,
        finalArticle: action.payload.article,
        wordCount: action.payload.wordCount
      };

    case 'AGENT_COMPLETE':
      return {
        ...state,
        status: 'completed',
        finalArticle: action.payload.article,
        wordCount: action.payload.stats?.wordCount || state.wordCount
      };

    case 'AGENT_ERROR':
      return {
        ...state,
        status: 'error',
        error: action.payload.message
      };

    case 'LOAD_STATE':
      // Handle initial state load from SSE connection
      const payload = action.payload;
      return {
        ...state,
        plan: payload.plan,
        research: payload.research || [],
        outline: payload.outline,
        draft: payload.draft,
        finalArticle: payload.finalArticle,
        completedSteps: payload.stats?.completedSteps || 0,
        totalSteps: payload.stats?.totalSteps || 0,
        wordCount: payload.stats?.wordCount || 0
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

export function AgentProvider({ children }) {
  const [state, dispatch] = useReducer(agentReducer, initialState);

  const createSession = useCallback(async () => {
    const response = await fetch('/api/sessions', { method: 'POST' });
    const data = await response.json();
    dispatch({ type: 'SET_SESSION', payload: data.id });
    return data.id;
  }, []);

  const startAgent = useCallback(async (sessionId, topic) => {
    dispatch({ type: 'SET_TOPIC', payload: topic });
    const response = await fetch(`/api/sessions/${sessionId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic })
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error);
    }
    return data;
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  return (
    <AgentContext.Provider value={{ state, dispatch, createSession, startAgent, reset }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgent must be used within an AgentProvider');
  }
  return context;
}

export default AgentContext;
