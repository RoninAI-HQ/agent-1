export default function createBrowserType(session) {
  return {
    name: "browser_type",
    schema: {
      name: "browser_type",
      description:
        "Type text into a form field on the current page. Clears the field first by default.",
      input_schema: {
        type: "object",
        properties: {
          selector: {
            type: "string",
            description:
              "CSS selector of the input field (from browser_read_page output)"
          },
          value: {
            type: "string",
            description: "The text to type into the field"
          },
          clearFirst: {
            type: "boolean",
            description:
              "Whether to clear the field before typing (default: true)"
          }
        },
        required: ["selector", "value"]
      }
    },
    execute: async ({ selector, value, clearFirst = true }) => {
      const page = await session.getPage();

      try {
        if (clearFirst) {
          await page.click(selector, { clickCount: 3 });
        }
        await page.type(selector, value);

        const display =
          value.length > 50 ? value.substring(0, 50) + "..." : value;
        return {
          success: true,
          message: `Typed "${display}" into ${selector}`
        };
      } catch (error) {
        return {
          success: false,
          error: `Type failed: ${error.message}`
        };
      }
    }
  };
}
