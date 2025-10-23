import { Pool, PoolClient } from "pg";
import { Experiment, LLMResponse, ExperimentRow, ResponseRow, ExperimentSummary } from "@/types";

// Database connection pool
let pool: Pool | null = null;

/**
 * Get or create PostgreSQL connection pool
 */
function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  console.log("💾 Database: Connecting to PostgreSQL (Supabase Transaction Pooler)");

  pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase
    },
    // Transaction pooler settings (important for Supabase)
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  // Test connection and initialize schema
  initializeDatabase();

  return pool;
}

/**
 * Initialize database schema
 */
async function initializeDatabase() {
  const client = await getPool().connect();
  
  try {
    console.log("🔨 Initializing database schema...");

    // Create experiments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS experiments (
        id TEXT PRIMARY KEY,
        prompt TEXT NOT NULL,
        name TEXT,
        description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create responses table
    await client.query(`
      CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        experiment_id TEXT NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        temperature REAL NOT NULL,
        top_p REAL NOT NULL,
        coherence INTEGER NOT NULL,
        completeness INTEGER NOT NULL,
        readability INTEGER NOT NULL,
        length_appropriateness INTEGER NOT NULL,
        structural_quality INTEGER NOT NULL,
        overall_score INTEGER NOT NULL,
        token_count INTEGER NOT NULL,
        model TEXT NOT NULL,
        generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Create index for faster queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_responses_experiment_id 
      ON responses(experiment_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_experiments_created_at 
      ON experiments(created_at DESC)
    `);

    console.log("✅ Database schema initialized successfully");
  } catch (error: any) {
    console.error("❌ Error initializing database:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Save an experiment with its responses
 */
export async function saveExperiment(experiment: Experiment): Promise<void> {
  const client = await getPool().connect();

  try {
    await client.query("BEGIN");

    // Insert experiment
    await client.query(
      `INSERT INTO experiments (id, prompt, name, description, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        experiment.id,
        experiment.prompt,
        experiment.name || null,
        experiment.description || null,
        experiment.createdAt,
        experiment.updatedAt,
      ]
    );

    // Insert responses
    for (const response of experiment.responses) {
      await client.query(
        `INSERT INTO responses (
          id, experiment_id, content, temperature, top_p,
          coherence, completeness, readability, length_appropriateness,
          structural_quality, overall_score, token_count, model, generated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`,
        [
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
          response.generatedAt,
        ]
      );
    }

    await client.query("COMMIT");
    console.log(`✅ Saved experiment ${experiment.id} with ${experiment.responses.length} responses`);
  } catch (error: any) {
    await client.query("ROLLBACK");
    console.error("❌ Error saving experiment:", error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get an experiment by ID with all its responses
 */
export async function getExperiment(id: string): Promise<Experiment | null> {
  const client = await getPool().connect();

  try {
    // Get experiment
    const expResult = await client.query(
      "SELECT * FROM experiments WHERE id = $1",
      [id]
    );

    if (expResult.rows.length === 0) {
      return null;
    }

    const expRow = expResult.rows[0];

    // Get responses
    const respResult = await client.query(
      "SELECT * FROM responses WHERE experiment_id = $1 ORDER BY generated_at ASC",
      [id]
    );

    const responses: LLMResponse[] = respResult.rows.map((row) => ({
      id: row.id,
      content: row.content,
      parameters: {
        temperature: row.temperature,
        topP: row.top_p,
      },
      metrics: {
        coherence: row.coherence,
        completeness: row.completeness,
        readability: row.readability,
        lengthAppropriatenss: row.length_appropriateness,
        structuralQuality: row.structural_quality,
        overall: row.overall_score,
      },
      generatedAt: new Date(row.generated_at),
      tokenCount: row.token_count,
      model: row.model,
    }));

    return {
      id: expRow.id,
      prompt: expRow.prompt,
      responses,
      createdAt: new Date(expRow.created_at),
      updatedAt: new Date(expRow.updated_at),
      name: expRow.name,
      description: expRow.description,
    };
  } finally {
    client.release();
  }
}

/**
 * Get all experiments (summary view)
 */
export async function getAllExperiments(): Promise<ExperimentSummary[]> {
  const client = await getPool().connect();

  try {
    const result = await client.query(`
      SELECT 
        e.id,
        e.name,
        e.prompt,
        e.created_at,
        COUNT(r.id) as response_count,
        MAX(r.overall_score) as best_score,
        (SELECT temperature FROM responses 
         WHERE experiment_id = e.id 
         ORDER BY overall_score DESC LIMIT 1) as best_temperature,
        (SELECT top_p FROM responses 
         WHERE experiment_id = e.id 
         ORDER BY overall_score DESC LIMIT 1) as best_top_p
      FROM experiments e
      LEFT JOIN responses r ON e.id = r.experiment_id
      GROUP BY e.id, e.name, e.prompt, e.created_at
      ORDER BY e.created_at DESC
    `);

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name || undefined,
      prompt: row.prompt,
      responseCount: parseInt(row.response_count),
      createdAt: new Date(row.created_at),
      bestResponse:
        row.best_score !== null
          ? {
              parameters: {
                temperature: parseFloat(row.best_temperature),
                topP: parseFloat(row.best_top_p),
              },
              overallScore: parseInt(row.best_score),
            }
          : undefined,
    }));
  } finally {
    client.release();
  }
}

/**
 * Update an experiment
 */
export async function updateExperiment(
  id: string,
  updates: Partial<Pick<Experiment, "name" | "description">>
): Promise<void> {
  const client = await getPool().connect();

  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(updates.name);
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }

    fields.push(`updated_at = $${paramIndex++}`);
    values.push(new Date());

    values.push(id);

    await client.query(
      `UPDATE experiments SET ${fields.join(", ")} WHERE id = $${paramIndex}`,
      values
    );

    console.log(`✅ Updated experiment ${id}`);
  } finally {
    client.release();
  }
}

/**
 * Delete an experiment and all its responses
 */
export async function deleteExperiment(id: string): Promise<void> {
  const client = await getPool().connect();

  try {
    await client.query("DELETE FROM experiments WHERE id = $1", [id]);
    console.log(`✅ Deleted experiment ${id}`);
  } finally {
    client.release();
  }
}

/**
 * Close database connection pool (for graceful shutdown)
 */
export async function closeDatabasePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("👋 Database connection pool closed");
  }
}

