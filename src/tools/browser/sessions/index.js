import LightpandaSession from "./LightpandaSession.js";
import ChromeSession from "./ChromeSession.js";

const VALID_TYPES = ["lightpanda", "chrome"];

export { VALID_TYPES };

export function createBrowserSession(type) {
  switch (type) {
    case "lightpanda":
      return new LightpandaSession();
    case "chrome":
      return new ChromeSession();
    default:
      throw new Error(
        `Unknown browser type: "${type}". Valid types: ${VALID_TYPES.join(", ")}`
      );
  }
}
