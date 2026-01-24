class WorkingMemory {
  constructor() {
    this.goal = null;
    this.plan = null;
    this.currentStepIndex = 0;
    this.stepResults = {};
    this.research = [];      // Collected research notes
    this.outline = null;     // Article outline
    this.draft = null;       // Current draft
    this.finalArticle = null;
  }

  setGoal(goal) {
    this.goal = goal;
    this.currentStepIndex = 0;
    this.stepResults = {};
    this.research = [];
    this.outline = null;
    this.draft = null;
  }

  setPlan(plan) {
    this.plan = plan;
  }

  getCurrentStep() {
    if (!this.plan || this.currentStepIndex >= this.plan.steps.length) {
      return null;
    }
    return this.plan.steps[this.currentStepIndex];
  }

  completeStep(result) {
    this.stepResults[this.currentStepIndex] = result;
    this.currentStepIndex++;
  }

  addResearch(note) {
    this.research.push(note);
  }

  getContext() {
    return {
      goal: this.goal,
      plan: this.plan,
      currentStep: this.getCurrentStep(),
      completedSteps: this.currentStepIndex,
      totalSteps: this.plan?.steps?.length || 0,
      researchNotes: this.research,
      hasOutline: !!this.outline,
      hasDraft: !!this.draft,
    };
  }
}

export default WorkingMemory;
