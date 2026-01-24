import { useState } from 'react';
import { useAgent } from '../context/AgentContext.jsx';
import ReactMarkdown from 'react-markdown';

function DraftPreview() {
  const { state } = useAgent();
  const { draft, wordCount, status } = state;
  const [isExpanded, setIsExpanded] = useState(false);

  if (!draft) {
    return null;
  }

  const isLive = status === 'running';

  return (
    <div
      className={`
        bg-white rounded-lg shadow-sm border p-4
        ${isLive ? 'border-blue-300 animate-pulse-border' : 'border-gray-200'}
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900">Draft Preview</h3>
          {isLive && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              Live
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">{wordCount} words</span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {isExpanded ? 'Collapse' : 'Expand'}
          </button>
        </div>
      </div>

      <div
        className={`
          overflow-hidden transition-all duration-300
          ${isExpanded ? 'max-h-none' : 'max-h-64'}
        `}
      >
        <div className="prose prose-sm text-gray-700">
          <ReactMarkdown>{draft}</ReactMarkdown>
        </div>
      </div>

      {!isExpanded && draft.length > 500 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <button
            onClick={() => setIsExpanded(true)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            Show full draft...
          </button>
        </div>
      )}
    </div>
  );
}

export default DraftPreview;
