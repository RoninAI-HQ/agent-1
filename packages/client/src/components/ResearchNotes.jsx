import { useState } from 'react';
import { useAgent } from '../context/AgentContext.jsx';

function ResearchNotes() {
  const { state } = useAgent();
  const { research } = state;
  const [expandedIndex, setExpandedIndex] = useState(null);

  if (research.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-900">Research Notes</h3>
        <span className="text-sm text-gray-500">{research.length} notes</span>
      </div>

      <div className="space-y-2">
        {research.map((note, index) => (
          <ResearchNoteItem
            key={index}
            note={note}
            isExpanded={expandedIndex === index}
            onToggle={() => setExpandedIndex(expandedIndex === index ? null : index)}
          />
        ))}
      </div>
    </div>
  );
}

function ResearchNoteItem({ note, isExpanded, onToggle }) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-purple-500">📌</span>
          <span className="font-medium text-gray-900 text-sm">{note.topic}</span>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-100">
          <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{note.content}</p>
          {note.source && (
            <p className="text-xs text-gray-400 mt-2">Source: {note.source}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default ResearchNotes;
