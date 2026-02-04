import OpenAIProvider from "./OpenAIProvider.js";

class OllamaProvider extends OpenAIProvider {
  constructor(options = {}) {
    super({
      defaultModel: options.defaultModel || "llama3.2",
      apiKey: "ollama",
      baseURL: process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1",
      ...options
    });
  }

  async createMessage({ model, maxTokens, system, tools, messages }) {
    const openaiMessages = this._convertMessages(system, messages);
    const params = {
      model: model || this.defaultModel,
      max_tokens: maxTokens,
      messages: openaiMessages
    };

    if (tools && tools.length > 0) {
      params.tools = this._convertTools(tools);
    }

    const response = await this.client.chat.completions.create(params);
    return this._convertResponse(response);
  }
}

export default OllamaProvider;
