import Anthropic from "@anthropic-ai/sdk";
import LLMProvider from "./LLMProvider.js";

class AnthropicProvider extends LLMProvider {
  constructor(options = {}) {
    super({ defaultModel: options.defaultModel || "claude-sonnet-4-20250514" });
    this.client = new Anthropic();
  }

  async createMessage({ model, maxTokens, system, tools, messages }) {
    const params = {
      model: model || this.defaultModel,
      max_tokens: maxTokens,
      messages
    };

    if (system) params.system = system;
    if (tools && tools.length > 0) params.tools = tools;

    const response = await this.client.messages.create(params);

    return {
      stopReason: response.stop_reason,
      content: response.content
    };
  }
}

export default AnthropicProvider;
