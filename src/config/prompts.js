/**
 * Agent Prompts
 *
 * System prompts and prompt builders for the agent.
 */

/**
 * Build a system prompt for executing a step
 * @param {Object} step - The step to execute
 * @param {Object} context - Context from working memory
 * @param {Object} memory - Direct memory reference for additional data
 * @returns {string} System prompt
 */
export function stepPrompt(step, context, memory) {
  const notesSection = context.state.notes?.length > 0
    ? `
NOTES COLLECTED:
${context.state.notes.map(n => `- [${n.category}]: ${n.content}`).join("\n")}
`
    : "";

  const thoughtsSection = context.state.thoughts?.length > 0
    ? `
REASONING SO FAR:
${context.state.thoughts.map(t => `- ${t.thought}`).join("\n")}
`
    : "";

  const resultsSection = context.state.results && Object.keys(context.state.results).length > 0
    ? `
STORED RESULTS:
${Object.entries(context.state.results).map(([k, v]) => `- ${k}: ${typeof v === 'string' && v.length > 200 ? v.substring(0, 200) + '...' : v}`).join("\n")}
`
    : "";

  return `You are a capable assistant executing a specific step in a planned workflow.

CURRENT GOAL: ${context.goal}

CURRENT STEP: ${step.action}
PHASE: ${step.phase}
TOOL TO USE: ${step.tool}
DETAILS: ${step.details}

PROGRESS: Step ${context.completedSteps + 1} of ${context.totalSteps}
${notesSection}${thoughtsSection}${resultsSection}
Execute this step by using the ${step.tool} tool. Be thorough and accurate.

Guidelines:
- Focus on completing the specific step described
- Use the designated tool to accomplish the step
- Be precise and provide detailed, useful outputs
- If this is the final step, use complete_task to deliver the result
`;
}

/**
 * Build a planning prompt for creating a task plan
 * @param {string} goal - The task goal/prompt
 * @param {string} toolDescriptions - Available tools description
 * @param {string} phaseList - Available phases
 * @returns {string} Planning prompt
 */
export function planningPrompt(goal, toolDescriptions, phaseList) {
  return `You are a planning agent that creates step-by-step plans to accomplish tasks.

GOAL: ${goal}

AVAILABLE TOOLS:
${toolDescriptions}

AVAILABLE PHASES: ${phaseList}

Your job is to create a plan that will accomplish the goal. Think about:
1. What information needs to be gathered? (understand phase)
2. What work needs to be done? (work phase)
3. How should the result be delivered? (deliver phase)

Create a detailed plan. Output ONLY valid JSON:

{
  "goal": "the goal",
  "approach": "brief description of your approach",
  "steps": [
    {
      "id": 1,
      "phase": "understand|work|deliver",
      "action": "what to do",
      "tool": "tool_name",
      "details": "specific details for this step"
    }
  ]
}

Important guidelines:
- Use "understand" phase for research, gathering information, and analysis
- Use "work" phase for processing, computing, and creating outputs
- Use "deliver" phase for the final step that completes the task
- The final step should ALWAYS use the "complete_task" tool to deliver the answer
- Use "think" tool when you need to reason through something complex
- Use "save_note" to record important findings or decisions
- Use "store_result" to save intermediate outputs needed later
- Use "web_search" when you need current information from the internet
- Use "browser_navigate" to open web pages when you need to interact with a website (not just read it)
- After navigating, ALWAYS use "browser_read_page" to understand what is on the page before interacting
- Use "browser_click", "browser_type", "browser_select" to interact with page elements using CSS selectors from browser_read_page
- Use "browser_scroll" to see more content on long pages, then "browser_read_page" again
- Use "browser_back" to return to the previous page
- Use "browser_close" when you are done with all browser tasks
- Prefer "web_search" for simple information lookups; use browser tools when you need to interact with a specific website
- A single step can use multiple browser tools in sequence (e.g. navigate, then read, then click, then read again)

Create a realistic, efficient plan that accomplishes the goal.`;
}

export default { stepPrompt, planningPrompt };
