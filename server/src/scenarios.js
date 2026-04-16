import { scenarioDefinitions } from "./scenarioCatalog.js";

export function listScenarios() {
  return scenarioDefinitions.map((scenario) => ({
    id: scenario.id,
    difficulty: scenario.difficulty,
    title: scenario.title,
    description: scenario.description,
    symptoms: scenario.symptoms,
    objective: scenario.objective
  }));
}

export function getScenarioDefinition(id) {
  return scenarioDefinitions.find((scenario) => scenario.id === id);
}
