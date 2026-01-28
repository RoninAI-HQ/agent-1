import { v4 as uuidv4 } from "uuid";
import Agent from "../core/Agent.js";
import ToolRegistry from "../core/ToolRegistry.js";
import agentConfig from "../config/index.js";

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  /**
   * Create a new session
   * @returns {Object} Session object
   */
  createSession() {
    const id = uuidv4();
    const session = {
      id,
      status: "created",
      agent: null,
      sseClients: new Set(),
      topic: null,
      createdAt: Date.now(),
      startedAt: null,
      completedAt: null,
      error: null
    };
    this.sessions.set(id, session);
    return session;
  }

  getSession(id) {
    return this.sessions.get(id);
  }

  deleteSession(id) {
    const session = this.sessions.get(id);
    if (session) {
      if (session.agent) {
        session.agent.abort();
      }
      // Close all SSE connections
      for (const client of session.sseClients) {
        client.end();
      }
      this.sessions.delete(id);
    }
  }

  addSSEClient(sessionId, res) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.sseClients.add(res);
      return true;
    }
    return false;
  }

  removeSSEClient(sessionId, res) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.sseClients.delete(res);
    }
  }

  broadcast(sessionId, eventType, data) {
    const session = this.sessions.get(sessionId);
    if (session) {
      const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
      for (const client of session.sseClients) {
        client.write(message);
      }
    }
  }

  async startAgent(sessionId, topic) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error("Session not found");
    }

    if (session.status === "running") {
      throw new Error("Agent already running");
    }

    session.topic = topic;
    session.status = "running";
    session.startedAt = Date.now();

    // Create tool registry and register tools
    const registry = new ToolRegistry();
    registry.registerMany(agentConfig.toolImplementations);

    // Create agent with config and registry
    const agent = new Agent(agentConfig, registry, { verbose: false });
    session.agent = agent;

    // Set up event forwarding to SSE clients
    const eventTypes = [
      "agent:started", "agent:complete", "agent:error",
      "phase:start", "phase:end",
      "plan:created",
      "step:start", "step:complete",
      "tool:start", "tool:result",
      "note:saved", "thought:recorded", "result:stored", "task:completed"
    ];

    for (const eventType of eventTypes) {
      agent.on(eventType, (data) => {
        this.broadcast(sessionId, eventType, data);
      });
    }

    // Run the agent (don't await - let it run in background)
    agent.run(topic)
      .then((result) => {
        session.status = "completed";
        session.completedAt = Date.now();
      })
      .catch((error) => {
        session.status = "error";
        session.error = error.message;
        session.completedAt = Date.now();
      });

    return session;
  }

  getState(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    return {
      id: session.id,
      status: session.status,
      topic: session.topic,
      createdAt: session.createdAt,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      error: session.error,
      agentState: session.agent ? session.agent.getState() : null
    };
  }

  // Clean up old sessions (call periodically)
  cleanup(maxAgeMs = 3600000) {
    const now = Date.now();
    for (const [id, session] of this.sessions) {
      if (session.status !== "running" && (now - session.createdAt) > maxAgeMs) {
        this.deleteSession(id);
      }
    }
  }
}

// Singleton instance
const sessionManager = new SessionManager();

export default sessionManager;
