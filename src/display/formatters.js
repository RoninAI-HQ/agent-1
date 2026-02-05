import { ACTION_VERBS } from "./constants.js";

/**
 * Truncate text to maxLength, adding ellipsis if needed
 */
export function truncate(text, maxLength = 60) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + "...";
}

/**
 * Extract displayable input from a tool call
 */
export function formatToolInput(tool, input) {
  if (!input) return "";

  switch (tool) {
    case "web_search":
      return input.query ? `"${input.query}"` : "";

    case "browser_navigate":
      return input.url || "";

    case "browser_click":
      return input.selector || input.text || "";

    case "browser_type":
      return input.text ? truncate(input.text, 40) : "";

    case "think":
      return input.thought ? truncate(input.thought, 50) : "";

    case "save_note":
      return input.category
        ? `[${input.category}] ${truncate(input.content || "", 40)}`
        : truncate(input.content || "", 50);

    case "store_result":
      return input.key || "";

    default:
      return "";
  }
}

/**
 * Extract displayable result summary from a tool result
 */
export function formatToolResult(tool, result) {
  if (!result) return "";

  switch (tool) {
    case "browser_navigate":
      if (result.success && result.title) {
        return `"${truncate(result.title, 50)}"`;
      }
      return result.success ? "loaded" : "failed";

    case "browser_read_page":
      if (result.success && result.title) {
        return `"${truncate(result.title, 40)}" (${truncate(result.url || "", 30)})`;
      }
      return result.success ? "read" : "failed";

    case "web_search":
      if (result.results && Array.isArray(result.results)) {
        return `${result.results.length} results`;
      }
      return "";

    case "think":
      return result.thought ? truncate(result.thought, 60) : "";

    case "save_note":
      return result.success ? "saved" : "failed";

    case "store_result":
      return result.success ? "stored" : "failed";

    default:
      if (typeof result === "string") {
        return truncate(result, 60);
      }
      return "";
  }
}

/**
 * Get action verb for a tool
 */
export function getActionVerb(tool) {
  return ACTION_VERBS[tool] || tool;
}

/**
 * Format elapsed time in human-readable format
 */
export function formatElapsed(ms) {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = (seconds % 60).toFixed(1);
  return `${minutes}m ${remainingSeconds}s`;
}
