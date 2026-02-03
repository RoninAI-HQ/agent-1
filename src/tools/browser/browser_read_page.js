const MAX_TEXT_LENGTH = 4000;
const MAX_ELEMENTS = 50;

function extractPageContent(maxText, maxElements) {
  function getSelector(el) {
    if (el.id) return `#${el.id}`;
    if (
      (el.tagName === "INPUT" ||
        el.tagName === "SELECT" ||
        el.tagName === "TEXTAREA") &&
      el.name
    ) {
      return `${el.tagName.toLowerCase()}[name="${el.name}"]`;
    }
    const parts = [];
    let current = el;
    while (current && current !== document.body) {
      let selector = current.tagName.toLowerCase();
      if (current.id) {
        parts.unshift(`#${current.id}`);
        break;
      }
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter(
          (c) => c.tagName === current.tagName
        );
        if (siblings.length > 1) {
          const index = siblings.indexOf(current) + 1;
          selector += `:nth-of-type(${index})`;
        }
      }
      parts.unshift(selector);
      current = current.parentElement;
    }
    if (parts.length === 0) parts.push(el.tagName.toLowerCase());
    return parts.join(" > ");
  }

  const bodyText = document.body?.innerText || "";
  const truncatedText =
    bodyText.length > maxText
      ? bodyText.substring(0, maxText) +
        `\n... [truncated, ${bodyText.length} chars total]`
      : bodyText;

  const linkEls = Array.from(document.querySelectorAll("a[href]"));
  const links = linkEls.slice(0, maxElements).map((a, i) => ({
    ref: `link-${i + 1}`,
    text: (a.innerText || a.textContent || "").trim().substring(0, 80),
    href: a.getAttribute("href"),
    selector: getSelector(a)
  }));

  const buttonEls = Array.from(
    document.querySelectorAll(
      'button, input[type="submit"], input[type="button"], [role="button"]'
    )
  );
  const buttons = buttonEls.slice(0, maxElements).map((btn, i) => ({
    ref: `button-${i + 1}`,
    text: (btn.innerText || btn.value || btn.textContent || "")
      .trim()
      .substring(0, 80),
    selector: getSelector(btn)
  }));

  const inputEls = Array.from(
    document.querySelectorAll(
      'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), textarea, select'
    )
  );
  const inputs = inputEls.slice(0, maxElements).map((inp, i) => {
    const info = {
      ref: `input-${i + 1}`,
      type: inp.type || inp.tagName.toLowerCase(),
      label: "",
      selector: getSelector(inp),
      value: inp.value || ""
    };
    if (inp.id) {
      const label = document.querySelector(`label[for="${inp.id}"]`);
      if (label) info.label = label.innerText.trim();
    }
    if (!info.label && inp.placeholder) info.label = inp.placeholder;
    if (!info.label && inp.name) info.label = inp.name;

    if (inp.tagName === "SELECT") {
      info.options = Array.from(inp.options).map((o) => o.text.trim());
      info.selectedValue =
        inp.options[inp.selectedIndex]?.text.trim() || "";
    }
    return info;
  });

  const scrollTop = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight;
  const viewportHeight = window.innerHeight;

  return {
    title: document.title,
    url: location.href,
    text: truncatedText,
    links: { items: links, total: linkEls.length },
    buttons: { items: buttons, total: buttonEls.length },
    inputs: { items: inputs, total: inputEls.length },
    scroll: { top: scrollTop, height: scrollHeight, viewport: viewportHeight }
  };
}

function formatOutput(data) {
  let out = `URL: ${data.url}\nTitle: ${data.title}\n`;

  out += `\n== PAGE TEXT ==\n${data.text}\n`;

  if (data.links.items.length > 0) {
    const showing =
      data.links.total > data.links.items.length
        ? `, showing first ${data.links.items.length}`
        : "";
    out += `\n== LINKS (${data.links.total} found${showing}) ==\n`;
    for (const l of data.links.items) {
      out += `[${l.ref}] "${l.text}" -> ${l.href} (selector: ${l.selector})\n`;
    }
  }

  if (data.buttons.items.length > 0) {
    out += `\n== BUTTONS (${data.buttons.total} found) ==\n`;
    for (const b of data.buttons.items) {
      out += `[${b.ref}] "${b.text}" (selector: ${b.selector})\n`;
    }
  }

  if (data.inputs.items.length > 0) {
    out += `\n== FORM INPUTS (${data.inputs.total} found) ==\n`;
    for (const inp of data.inputs.items) {
      let line = `[${inp.ref}] ${inp.type} "${inp.label}" (selector: ${inp.selector}) value="${inp.value}"`;
      if (inp.options) {
        line += ` options: [${inp.options.map((o) => `"${o}"`).join(", ")}] selected: "${inp.selectedValue}"`;
      }
      out += line + "\n";
    }
  }

  const scrollable = data.scroll.height > data.scroll.viewport;
  const scrollPct = scrollable
    ? Math.round(
        (data.scroll.top / (data.scroll.height - data.scroll.viewport)) * 100
      )
    : 0;
  const scrollPos =
    data.scroll.top === 0
      ? "top"
      : scrollPct >= 95
        ? "bottom"
        : `${scrollPct}%`;
  out += `\n== PAGE INFO ==\nScroll position: ${data.scroll.top}/${data.scroll.height} (${scrollPos})\n`;

  return out;
}

export default function createBrowserReadPage(session) {
  return {
    name: "browser_read_page",
    schema: {
      name: "browser_read_page",
      description:
        "Read the current browser page content. Returns visible text, links with CSS selectors, buttons, form inputs, and scroll position. Use this after navigating to understand what is on the page before interacting with it.",
      input_schema: {
        type: "object",
        properties: {},
        required: []
      }
    },
    execute: async () => {
      try {
        const page = await session.getPage();
        const data = await page.evaluate(
          extractPageContent,
          MAX_TEXT_LENGTH,
          MAX_ELEMENTS
        );
        const formatted = formatOutput(data);

        return {
          success: true,
          url: data.url,
          title: data.title,
          content: formatted
        };
      } catch (error) {
        return {
          success: false,
          error: `Read page failed: ${error.message}`
        };
      }
    }
  };
}
