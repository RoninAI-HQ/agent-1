import { tavily } from "@tavily/core";

let tavilyClient = null;

function getTavilyClient() {
  if (!tavilyClient) {
    if (!process.env.TAVILY_API_KEY) {
      throw new Error("TAVILY_API_KEY environment variable is required for web search");
    }
    tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY });
  }
  return tavilyClient;
}

export default getTavilyClient;
