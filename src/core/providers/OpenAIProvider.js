import OpenAI from "openai";
import LLMProvider from "./LLMProvider.js";

class OpenAIProvider extends LLMProvider {
  constructor(options = {}) {
    super({ defaultModel: options.defaultModel || "gpt-4o" });

    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is required for OpenAI provider");
    }

    const clientOptions = { apiKey };
    if (options.baseURL) clientOptions.baseURL = options.baseURL;
    this.client = new OpenAI(clientOptions);
  }

  async createMessage({ model, maxTokens, system, tools, messages }) {
    const openaiMessages = this._convertMessages(system, messages);
    const params = {
      model: model || this.defaultModel,
      max_completion_tokens: maxTokens,
      messages: openaiMessages
    };

    if (tools && tools.length > 0) {
      params.tools = this._convertTools(tools);
    }

    const response = await this.client.chat.completions.create(params);
    return this._convertResponse(response);
  }

  /**
   * Convert Anthropic-format tools to OpenAI format
   * { name, description, input_schema } -> { type: "function", function: { name, description, parameters } }
   */
  _convertTools(tools) {
    return tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.input_schema
      }
    }));
  }

  /**
   * Convert messages from Anthropic format to OpenAI format
   * - Prepends system message from top-level system param
   * - Converts assistant messages with tool_use content blocks to OpenAI tool_calls
   * - Converts user messages with tool_result blocks to OpenAI tool messages
   */
  _convertMessages(system, messages) {
    const result = [];

    if (system) {
      result.push({ role: "system", content: system });
    }

    for (const msg of messages) {
      if (msg.role === "assistant") {
        result.push(this._convertAssistantMessage(msg));
      } else if (msg.role === "user" && Array.isArray(msg.content)) {
        // Could be tool_result blocks
        const toolResults = msg.content.filter(b => b.type === "tool_result");
        if (toolResults.length > 0) {
          for (const tr of toolResults) {
            result.push({
              role: "tool",
              tool_call_id: tr.tool_use_id,
              content: typeof tr.content === "string" ? tr.content : JSON.stringify(tr.content)
            });
          }
        } else {
          result.push({ role: "user", content: this._flattenContent(msg.content) });
        }
      } else {
        result.push({ role: msg.role, content: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content) });
      }
    }

    return result;
  }

  /**
   * Convert an Anthropic-format assistant message (with content blocks) to OpenAI format
   */
  _convertAssistantMessage(msg) {
    if (typeof msg.content === "string") {
      return { role: "assistant", content: msg.content };
    }

    const textParts = [];
    const toolCalls = [];

    for (const block of msg.content) {
      if (block.type === "text") {
        textParts.push(block.text);
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          type: "function",
          function: {
            name: block.name,
            arguments: JSON.stringify(block.input)
          }
        });
      }
    }

    const result = { role: "assistant", content: textParts.join("\n") || null };
    if (toolCalls.length > 0) {
      result.tool_calls = toolCalls;
    }
    return result;
  }

  /**
   * Flatten Anthropic content blocks to a string
   */
  _flattenContent(content) {
    if (typeof content === "string") return content;
    return content
      .filter(b => b.type === "text")
      .map(b => b.text)
      .join("\n");
  }

  /**
   * Convert OpenAI response to normalized format
   * { stopReason: string, content: Array }
   */
  _convertResponse(response) {
    const choice = response.choices[0];
    const message = choice.message;

    // Map finish_reason
    const stopReasonMap = {
      stop: "end_turn",
      tool_calls: "tool_use",
      length: "max_tokens",
      content_filter: "end_turn"
    };
    const stopReason = stopReasonMap[choice.finish_reason] || "end_turn";

    // Build Anthropic-style content blocks
    const content = [];

    if (message.content) {
      content.push({ type: "text", text: message.content });
    }

    if (message.tool_calls) {
      for (const tc of message.tool_calls) {
        let input;
        try {
          input = JSON.parse(tc.function.arguments);
        } catch {
          input = { raw: tc.function.arguments };
        }

        content.push({
          type: "tool_use",
          id: tc.id,
          name: tc.function.name,
          input
        });
      }
    }

    return { stopReason, content };
  }
}

export default OpenAIProvider;
