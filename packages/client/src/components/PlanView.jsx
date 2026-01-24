import { useAgent } from '../context/AgentContext.jsx';

function PlanView() {
  const { state } = useAgent();
  const { plan, currentStep, completedSteps } = state;

  if (!plan) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Plan</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-sm text-gray-500">Creating plan...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="font-semibold text-gray-900 mb-1">Plan</h3>
      <p className="text-sm text-gray-500 mb-4">{plan.approach}</p>

      <div className="space-y-2">
        {plan.steps.map((step) => {
          const isCompleted = step.id <= completedSteps;
          const isActive = currentStep?.id === step.id;

          return (
            <StepItem
              key={step.id}
              step={step}
              isCompleted={isCompleted}
              isActive={isActive}
            />
          );
        })}
      </div>
    </div>
  );
}

function StepItem({ step, isCompleted, isActive }) {
  return (
    <div
      className={`
        flex items-start gap-3 p-2 rounded-lg transition-colors
        ${isActive ? 'bg-blue-50 border border-blue-200' :
          isCompleted ? 'bg-gray-50' : 'bg-white'}
      `}
    >
      {/* Status indicator */}
      <div className="flex-shrink-0 mt-0.5">
        {isCompleted ? (
          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        ) : isActive ? (
          <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
        )}
      </div>

      {/* Step content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={`
              text-xs px-2 py-0.5 rounded-full font-medium
              ${step.phase === 'research' ? 'bg-purple-100 text-purple-700' :
                step.phase === 'outline' ? 'bg-yellow-100 text-yellow-700' :
                step.phase === 'write' ? 'bg-blue-100 text-blue-700' :
                step.phase === 'edit' ? 'bg-orange-100 text-orange-700' :
                'bg-green-100 text-green-700'}
            `}
          >
            {step.phase}
          </span>
          <span className="text-xs text-gray-400">#{step.id}</span>
        </div>
        <p
          className={`
            text-sm mt-1
            ${isCompleted ? 'text-gray-500' : isActive ? 'text-gray-900 font-medium' : 'text-gray-600'}
          `}
        >
          {step.action}
        </p>
      </div>
    </div>
  );
}

export default PlanView;
