// Tree drawing symbols
export const TREE = {
  bullet: "●",
  branch: "├",
  lastBranch: "└",
  vertical: "│",
  arrow: "↳"
};

// ANSI color codes
export const fmt = {
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m"
};

// Maps tool/phase names to human-readable action verbs
export const ACTION_VERBS = {
  // Core tools
  think: "Thinking",
  store_result: "Storing result",
  complete_task: "Completing task",
  understand: "Understanding",
  save_note: "Saving note",

  // Browser tools
  browser_navigate: "Navigating to",
  browser_read_page: "Reading page",
  browser_click: "Clicking",
  browser_type: "Typing",
  browser_scroll: "Scrolling",
  browser_screenshot: "Taking screenshot",
  browser_wait: "Waiting",

  // Web tools
  web_search: "Searching the web"
};
