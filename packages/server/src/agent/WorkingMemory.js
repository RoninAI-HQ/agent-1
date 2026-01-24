class WorkingMemory {
  constructor() {
    this.goal = null;
    this.plan = null;
    this.currentStepIndex = 0;
    this.stepResults = {};
    this.research = [];      // Collected research notes
    this.outline = null;     // Article outline
    this.sections = {};      // Written sections
    this.draft = null;       // Current draft
    this.finalArticle = null;
  }

  setGoal(goal) {
    this.goal = goal;
    this.currentStepIndex = 0;
    this.stepResults = {};
    this.research = [];
    this.outline = null;
    this.sections = {};
    this.draft = null;
    this.finalArticle = null;
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

  // Get full state for API responses
  getFullState() {
    return {
      goal: this.goal,
      plan: this.plan,
      currentStepIndex: this.currentStepIndex,
      research: this.research,
      outline: this.outline,
      sections: this.sections,
      draft: this.draft,
      finalArticle: this.finalArticle,
      stats: {
        completedSteps: this.currentStepIndex,
        totalSteps: this.plan?.steps?.length || 0,
        researchNotes: this.research.length,
        wordCount: (this.finalArticle || this.draft || "").split(/\s+/).filter(Boolean).length
      }
    };
  }
}

export default WorkingMemory;
