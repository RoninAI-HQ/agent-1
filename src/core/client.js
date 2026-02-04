import { createLLMProvider } from "./providers/index.js";

let llmClient = null;

/**
 * Initialize the LLM client with a specific provider
 * @param {string} provider - Provider name ("anthropic" or "openai")
 * @param {Object} options - Provider options (e.g. { defaultModel })
 */
export function initLLMClient(provider, options = {}) {
  llmClient = createLLMProvider(provider, options);
  return llmClient;
}

/**
 * Get the LLM client, lazy-initializing to Anthropic if not yet configured
 * @returns {LLMProvider}
 */
export function getLLMClient() {
  if (!llmClient) {
    llmClient = createLLMProvider("anthropic");
  }
  return llmClient;
}

export default getLLMClient;
