import { EventTypes } from "../../events.js";

export default function createBrowserClose(session) {
  return {
    name: "browser_close",
    schema: {
      name: "browser_close",
      description:
        "Close the browser and end the browsing session. Use this when you are done with all browser tasks.",
      input_schema: {
        type: "object",
        properties: {},
        required: []
      }
    },
    execute: async (_input, { emit }) => {
      if (!session.isActive()) {
        return { success: true, message: "Browser was not open" };
      }

      await session.close();
      emit(EventTypes.BROWSER_CLOSED, {});

      return {
        success: true,
        message: "Browser closed"
      };
    }
  };
}
