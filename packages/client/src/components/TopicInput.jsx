import { useState } from 'react';
import { useAgent } from '../context/AgentContext.jsx';

function TopicInput() {
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { createSession, startAgent } = useAgent();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create session first
      const sessionId = await createSession();

      // Start the agent
      await startAgent(sessionId, topic.trim());
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const exampleTopics = [
    "The future of AI in healthcare",
    "How to build a successful remote team",
    "Sustainable living tips for beginners",
    "The psychology of habit formation"
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          What would you like to write about?
        </h2>
        <p className="text-gray-600">
          Enter a topic and our AI agent will research, outline, and write a complete blog article for you.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Enter your blog topic or idea..."
            className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-400"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 px-4 py-2 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !topic.trim()}
          className="w-full py-3 px-6 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <LoadingSpinner />
              Starting Agent...
            </span>
          ) : (
            'Start Writing'
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-sm text-gray-500 mb-3">Try an example:</p>
        <div className="flex flex-wrap gap-2">
          {exampleTopics.map((example) => (
            <button
              key={example}
              onClick={() => setTopic(example)}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
        fill="none"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export default TopicInput;
