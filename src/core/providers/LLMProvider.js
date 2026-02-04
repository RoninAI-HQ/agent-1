/**
 * LLMProvider - Base class for LLM provider adapters
 *
 * All providers normalize to Anthropic-style responses:
 * - { stopReason: "end_turn" | "tool_use", content: Array }
 */
class LLMProvider {
  constructor({ defaultModel } = {}) {
    this.defaultModel = defaultModel;
  }

  /**
   * Create a message (chat completion)
   * @param {Object} params
   * @param {string} params.model - Model name
   * @param {number} params.maxTokens - Max tokens in response
   * @param {string} [params.system] - System prompt
   * @param {Array} [params.tools] - Tool schemas (Anthropic format)
   * @param {Array} params.messages - Conversation messages
   * @returns {Promise<{stopReason: string, content: Array}>}
   */
  async createMessage(params) {
    throw new Error("createMessage() must be implemented by subclass");
  }
}

export default LLMProvider;
