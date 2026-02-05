import { TREE, fmt } from "./constants.js";
import TerminalWriter from "./TerminalWriter.js";
import { truncate, formatToolInput, formatToolResult, getActionVerb, formatElapsed } from "./formatters.js";

/**
 * Spinner for in-progress activities
 */
class Spinner {
  constructor(writer) {
    this.writer = writer;
    this.frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    this.current = 0;
    this.interval = null;
    this.text = "";
    this.prefix = "";
  }

  start(text, prefix = "", color = fmt.cyan) {
    if (!this.writer.isTTY) return;

    this.text = text;
    this.prefix = prefix;
    this.color = color;
    this.current = 0;
    this.render();
    this.interval = setInterval(() => {
      this.current = (this.current + 1) % this.frames.length;
      this.render();
    }, 80);
  }

  render() {
    const frame = this.frames[this.current];
    this.writer.carriageReturn();
    this.writer.write(`${this.prefix}${this.color}${frame}${fmt.reset} ${this.text}\x1b[K`);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    if (this.writer.isTTY) {
      this.writer.clearLine();
    }
  }
}

/**
 * Core renderer for hierarchical progress display
 */
export default class ProgressRenderer {
  constructor(writer = new TerminalWriter()) {
    this.writer = writer;
    this.spinner = null;
    this.currentStep = null;
    this.stepActivityCount = 0;
    this.lastThought = null;

    // Tools that use spinner animation
    this.spinnerTools = ["think", "store_result", "save_note"];

    // Tools that produce no output
    this.silentTools = ["complete_task"];
  }

  /**
   * Attach to agent and subscribe to events
   */
  attach(agent) {
    agent.on("plan:created", (data) => this.onPlanCreated(data));
    agent.on("step:start", (data) => this.onStepStart(data));
    agent.on("step:complete", (data) => this.onStepComplete(data));
    agent.on("tool:start", (data) => this.onToolStart(data));
    agent.on("tool:result", (data) => this.onToolResult(data));
    agent.on("thought:recorded", (data) => this.onThoughtRecorded(data));
    agent.on("note:saved", (data) => this.onNoteSaved(data));
    agent.on("task:completed", (data) => this.onTaskCompleted(data));
    agent.on("approval:denied", (data) => this.onApprovalDenied(data));
    agent.on("browser:closed", () => this.onBrowserClosed());
  }

  /**
   * Render provider/model header
   */
  renderProvider(provider, model) {
    this.writer.writeLine();
    this.writer.writeLine(
      `${fmt.cyan}${TREE.bullet}${fmt.reset} ${fmt.bold}Provider${fmt.reset}(${provider}) ${fmt.dim}model=${model}${fmt.reset}`
    );
  }

  /**
   * Render task display
   */
  renderTask(task) {
    const words = task.split(/\s+/);
    const displayTask = words.length > 50 ? words.slice(0, 50).join(" ") + "…" : task;
    this.writer.writeLine();
    this.writer.writeLine(
      `${fmt.blue}${TREE.bullet}${fmt.reset} ${fmt.bold}Task${fmt.reset}(${displayTask})`
    );
    this.writer.writeLine();
  }

  /**
   * Render debug directory info
   */
  renderDebug(dir) {
    this.writer.writeLine(
      `${fmt.yellow}${TREE.bullet}${fmt.reset} ${fmt.bold}Debug${fmt.reset} snapshots → ${fmt.dim}${dir}/${fmt.reset}`
    );
  }

  /**
   * Render error message
   */
  renderError(message) {
    this.writer.writeLine(
      `${fmt.red}${TREE.bullet}${fmt.reset} ${fmt.bold}Error${fmt.reset} ${message}`
    );
  }

  /**
   * Render abort message
   */
  renderAborted(message) {
    this.writer.writeLine();
    this.writer.writeLine(
      `${fmt.red}${TREE.bullet}${fmt.reset} ${fmt.bold}Aborted${fmt.reset} ${message}`
    );
  }

  // --- Event Handlers ---

