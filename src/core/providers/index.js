import AnthropicProvider from "./AnthropicProvider.js";
import OpenAIProvider from "./OpenAIProvider.js";
import OllamaProvider from "./OllamaProvider.js";

export const VALID_PROVIDERS = ["anthropic", "openai", "ollama"];

export const DEFAULT_MODELS = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o",
  ollama: "llama3.2"
};

export function createLLMProvider(provider, options = {}) {
  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(options);
    case "openai":
      return new OpenAIProvider(options);
    case "ollama":
      return new OllamaProvider(options);
    default:
      throw new Error(
        `Unknown LLM provider: "${provider}". Valid providers: ${VALID_PROVIDERS.join(", ")}`
      );
  }
}
