export default function createBrowserNavigate(session) {
  return {
    name: "browser_navigate",
    schema: {
      name: "browser_navigate",
      description:
        "Navigate the browser to a URL. Opens a headless browser if one isn't already open. Returns the page title and URL after navigation.",
      input_schema: {
        type: "object",
        properties: {
          url: {
            type: "string",
            description:
              "The URL to navigate to (must include protocol, e.g. https://)"
          }
        },
        required: ["url"]
      }
    },
    execute: async ({ url }) => {
      try {
        const page = await session.getPage();
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
        const title = await page.title();
        const finalUrl = page.url();

        return {
          success: true,
          url: finalUrl,
          title,
          message: `Navigated to "${title}" (${finalUrl})`
        };
      } catch (error) {
        return {
          success: false,
          error: `Navigation failed: ${error.message}`
        };
      }
    }
  };
}