  onPlanCreated({ plan }) {
    this.writer.writeLine(
      `${fmt.green}${TREE.bullet}${fmt.reset} ${fmt.bold}Plan${fmt.reset}(${plan.approach})`
    );

    const steps = plan.steps || [];
    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const isLast = i === steps.length - 1;
      const connector = isLast ? TREE.lastBranch : TREE.branch;
      this.writer.writeLine(
        `  ${connector} ${fmt.dim}${step.id}.${fmt.reset} ${step.action} ${fmt.dim}(${step.tool})${fmt.reset}`
      );
    }
  }

  onStepStart({ stepId, totalSteps, action }) {
    this.currentStep = { stepId, totalSteps, action };
    this.stepActivityCount = 0;
    this.writer.writeLine();
    this.writer.writeLine(
      `${fmt.blue}${TREE.bullet}${fmt.reset} ${fmt.bold}Step ${stepId}/${totalSteps}${fmt.reset} ${action}`
    );
  }

  onStepComplete() {
    this.currentStep = null;
    this.stepActivityCount = 0;
  }

  onToolStart({ tool, input }) {
    if (this.silentTools.includes(tool)) return;

    const verb = getActionVerb(tool);
    const inputDisplay = formatToolInput(tool, input);

    if (this.spinnerTools.includes(tool)) {
      this.stopSpinner();
      this.spinner = new Spinner(this.writer);
      const prefix = `  ${TREE.lastBranch} ${TREE.bullet} `;
      const text = inputDisplay
        ? `${fmt.dim}${verb}...${fmt.reset}`
        : `${fmt.dim}${verb}...${fmt.reset}`;
      this.spinner.start(text, prefix);
      return;
    }

    // Regular tool display
    this.writeSubItem(`${fmt.bold}${verb}${fmt.reset}${inputDisplay ? "..." : ""}`);
    if (inputDisplay) {
      this.writeSubSubItem(`${fmt.dim}${inputDisplay}${fmt.reset}`);
    }
  }

  onToolResult({ tool, result }) {
    if (this.silentTools.includes(tool)) return;

    if (this.spinner) {
      this.stopSpinner();

      // Show final result for spinner tools
      let displayText;
      if (tool === "think" && this.lastThought) {
        displayText = truncate(this.lastThought, 60);
        this.lastThought = null;
      } else {
        displayText = getActionVerb(tool);
      }

      this.writeSubItem(`${fmt.green}${TREE.bullet}${fmt.reset} ${fmt.dim}${displayText}${fmt.reset}`);
      return;
    }

    // Show result for non-spinner tools
    const resultDisplay = formatToolResult(tool, result);
    if (resultDisplay) {
      this.writeSubSubItem(`${fmt.dim}${TREE.arrow} ${resultDisplay}${fmt.reset}`);
    }
  }

  onThoughtRecorded({ thought }) {
    this.lastThought = thought?.thought || null;
  }

  onNoteSaved({ note }) {
    this.stopSpinner();
    const content = truncate(note.content || "", 60);
    this.writeSubItem(
      `${fmt.green}${TREE.bullet}${fmt.reset} ${fmt.bold}Note${fmt.reset} [${note.category}] ${fmt.dim}${content}${fmt.reset}`
    );
  }

  onTaskCompleted({ summary }) {
    this.writeSubItem(`${fmt.green}${TREE.bullet}${fmt.reset} ${fmt.bold}Done${fmt.reset} ${summary}`);
  }

  onApprovalDenied({ tool }) {
    this.writeSubItem(`${fmt.red}${TREE.bullet}${fmt.reset} ${fmt.bold}Denied${fmt.reset} tool '${tool}' was not approved`);
  }

  onBrowserClosed() {
    this.writeSubItem(`${fmt.dim}Browser closed${fmt.reset}`);
  }

  // --- Helpers ---

  writeSubItem(text) {
    this.writer.writeLine(`  ${TREE.lastBranch} ${text}`);
  }

  writeSubSubItem(text) {
    this.writer.writeLine(`      ${text}`);
  }

  stopSpinner() {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  /**
   * Render final result
   */
  renderResult(result, elapsed) {
    this.writer.writeLine();
    this.writer.writeLine(
      `${fmt.green}${TREE.bullet}${fmt.reset} ${fmt.bold}Result${fmt.reset} ${fmt.dim}(${formatElapsed(elapsed)})${fmt.reset}`
    );

    if (result.answer) {
      this.writer.writeLine(result.answer);
    } else {
      this.writer.writeLine(JSON.stringify(result, null, 2));
    }

    const stats = result.stats || {};
    const statParts = [];
    if (stats.totalSteps) statParts.push(`${stats.completedSteps}/${stats.totalSteps} steps`);
    if (stats.notesCount) statParts.push(`${stats.notesCount} notes`);
    if (stats.thoughtsCount) statParts.push(`${stats.thoughtsCount} thoughts`);
    if (stats.resultsCount) statParts.push(`${stats.resultsCount} results`);

    if (statParts.length > 0) {
      this.writer.writeLine();
      this.writer.writeLine(`  ${fmt.dim}${statParts.join(" · ")}${fmt.reset}`);
    }
  }
}
