export default function createBrowserBack(session) {
  return {
    name: "browser_back",
    schema: {
      name: "browser_back",
      description: "Go back to the previous page in browser history.",
      input_schema: {
        type: "object",
        properties: {},
        required: []
      }
    },
    execute: async () => {
      const page = await session.getPage();

      try {
        await page.goBack({ waitUntil: "domcontentloaded", timeout: 15000 });
        const title = await page.title();
        const url = page.url();

        return {
          success: true,
          message: `Went back to "${title}" (${url})`,
          url,
          title
        };
      } catch (error) {
        return {
          success: false,
          error: `Go back failed: ${error.message}`
        };
      }
    }
  };
}
