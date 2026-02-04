import AnthropicProvider from "./AnthropicProvider.js";
import OpenAIProvider from "./OpenAIProvider.js";

export const VALID_PROVIDERS = ["anthropic", "openai"];

export const DEFAULT_MODELS = {
  anthropic: "claude-sonnet-4-20250514",
  openai: "gpt-4o"
};

export function createLLMProvider(provider, options = {}) {
  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(options);
    case "openai":
      return new OpenAIProvider(options);
    default:
      throw new Error(
        `Unknown LLM provider: "${provider}". Valid providers: ${VALID_PROVIDERS.join(", ")}`
      );
  }
}
