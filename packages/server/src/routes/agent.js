import { Router } from "express";
import sessionManager from "../services/SessionManager.js";
import { listPresets } from "../presets/index.js";
import { EventTypes } from "@blog-agent/shared";

const router = Router();

// List available presets
router.get("/presets", (req, res) => {
  const presets = listPresets();
  res.json({ presets });
});

// Create a new session
router.post("/sessions", (req, res) => {
  const { preset = "general" } = req.body;

  try {
    const session = sessionManager.createSession(preset);
    res.json({
      id: session.id,
      preset: session.preset,
      status: session.status,
      createdAt: session.createdAt
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Start the agent with a topic
router.post("/sessions/:id/start", async (req, res) => {
  const { id } = req.params;
  const { topic } = req.body;

  if (!topic) {
    return res.status(400).json({ error: "Topic is required" });
  }

  try {
    const session = await sessionManager.startAgent(id, topic);
    res.json({
      id: session.id,
      preset: session.preset,
      status: session.status,
      topic: session.topic,
      startedAt: session.startedAt
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SSE endpoint for real-time events
router.get("/sessions/:id/events", (req, res) => {
  const { id } = req.params;
  const session = sessionManager.getSession(id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  // Set up SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  // Add client to session
  sessionManager.addSSEClient(id, res);

  // Send initial connected event
  res.write(`event: ${EventTypes.CONNECTED}\ndata: ${JSON.stringify({ sessionId: id, preset: session.preset, status: session.status })}\n\n`);

  // Send current state if agent is running or completed
  if (session.agent) {
    const state = session.agent.getState();
    res.write(`event: state\ndata: ${JSON.stringify(state)}\n\n`);
  }

  // Set up heartbeat
  const heartbeatInterval = setInterval(() => {
    res.write(`event: ${EventTypes.HEARTBEAT}\ndata: ${JSON.stringify({ time: Date.now() })}\n\n`);
  }, 30000);

  // Clean up on disconnect
  req.on("close", () => {
    clearInterval(heartbeatInterval);
    sessionManager.removeSSEClient(id, res);
  });
});

// Get current session state
router.get("/sessions/:id/state", (req, res) => {
  const { id } = req.params;
  const state = sessionManager.getState(id);

  if (!state) {
    return res.status(404).json({ error: "Session not found" });
  }

  res.json(state);
});

// Delete a session
router.delete("/sessions/:id", (req, res) => {
  const { id } = req.params;
  sessionManager.deleteSession(id);
  res.json({ success: true });
});

export default router;
