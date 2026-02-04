import fs from "fs";
import path from "path";

export default class DebugLogger {
  constructor(agent) {
    this.agent = agent;
    this.dir = null;
    this.seq = 0;

    agent.on("agent:started", (data) => {
      this.writeSnapshot("agent_started", data);
    });

    agent.on("plan:created", (data) => {
      this.writeSnapshot("plan_created", data);
    });

    agent.on("step:start", (data) => {
      this.writeSnapshot(`step_${data.stepId}_start`, data);
    });

    agent.on("step:complete", (data) => {
      this.writeSnapshot(`step_${data.stepId}_complete`, data);
    });

    agent.on("tool:result", (data) => {
      this.writeLightweight("tool_result", {
        tool: data.tool,
        result: data.result
      });
    });

    agent.on("agent:complete", (data) => {
      this.writeSnapshot("agent_complete", data);
    });

    agent.on("agent:error", (data) => {
      this.writeSnapshot("agent_error", data);
    });
  }

  getDir() {
    if (!this.dir) {
      const now = new Date();
      const stamp = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
      ].join("-") + "_" + [
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0")
      ].join("-");
      this.dir = path.join("debug", stamp);
      fs.mkdirSync(this.dir, { recursive: true });
    }
    return this.dir;
  }

  nextFilename(label) {
    this.seq++;
    const num = String(this.seq).padStart(3, "0");
    return path.join(this.getDir(), `${num}_${label}.json`);
  }

  captureFullSnapshot() {
    const state = this.agent.getState();
    const messages = this.agent.contextManager.getMessages();
    const summary = this.agent.contextManager.summary;
    return { state, messages, summary };
  }

  writeSnapshot(label, eventData) {
    const payload = {
      timestamp: new Date().toISOString(),
      event: label,
      eventData,
      snapshot: this.captureFullSnapshot()
    };
    fs.writeFileSync(this.nextFilename(label), JSON.stringify(payload, null, 2));
  }

  writeLightweight(label, eventData) {
    const payload = {
      timestamp: new Date().toISOString(),
      event: label,
      eventData
    };
    fs.writeFileSync(this.nextFilename(label), JSON.stringify(payload, null, 2));
  }
}
