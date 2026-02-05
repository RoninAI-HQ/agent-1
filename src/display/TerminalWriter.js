import { fmt } from "./constants.js";

/**
 * Low-level terminal control for cursor manipulation and output.
 * Gracefully degrades when stdout is not a TTY.
 */
export default class TerminalWriter {
  constructor(stream = process.stdout) {
    this.stream = stream;
    this.isTTY = stream.isTTY === true;
  }

  /**
   * Write text without a newline
   */
  write(text) {
    this.stream.write(text);
  }

  /**
   * Write text followed by a newline
   */
  writeLine(text = "") {
    this.stream.write(text + "\n");
  }

  /**
   * Clear the current line and move cursor to beginning
   */
  clearLine() {
    if (this.isTTY) {
      this.stream.write("\r\x1b[K");
    }
  }

  /**
   * Move cursor up N lines
   */
  moveUp(n = 1) {
    if (this.isTTY && n > 0) {
      this.stream.write(`\x1b[${n}A`);
    }
  }

  /**
   * Move cursor down N lines
   */
  moveDown(n = 1) {
    if (this.isTTY && n > 0) {
      this.stream.write(`\x1b[${n}B`);
    }
  }

  /**
   * Move cursor to beginning of line
   */
  carriageReturn() {
    if (this.isTTY) {
      this.stream.write("\r");
    }
  }

  /**
   * Get terminal width, defaulting to 80 if not available
   */
  getWidth() {
    return this.stream.columns || 80;
  }

  /**
   * Apply color formatting only if TTY
   */
  color(code, text) {
    if (this.isTTY) {
      return `${code}${text}${fmt.reset}`;
    }
    return text;
  }
}
