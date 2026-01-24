class TokenCounter {
  static estimate(content) {
    const text = typeof content === "string" ? content : JSON.stringify(content);
    const words = text.split(/\s+/).length;
    return Math.ceil((words * 1.3 + text.length / 4) / 2);
  }

  static estimateMessages(messages) {
    return messages.reduce((sum, msg) => {
      let tokens = 4;
      if (typeof msg.content === "string") {
        tokens += this.estimate(msg.content);
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          tokens += 4 + this.estimate(block.text || block.content || JSON.stringify(block.input || ""));
        }
      }
      return sum + tokens;
    }, 0);
  }
}

export default TokenCounter;
