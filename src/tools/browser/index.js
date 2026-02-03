import createBrowserNavigate from "./browser_navigate.js";
import createBrowserReadPage from "./browser_read_page.js";
import createBrowserClick from "./browser_click.js";
import createBrowserType from "./browser_type.js";
import createBrowserSelect from "./browser_select.js";
import createBrowserScroll from "./browser_scroll.js";
import createBrowserBack from "./browser_back.js";
import createBrowserClose from "./browser_close.js";

export const BROWSER_TOOL_NAMES = [
  "browser_navigate",
  "browser_read_page",
  "browser_click",
  "browser_type",
  "browser_select",
  "browser_scroll",
  "browser_back",
  "browser_close"
];

export function createBrowserTools(session) {
  return [
    createBrowserNavigate(session),
    createBrowserReadPage(session),
    createBrowserClick(session),
    createBrowserType(session),
    createBrowserSelect(session),
    createBrowserScroll(session),
    createBrowserBack(session),
    createBrowserClose(session)
  ];
}
