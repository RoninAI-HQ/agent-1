import browserSession from "./session.js";
import { EventTypes } from "../../events.js";

export default {
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
    if (!browserSession.isActive()) {
      return { success: true, message: "Browser was not open" };
    }

    await browserSession.close();
    emit(EventTypes.BROWSER_CLOSED, {});

    return {
      success: true,
      message: "Browser closed"
    };
  }
};
