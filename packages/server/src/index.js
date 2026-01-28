import "dotenv/config";
import express from "express";
import cors from "cors";
import agentRoutes from "./routes/agent.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use("/api", agentRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: Date.now() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Agent Server running on http://localhost:${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  POST /api/sessions - Create new session`);
  console.log(`  POST /api/sessions/:id/start - Start agent with topic`);
  console.log(`  GET  /api/sessions/:id/events - SSE event stream`);
  console.log(`  GET  /api/sessions/:id/state - Get current state`);
});
