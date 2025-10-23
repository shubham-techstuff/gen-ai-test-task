import { NextRequest, NextResponse } from "next/server";
import {
  getAllExperiments,
  getExperiment,
  deleteExperiment,
  updateExperiment,
} from "@/services/database";

// Ensure fresh data on every request
export const dynamic = 'force-dynamic';

/**
 * GET /api/experiments
 * Get all experiments (summary view)
 * 
 * GET /api/experiments?id=xxx
 * Get a specific experiment by ID
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      // Get specific experiment
      const experiment = await getExperiment(id);

      if (!experiment) {
        return NextResponse.json(
          { error: "Experiment not found" },
          { status: 404 }
        );
      }

      return NextResponse.json(experiment);
    }

    // Get all experiments (summary)
    const experiments = await getAllExperiments();
    return NextResponse.json({ experiments });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/experiments
 * Update experiment metadata
 */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, description } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Experiment ID is required" },
        { status: 400 }
      );
    }

    await updateExperiment(id, { name, description });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/experiments?id=xxx
 * Delete an experiment
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Experiment ID is required" },
        { status: 400 }
      );
    }

    await deleteExperiment(id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

