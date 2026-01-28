import getTavilyClient from "../core/tavilyClient.js";

/**
 * Web Search Tool - Shared tool for searching the web
 *
 * Uses Tavily API to perform web searches and return
 * structured results. Can be used by any preset.
 */
export default {
  name: "web_search",
  schema: {
    name: "web_search",
    description: "Search the web for information on a topic. Use this to research facts, find examples, get current data, or discover expert opinions.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "The search query"
        }
      },
      required: ["query"]
    }
  },
  execute: async ({ query }) => {
    const tavilyClient = getTavilyClient();
    const response = await tavilyClient.search(query);

    const results = response.results.map((result) => ({
      title: result.title,
      snippet: result.content,
      source: new URL(result.url).hostname,
      url: result.url,
      score: result.score
    }));

    return {
      query,
      results,
      resultCount: results.length
    };
  }
};
