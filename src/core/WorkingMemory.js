/**
 * WorkingMemory - Generic key-value state storage for agents
 *
 * Provides a flexible state management system that can be used
 * by any preset. Maintains plan execution tracking alongside
 * arbitrary key-value state storage.
 */
class WorkingMemory {
  constructor(initialState = {}) {
    this.goal = null;
    this.plan = null;
    this.currentStepIndex = 0;
    this.stepResults = {};
    this.state = { ...initialState };
  }

  // ============ Key-Value State Methods ============

  /**
   * Get a value from state
   * @param {string} key - State key
   * @returns {*} Value or undefined
   */
  get(key) {
    return this.state[key];
  }

  /**
   * Set a value in state
   * @param {string} key - State key
   * @param {*} value - Value to store
   */
  set(key, value) {
    this.state[key] = value;
  }

  /**
   * Update a value using a function
   * @param {string} key - State key
   * @param {Function} fn - Update function (currentValue) => newValue
   */
  update(key, fn) {
    this.state[key] = fn(this.state[key]);
  }

  /**
   * Check if a key exists in state
   * @param {string} key - State key
   * @returns {boolean}
   */
  has(key) {
    return key in this.state;
  }

  /**
   * Delete a key from state
   * @param {string} key - State key
   * @returns {boolean} True if key existed
   */
  delete(key) {
    if (key in this.state) {
      delete this.state[key];
      return true;
    }
    return false;
  }

  /**
   * Get all state keys
   * @returns {Array<string>}
   */
  keys() {
    return Object.keys(this.state);
  }

  // ============ Plan Management Methods ============

  /**
   * Set the goal and reset state
   * @param {string} goal - The agent's goal
   * @param {Object} [initialState] - Optional initial state
   */
  setGoal(goal, initialState = {}) {
    this.goal = goal;
    this.currentStepIndex = 0;
    this.stepResults = {};
    this.state = { ...initialState };
  }

  /**
   * Set the execution plan
   * @param {Object} plan - Plan with steps array
   */
  setPlan(plan) {
    this.plan = plan;
  }

  /**
   * Get the current step to execute
   * @returns {Object|null} Current step or null if complete
   */
  getCurrentStep() {
    if (!this.plan || this.currentStepIndex >= this.plan.steps.length) {
      return null;
    }
    return this.plan.steps[this.currentStepIndex];
  }

  /**
   * Mark current step as complete and advance
   * @param {*} result - Result of the step
   */
  completeStep(result) {
    this.stepResults[this.currentStepIndex] = result;
    this.currentStepIndex++;
  }

  // ============ Context Methods ============

  /**
   * Get context for prompts and decisions
   * @returns {Object} Context object
   */
  getContext() {
    return {
      goal: this.goal,
      plan: this.plan,
      currentStep: this.getCurrentStep(),
      completedSteps: this.currentStepIndex,
      totalSteps: this.plan?.steps?.length || 0,
      state: { ...this.state }
    };
  }

  /**
   * Get full state for API responses
   * @param {Function} [extractStats] - Optional function to extract stats from state
   * @returns {Object} Full state object
   */
  getFullState(extractStats) {
    const baseState = {
      goal: this.goal,
      plan: this.plan,
      currentStepIndex: this.currentStepIndex,
      state: { ...this.state }
    };

    if (extractStats) {
      baseState.stats = extractStats(this);
    } else {
      baseState.stats = {
        completedSteps: this.currentStepIndex,
        totalSteps: this.plan?.steps?.length || 0
      };
    }

    return baseState;
  }
}

export default WorkingMemory;
