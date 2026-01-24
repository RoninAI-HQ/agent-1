import { useAgent } from './context/AgentContext.jsx';
import { useAgentSSE } from './hooks/useAgentSSE.js';
import TopicInput from './components/TopicInput.jsx';
import PhaseIndicator from './components/PhaseIndicator.jsx';
import PlanView from './components/PlanView.jsx';
import ToolActivityLog from './components/ToolActivityLog.jsx';
import ResearchNotes from './components/ResearchNotes.jsx';
import OutlineView from './components/OutlineView.jsx';
import DraftPreview from './components/DraftPreview.jsx';
import FinalArticleView from './components/FinalArticleView.jsx';

function App() {
  const { state } = useAgent();

  // Connect to SSE when we have a session
  useAgentSSE(state.sessionId);

  const showWorkspace = state.status !== 'idle';
  const showFinalArticle = state.status === 'completed' && state.finalArticle;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Blog Writing Agent</h1>
          {state.status !== 'idle' && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {state.status === 'running' ? 'Writing...' :
                 state.status === 'completed' ? 'Complete' :
                 state.status === 'error' ? 'Error' : 'Connecting...'}
              </span>
              <StatusDot status={state.status} />
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Topic Input - Always visible when idle */}
        {state.status === 'idle' && (
          <div className="max-w-2xl mx-auto">
            <TopicInput />
          </div>
        )}

        {/* Main workspace */}
        {showWorkspace && !showFinalArticle && (
          <div className="space-y-6">
            {/* Phase indicator */}
            <PhaseIndicator />

            {/* Topic display */}
            {state.topic && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-blue-800">Topic: </span>
                <span className="text-sm text-blue-700">{state.topic}</span>
              </div>
            )}

            {/* Error display */}
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <span className="text-sm font-medium text-red-800">Error: </span>
                <span className="text-sm text-red-700">{state.error}</span>
              </div>
            )}

            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column - Plan and Activity */}
              <div className="lg:col-span-1 space-y-6">
                <PlanView />
                <ToolActivityLog />
              </div>

              {/* Right column - Content */}
              <div className="lg:col-span-2 space-y-6">
                {state.research.length > 0 && <ResearchNotes />}
                {state.outline && <OutlineView />}
                {state.draft && <DraftPreview />}
              </div>
            </div>
          </div>
        )}

        {/* Final article view */}
        {showFinalArticle && (
          <FinalArticleView />
        )}
      </main>
    </div>
  );
}

function StatusDot({ status }) {
  const colors = {
    idle: 'bg-gray-400',
    connecting: 'bg-yellow-400 animate-pulse',
    connected: 'bg-blue-400',
    running: 'bg-green-400 animate-pulse',
    completed: 'bg-green-500',
    error: 'bg-red-500'
  };

  return (
    <span className={`inline-block w-3 h-3 rounded-full ${colors[status] || 'bg-gray-400'}`} />
  );
}

export default App;
