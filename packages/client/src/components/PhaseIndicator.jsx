import { useAgent } from '../context/AgentContext.jsx';

const PHASES = [
  { id: 'research', label: 'Research', icon: '🔍' },
  { id: 'outline', label: 'Outline', icon: '📋' },
  { id: 'write', label: 'Write', icon: '✍️' },
  { id: 'edit', label: 'Edit', icon: '📝' },
  { id: 'finalize', label: 'Finalize', icon: '✅' }
];

function PhaseIndicator() {
  const { state } = useAgent();
  const { currentPhase, status, completedSteps, totalSteps } = state;

  const getPhaseStatus = (phaseId) => {
    if (status === 'completed') return 'completed';
    if (!currentPhase) return 'pending';

    const currentIndex = PHASES.findIndex(p => p.id === currentPhase);
    const phaseIndex = PHASES.findIndex(p => p.id === phaseId);

    if (phaseIndex < currentIndex) return 'completed';
    if (phaseIndex === currentIndex) return 'active';
    return 'pending';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Progress</h3>
        {totalSteps > 0 && (
          <span className="text-sm text-gray-500">
            Step {completedSteps} of {totalSteps}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        {PHASES.map((phase, index) => {
          const phaseStatus = getPhaseStatus(phase.id);

          return (
            <div key={phase.id} className="flex items-center">
              {/* Phase indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-lg
                    ${phaseStatus === 'completed' ? 'bg-green-100 text-green-600' :
                      phaseStatus === 'active' ? 'bg-blue-100 text-blue-600 ring-2 ring-blue-400 ring-offset-2' :
                      'bg-gray-100 text-gray-400'}
                  `}
                >
                  {phaseStatus === 'completed' ? '✓' : phase.icon}
                </div>
                <span
                  className={`
                    mt-2 text-xs font-medium
                    ${phaseStatus === 'active' ? 'text-blue-600' :
                      phaseStatus === 'completed' ? 'text-green-600' :
                      'text-gray-400'}
                  `}
                >
                  {phase.label}
                </span>
              </div>

              {/* Connector line */}
              {index < PHASES.length - 1 && (
                <div
                  className={`
                    w-12 h-0.5 mx-2
                    ${getPhaseStatus(PHASES[index + 1].id) !== 'pending' ? 'bg-green-300' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PhaseIndicator;
