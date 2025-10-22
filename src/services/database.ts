import Database from "better-sqlite3";
import path from "path";
import { Experiment, LLMResponse, ExperimentRow, ResponseRow, ExperimentSummary } from "@/types";

// Database path - in production, use a persistent volume
const DB_PATH = path.join(process.cwd(), "data", "experiments.db");

let db: Database.Database | null = null;

/**
 * Get or create database instance
 */
function getDB(): Database.Database {
  if (db) return db;

  // Ensure data directory exists
  const fs = require("fs");
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  
  // Initialize schema
  initializeSchema(db);
  
  return db;
}

/**
 * Initialize database schema
 */
function initializeSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      name TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS responses (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      content TEXT NOT NULL,
      temperature REAL NOT NULL,
      top_p REAL NOT NULL,
      coherence_score REAL NOT NULL,
      completeness_score REAL NOT NULL,
      readability_score REAL NOT NULL,
      length_score REAL NOT NULL,
      structural_score REAL NOT NULL,
      overall_score REAL NOT NULL,
      token_count INTEGER NOT NULL,
      model TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_responses_experiment_id 
    ON responses(experiment_id);

    CREATE INDEX IF NOT EXISTS idx_experiments_created_at 
    ON experiments(created_at DESC);
  `);
}

/**
 * Save an experiment with its responses
 */
export function saveExperiment(experiment: Experiment): void {
  const database = getDB();
  
  const insertExperiment = database.prepare(`
    INSERT INTO experiments (id, prompt, name, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertResponse = database.prepare(`
    INSERT INTO responses (
      id, experiment_id, content, temperature, top_p,
      coherence_score, completeness_score, readability_score,
      length_score, structural_score, overall_score,
      token_count, model, generated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const transaction = database.transaction(() => {
    insertExperiment.run(
      experiment.id,
      experiment.prompt,
      experiment.name || null,
      experiment.description || null,
      experiment.createdAt.toISOString(),
      experiment.updatedAt.toISOString()
    );

    for (const response of experiment.responses) {
      insertResponse.run(
        response.id,
        experiment.id,
        response.content,
        response.parameters.temperature,
        response.parameters.topP,
        response.metrics.coherence,
        response.metrics.completeness,
        response.metrics.readability,
        response.metrics.lengthAppropriatenss,
        response.metrics.structuralQuality,
        response.metrics.overall,
        response.tokenCount,
        response.model,
        response.generatedAt.toISOString()
      );
    }
  });

  transaction();
}

/**
 * Get an experiment by ID
 */
export function getExperiment(id: string): Experiment | null {
  const database = getDB();

  const experimentRow = database
    .prepare("SELECT * FROM experiments WHERE id = ?")
    .get(id) as ExperimentRow | undefined;

  if (!experimentRow) return null;

  const responseRows = database
    .prepare("SELECT * FROM responses WHERE experiment_id = ? ORDER BY generated_at")
    .all(id) as ResponseRow[];

  return {
    id: experimentRow.id,
    prompt: experimentRow.prompt,
    name: experimentRow.name || undefined,
    description: experimentRow.description || undefined,
    createdAt: new Date(experimentRow.created_at),
    updatedAt: new Date(experimentRow.updated_at),
    responses: responseRows.map((row) => ({
      id: row.id,
      content: row.content,
      parameters: {
        temperature: row.temperature,
        topP: row.top_p,
      },
      metrics: {
        coherence: row.coherence_score,
        completeness: row.completeness_score,
        readability: row.readability_score,
        lengthAppropriatenss: row.length_score,
        structuralQuality: row.structural_score,
        overall: row.overall_score,
      },
      tokenCount: row.token_count,
      model: row.model,
      generatedAt: new Date(row.generated_at),
    })),
  };
}

/**
 * Get all experiments (summary view)
 */
export function getAllExperiments(): ExperimentSummary[] {
  const database = getDB();

  const experiments = database
    .prepare(`
      SELECT 
        e.id,
        e.name,
        e.prompt,
        e.created_at,
        COUNT(r.id) as response_count,
        MAX(r.overall_score) as best_score,
        (SELECT temperature FROM responses WHERE experiment_id = e.id ORDER BY overall_score DESC LIMIT 1) as best_temperature,
        (SELECT top_p FROM responses WHERE experiment_id = e.id ORDER BY overall_score DESC LIMIT 1) as best_top_p
      FROM experiments e
      LEFT JOIN responses r ON e.id = r.experiment_id
      GROUP BY e.id
      ORDER BY e.created_at DESC
    `)
    .all() as Array<{
      id: string;
      name: string | null;
      prompt: string;
      created_at: string;
      response_count: number;
      best_score: number | null;
      best_temperature: number | null;
      best_top_p: number | null;
    }>;

  return experiments.map((exp) => ({
    id: exp.id,
    name: exp.name || undefined,
    prompt: exp.prompt,
    responseCount: exp.response_count,
    createdAt: new Date(exp.created_at),
    bestResponse:
      exp.best_score !== null
        ? {
            parameters: {
              temperature: exp.best_temperature!,
              topP: exp.best_top_p!,
            },
            overallScore: exp.best_score,
          }
        : undefined,
  }));
}

/**
 * Delete an experiment and all its responses
 */
export function deleteExperiment(id: string): boolean {
  const database = getDB();
  const result = database.prepare("DELETE FROM experiments WHERE id = ?").run(id);
  return result.changes > 0;
}

/**
 * Update experiment name and description
 */
export function updateExperiment(
  id: string,
  updates: { name?: string; description?: string }
): boolean {
  const database = getDB();
  
  const result = database
    .prepare(`
      UPDATE experiments 
      SET name = COALESCE(?, name),
          description = COALESCE(?, description),
          updated_at = ?
      WHERE id = ?
    `)
    .run(updates.name, updates.description, new Date().toISOString(), id);

  return result.changes > 0;
}

/**
 * Close database connection
 */
export function closeDB(): void {
  if (db) {
    db.close();
    db = null;
  }
}

