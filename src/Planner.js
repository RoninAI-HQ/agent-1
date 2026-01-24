import client from "./client.js";

class Planner {
  async createPlan(goal, context = {}) {
    console.log("\nCreating plan...");

    const prompt = `You are a planning agent for a blog writing system.

GOAL: ${goal}

AVAILABLE TOOLS:
- web_search: Search for information
- save_research_note: Save important research findings
- create_outline: Create article structure
- write_section: Write a section of the article
- compile_draft: Combine sections into full draft
- edit_draft: Revise and improve the draft
- finalize_article: Complete the article

Create a detailed plan. Output ONLY valid JSON:

{
  "goal": "the goal",
  "approach": "brief description of approach",
  "steps": [
    {
      "id": 1,
      "phase": "research|outline|write|edit|finalize",
      "action": "what to do",
      "tool": "tool_name",
      "details": "specific details for this step"
    }
  ]
}

Create a realistic plan with steps covering research, outlining, writing, editing, and finalizing.`;

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    });

    const text = response.content[0].text;

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const plan = JSON.parse(jsonMatch[0]);
      console.log(`   Created plan with ${plan.steps.length} steps`);
      return plan;
    } catch (e) {
      throw new Error(`Failed to parse plan: ${e.message}`);
    }
  }
}

export default Planner;
