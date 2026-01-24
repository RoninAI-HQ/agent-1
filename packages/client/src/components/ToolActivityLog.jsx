import { useAgent } from '../context/AgentContext.jsx';

const TOOL_ICONS = {
  web_search: '🔍',
  save_research_note: '📝',
  create_outline: '📋',
  write_section: '✍️',
  compile_draft: '📄',
  edit_draft: '✏️',
  finalize_article: '✅'
};

const TOOL_LABELS = {
  web_search: 'Web Search',
  save_research_note: 'Save Note',
  create_outline: 'Create Outline',
  write_section: 'Write Section',
  compile_draft: 'Compile Draft',
  edit_draft: 'Edit Draft',
  finalize_article: 'Finalize'
};

function ToolActivityLog() {
  const { state } = useAgent();
  const { toolActivity } = state;

  if (toolActivity.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Tool Activity</h3>
        <p className="text-sm text-gray-500 text-center py-4">
          Waiting for tool executions...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Tool Activity</h3>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {[...toolActivity].reverse().map((activity) => (
          <ToolActivityItem key={activity.id} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ToolActivityItem({ activity }) {
  const icon = TOOL_ICONS[activity.tool] || '⚡';
  const label = TOOL_LABELS[activity.tool] || activity.tool;
  const isRunning = activity.status === 'running';

  // Get a preview of the input/result
  const getPreview = () => {
    if (activity.tool === 'web_search' && activity.input?.query) {
      return `"${activity.input.query}"`;
    }
    if (activity.tool === 'save_research_note' && activity.input?.topic) {
      return activity.input.topic;
    }
    if (activity.tool === 'create_outline' && activity.input?.title) {
      return activity.input.title;
    }
    if (activity.tool === 'write_section' && activity.input?.section_heading) {
      return activity.input.section_heading;
    }
    if (activity.result?.wordCount) {
      return `${activity.result.wordCount} words`;
    }
    return null;
  };

  const preview = getPreview();

  return (
    <div
      className={`
        flex items-start gap-3 p-2 rounded-lg text-sm
        ${isRunning ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}
      `}
    >
      <span className="text-lg">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-medium ${isRunning ? 'text-blue-700' : 'text-gray-700'}`}>
            {label}
          </span>
          {isRunning && (
            <div className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
        {preview && (
          <p className="text-xs text-gray-500 truncate mt-0.5">{preview}</p>
        )}
      </div>
      {!isRunning && activity.result?.success && (
        <span className="text-green-500 text-xs">✓</span>
      )}
    </div>
  );
}

export default ToolActivityLog;
