/**
 * Core types for the LLM Response Quality Analyzer
 */

export interface LLMParameters {
  temperature: number; // 0-2
  topP: number; // 0-1
}

export interface QualityMetrics {
  coherence: number; // 0-100
  completeness: number; // 0-100
  readability: number; // 0-100
  lengthAppropriatenss: number; // 0-100
  structuralQuality: number; // 0-100
  overall: number; // Average of all metrics
}

export interface MetricExplanation {
  name: string;
  score: number;
  description: string;
  details: string;
}

export interface LLMResponse {
  id: string;
  content: string;
  parameters: LLMParameters;
  metrics: QualityMetrics;
  generatedAt: Date;
  tokenCount: number;
  model: string;
}

export interface Experiment {
  id: string;
  prompt: string;
  responses: LLMResponse[];
  createdAt: Date;
  updatedAt: Date;
  name?: string;
  description?: string;
}

export interface ExperimentConfig {
  prompt: string;
  temperatures: number[];
  topPValues: number[];
  model?: string;
}

export interface GenerateRequest {
  prompt: string;
  parameters: LLMParameters[];
  model?: string;
}

export interface GenerateResponse {
  experimentId: string;
  responses: LLMResponse[];
}

export interface ExperimentSummary {
  id: string;
  name?: string;
  prompt: string;
  responseCount: number;
  createdAt: Date;
  bestResponse?: {
    parameters: LLMParameters;
    overallScore: number;
  };
}

export interface ExportFormat {
  experiment: Experiment;
  exportedAt: Date;
  version: string;
}

// Error types
export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Database types
export interface ExperimentRow {
  id: string;
  prompt: string;
  name: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResponseRow {
  id: string;
  experiment_id: string;
  content: string;
  temperature: number;
  top_p: number;
  coherence_score: number;
  completeness_score: number;
  readability_score: number;
  length_score: number;
  structural_score: number;
  overall_score: number;
  token_count: number;
  model: string;
  generated_at: string;
}

