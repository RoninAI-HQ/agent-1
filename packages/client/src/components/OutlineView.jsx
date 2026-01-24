import { useAgent } from '../context/AgentContext.jsx';

function OutlineView() {
  const { state } = useAgent();
  const { outline } = state;

  if (!outline) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-3">Article Outline</h3>

      <div className="mb-4">
        <h4 className="text-lg font-medium text-gray-800">{outline.title}</h4>
        {outline.target_length && (
          <p className="text-sm text-gray-500 mt-1">Target: {outline.target_length}</p>
        )}
      </div>

      <div className="space-y-3">
        {outline.sections?.map((section, index) => (
          <OutlineSection key={index} section={section} index={index + 1} />
        ))}
      </div>
    </div>
  );
}

function OutlineSection({ section, index }) {
  return (
    <div className="border-l-2 border-blue-200 pl-4">
      <div className="flex items-start gap-2">
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-medium flex items-center justify-center">
          {index}
        </span>
        <div>
          <h5 className="font-medium text-gray-800">{section.heading}</h5>
          {section.key_points && section.key_points.length > 0 && (
            <ul className="mt-2 space-y-1">
              {section.key_points.map((point, pointIndex) => (
                <li key={pointIndex} className="text-sm text-gray-600 flex items-start gap-2">
                  <span className="text-gray-400 mt-1">•</span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default OutlineView;
