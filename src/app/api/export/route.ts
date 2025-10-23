import { NextRequest, NextResponse } from "next/server";
import { getExperiment } from "@/services/database";
import Papa from "papaparse";
import { ExportFormat } from "@/types";

// Ensure fresh data for exports
export const dynamic = 'force-dynamic';

/**
 * GET /api/export?id=xxx&format=json|csv
 * Export an experiment in the specified format
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const format = searchParams.get("format") || "json";

    if (!id) {
      return NextResponse.json(
        { error: "Experiment ID is required" },
        { status: 400 }
      );
    }

    const experiment = getExperiment(id);

    if (!experiment) {
      return NextResponse.json(
        { error: "Experiment not found" },
        { status: 404 }
      );
    }

    if (format === "json") {
      return exportAsJSON(experiment);
    } else if (format === "csv") {
      return exportAsCSV(experiment);
    } else {
      return NextResponse.json(
        { error: "Invalid format. Use 'json' or 'csv'" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * Export experiment as JSON
 */
function exportAsJSON(experiment: any) {
  const exportData: ExportFormat = {
    experiment,
    exportedAt: new Date(),
    version: "1.0.0",
  };

  const jsonString = JSON.stringify(exportData, null, 2);

  return new NextResponse(jsonString, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="experiment-${experiment.id}.json"`,
    },
  });
}

/**
 * Export experiment as CSV
 */
function exportAsCSV(experiment: any) {
  // Flatten experiment data for CSV
  const rows = experiment.responses.map((response: any) => ({
    experiment_id: experiment.id,
    prompt: experiment.prompt,
    response_id: response.id,
    response_content: response.content,
    temperature: response.parameters.temperature,
    top_p: response.parameters.topP,
    coherence_score: response.metrics.coherence,
    completeness_score: response.metrics.completeness,
    readability_score: response.metrics.readability,
    length_appropriateness_score: response.metrics.lengthAppropriatenss,
    structural_quality_score: response.metrics.structuralQuality,
    overall_score: response.metrics.overall,
    token_count: response.tokenCount,
    model: response.model,
    generated_at: response.generatedAt,
  }));

  const csv = Papa.unparse(rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="experiment-${experiment.id}.csv"`,
    },
  });
}

