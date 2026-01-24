import { useEffect, useRef, useCallback } from 'react';
import { useAgent } from '../context/AgentContext.jsx';

export function useAgentSSE(sessionId) {
  const { dispatch } = useAgent();
  const eventSourceRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (!sessionId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const eventSource = new EventSource(`/api/sessions/${sessionId}/events`);
    eventSourceRef.current = eventSource;

    // Map SSE event types to reducer action types
    const eventMap = {
      'connected': (data) => dispatch({ type: 'SET_STATUS', payload: 'connected' }),
      'state': (data) => dispatch({ type: 'LOAD_STATE', payload: data }),
      'agent:started': (data) => dispatch({ type: 'AGENT_STARTED', payload: data }),
      'agent:complete': (data) => dispatch({ type: 'AGENT_COMPLETE', payload: data }),
      'agent:error': (data) => dispatch({ type: 'AGENT_ERROR', payload: data }),
      'phase:start': (data) => dispatch({ type: 'PHASE_START', payload: data }),
      'plan:created': (data) => dispatch({ type: 'PLAN_CREATED', payload: data }),
      'step:start': (data) => dispatch({ type: 'STEP_START', payload: data }),
      'step:complete': (data) => dispatch({ type: 'STEP_COMPLETE', payload: data }),
      'tool:start': (data) => dispatch({ type: 'TOOL_START', payload: data }),
      'tool:result': (data) => dispatch({ type: 'TOOL_RESULT', payload: data }),
      'research:added': (data) => dispatch({ type: 'RESEARCH_ADDED', payload: data }),
      'outline:created': (data) => dispatch({ type: 'OUTLINE_CREATED', payload: data }),
      'draft:updated': (data) => dispatch({ type: 'DRAFT_UPDATED', payload: data }),
      'article:finalized': (data) => dispatch({ type: 'ARTICLE_FINALIZED', payload: data })
    };

    // Set up event listeners for each event type
    Object.entries(eventMap).forEach(([eventType, handler]) => {
      eventSource.addEventListener(eventType, (event) => {
        try {
          const data = JSON.parse(event.data);
          handler(data);
        } catch (e) {
          console.error(`Error parsing ${eventType} event:`, e);
        }
      });
    });

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      eventSource.close();

      // Attempt to reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connect();
      }, 3000);
    };

    return eventSource;
  }, [sessionId, dispatch]);

  useEffect(() => {
    const eventSource = connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connect]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
  }, []);

  return { disconnect };
}

export default useAgentSSE;
