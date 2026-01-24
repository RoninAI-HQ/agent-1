import TokenCounter from "./TokenCounter.js";
import client from "./client.js";

class ContextManager {
  constructor(options = {}) {
    this.maxTokens = options.maxTokens || 16000;
    this.compressionTrigger = options.compressionTrigger || 0.7;
    this.minMessagesToKeep = options.minMessagesToKeep || 6;
    this.messages = [];
    this.summary = null;
    this.conversationGoal = null;
  }

  get utilization() {
    const summaryTokens = this.summary ? TokenCounter.estimate(this.summary) : 0;
    const messageTokens = TokenCounter.estimateMessages(this.messages);
    return (summaryTokens + messageTokens) / (this.maxTokens * 0.75);
  }

  async addMessage(message) {
    this.messages.push(message);
    if (this.utilization > this.compressionTrigger) {
      await this.compress();
    }
  }

  async compress() {
    if (this.messages.length <= this.minMessagesToKeep) return;

    const toCompress = this.messages.slice(0, -this.minMessagesToKeep);
    const toKeep = this.messages.slice(-this.minMessagesToKeep);

    const formatted = toCompress.map(m => {
      const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content);
      return `${m.role}: ${content.substring(0, 300)}${content.length > 300 ? "..." : ""}`;
    }).join("\n\n");

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Summarize this conversation, preserving key facts, decisions, and any research/content produced:\n\n${formatted}\n\nCONCISE SUMMARY:`
      }]
    });

    const newSummary = response.content[0].text;
    this.summary = this.summary
      ? `${this.summary}\n\nLater: ${newSummary}`
      : newSummary;
    this.messages = toKeep;

    console.log("   Context compressed");
  }

  getMessages() {
    const result = [];
    if (this.summary) {
      result.push({ role: "user", content: `[Previous context: ${this.summary}]` });
      result.push({ role: "assistant", content: "I have the context. Continuing." });
    }
    return [...result, ...this.messages];
  }
}

export default ContextManager;
