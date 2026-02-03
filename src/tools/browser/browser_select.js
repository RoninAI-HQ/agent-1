export default function createBrowserSelect(session) {
  return {
    name: "browser_select",
    schema: {
      name: "browser_select",
      description:
        "Select an option from a dropdown/select element on the current page.",
      input_schema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description: "CSS selector of the <select> element"
          },
          value: {
            type: "string",
            description: "The option text or value to select"
          }
        },
        required: ["selector", "value"]
      }
    },
    execute: async ({ selector, value }) => {
      const page = await session.getPage();

      try {
        const result = await page.evaluate(
          (sel, val) => {
            const select = document.querySelector(sel);
            if (!select || select.tagName !== "SELECT") {
              return { success: false, error: "Element is not a <select>" };
            }
            // Try by value attribute
            const byValue = Array.from(select.options).find(
              (o) => o.value === val
            );
            if (byValue) {
              select.value = byValue.value;
              select.dispatchEvent(new Event("change", { bubbles: true }));
              return { success: true, selected: byValue.text };
            }
            // Try by visible text (case-insensitive)
            const byText = Array.from(select.options).find((o) =>
              o.text.toLowerCase().includes(val.toLowerCase())
            );
            if (byText) {
              select.value = byText.value;
              select.dispatchEvent(new Event("change", { bubbles: true }));
              return { success: true, selected: byText.text };
            }
            return {
              success: false,
              error: `No option matching "${val}". Available: ${Array.from(select.options).map((o) => o.text).join(", ")}`
            };
          },
          selector,
          value
        );

        return result;
      } catch (error) {
        return { success: false, error: `Select failed: ${error.message}` };
      }
    }
  };
}
