import cors from "cors";
import express from "express";
import { nanoid } from "nanoid";
import { listScenarios } from "./scenarios.js";
import { createSession, processCommand } from "./simulatorEngine.js";

const app = express();
const sessions = new Map();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/scenarios", (_req, res) => {
  res.json({ scenarios: listScenarios() });
});

app.post("/api/sessions", (req, res) => {
  const { scenarioId } = req.body;

  if (!scenarioId) {
    return res.status(400).json({ error: "scenarioId is required" });
  }

  try {
    const session = createSession(scenarioId);
    const sessionId = nanoid();
    sessions.set(sessionId, session);

    return res.status(201).json({
      sessionId,
      scenario: session.scenario,
      prompt: session.prompt,
      bootMessage:
        "TroubleshootIT simulation ready. Investigate the symptoms using standard troubleshooting commands."
    });
  } catch (error) {
    return res.status(404).json({ error: error.message });
  }
});

app.post("/api/sessions/:sessionId/command", (req, res) => {
  const { sessionId } = req.params;
  const { command } = req.body;
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const result = processCommand(session, command ?? "");
  return res.json(result);
});

export default app;
