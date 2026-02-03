export default function createBrowserClick(session) {
  return {
    name: "browser_click",
    schema: {
      name: "browser_click",
      description:
        "Click an element on the current page. Provide either a CSS selector (from browser_read_page output) or text to match against visible element text.",
      input_schema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description:
              "CSS selector of the element to click (from browser_read_page output)"
          },
          text: {
            type: "string",
            description:
              "Visible text to match (clicks the first link/button containing this text). Use when you don't have an exact selector."
          }
        },
        required: []
      }
    },
    execute: async ({ selector, text }) => {
      if (!selector && !text) {
        return { success: false, error: "Provide either 'selector' or 'text'" };
      }

      const page = await session.getPage();

      try {
        if (text && !selector) {
          const found = await page.evaluate((searchText) => {
            const lower = searchText.toLowerCase();
            const candidates = [
              ...document.querySelectorAll(
                'a, button, [role="button"], input[type="submit"]'
              )
            ];
            const match = candidates.find((el) => {
              const elText = (el.innerText || el.value || "").toLowerCase();
              return elText.includes(lower);
            });
            if (match) {
              match.setAttribute("data-agent-click-target", "true");
              return true;
            }
            return false;
          }, text);

          if (!found) {
            return {
              success: false,
              error: `No clickable element found with text "${text}"`
            };
          }
          selector = '[data-agent-click-target="true"]';
        }

        await page.click(selector);
        await new Promise((r) => setTimeout(r, 1000));

        // Clean up temp attribute
        await page.evaluate(() => {
          const el = document.querySelector("[data-agent-click-target]");
          if (el) el.removeAttribute("data-agent-click-target");
        }).catch(() => {});

        const title = await page.title();
        const url = page.url();

        return {
          success: true,
          message: `Clicked element. Page is now "${title}" (${url})`,
          url,
          title
        };
      } catch (error) {
        return {
          success: false,
          error: `Click failed: ${error.message}`
        };
      }
    }
  };
}
