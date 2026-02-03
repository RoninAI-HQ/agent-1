import browserSession from "./session.js";

export default {
  name: "browser_scroll",
  schema: {
    name: "browser_scroll",
    description:
      "Scroll the current page up or down. Use this to see more content on long pages.",
    input_schema: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["down", "up"],
          description: "Direction to scroll"
        },
        amount: {
          type: "string",
          enum: ["page", "half"],
          description:
            "How much to scroll: 'page' for a full viewport, 'half' for half (default: page)"
        }
      },
      required: ["direction"]
    }
  },
  execute: async ({ direction, amount = "page" }) => {
    const page = await browserSession.getPage();

    try {
      const scrollInfo = await page.evaluate(
        (dir, amt) => {
          const viewport = window.innerHeight;
          const pixels = amt === "half" ? Math.round(viewport / 2) : viewport;
          const delta = dir === "down" ? pixels : -pixels;
          window.scrollBy(0, delta);

          return {
            scrollTop: window.scrollY,
            scrollHeight: document.documentElement.scrollHeight,
            viewport
          };
        },
        direction,
        amount
      );

      const atTop = scrollInfo.scrollTop === 0;
      const atBottom =
        scrollInfo.scrollTop + scrollInfo.viewport >=
        scrollInfo.scrollHeight - 10;
      const scrollable = scrollInfo.scrollHeight > scrollInfo.viewport;
      const pct = scrollable
        ? Math.round(
            (scrollInfo.scrollTop /
              (scrollInfo.scrollHeight - scrollInfo.viewport)) *
              100
          )
        : 0;
      const position = atTop ? "top" : atBottom ? "bottom" : `${pct}%`;

      return {
        success: true,
        message: `Scrolled ${direction}. Position: ${position} (${scrollInfo.scrollTop}/${scrollInfo.scrollHeight})`,
        atTop,
        atBottom
      };
    } catch (error) {
      return {
        success: false,
        error: `Scroll failed: ${error.message}`
      };
    }
  }
};
