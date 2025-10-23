import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateResponse, validateParameters } from "@/services/llm";
import { calculateMetrics } from "@/services/metrics";
import { saveExperiment } from "@/services/database";
import { generateId } from "@/lib/utils";
import { Experiment, LLMResponse } from "@/types";

// Configure route to allow longer execution time for LLM API calls
export const maxDuration = 30; // 30 seconds
export const dynamic = 'force-dynamic';

const generateRequestSchema = z.object({
  prompt: z.string().min(1, "Prompt is required").max(5000, "Prompt too long"),
  parameters: z.array(
    z.object({
      temperature: z.number().min(0).max(2),
      topP: z.number().min(0).max(1),
    })
  ).min(1, "At least one parameter set required").max(20, "Too many parameter sets"),
  model: z.string().optional().default("gpt-4o-mini"),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = generateRequestSchema.parse(body);

    const { prompt, parameters, model } = validatedData;

    // Validate all parameter sets
    for (const params of parameters) {
      const validation = validateParameters(params);
      if (!validation.valid) {
        return NextResponse.json(
          { error: "Invalid parameters", details: validation.errors },
          { status: 400 }
        );
      }
    }

    // Generate responses for each parameter set
    const responses: LLMResponse[] = [];

    for (const params of parameters) {
      try {
        const result = await generateResponse(prompt, params, model);
        const metrics = calculateMetrics(prompt, result.content);

        const response: LLMResponse = {
          id: generateId(),
          content: result.content,
          parameters: params,
          metrics,
          generatedAt: new Date(),
          tokenCount: result.tokenCount,
          model: result.model,
        };

        responses.push(response);
      } catch (error: any) {
        console.error("Error generating response:", error);
        // Continue with other parameters even if one fails
        responses.push({
          id: generateId(),
          content: `Error generating response: ${error.message}`,
          parameters: params,
          metrics: {
            coherence: 0,
            completeness: 0,
            readability: 0,
            lengthAppropriatenss: 0,
            structuralQuality: 0,
            overall: 0,
          },
          generatedAt: new Date(),
          tokenCount: 0,
          model: model,
        });
      }
    }

    // Create and save experiment
    const experiment: Experiment = {
      id: generateId(),
      prompt,
      responses,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await saveExperiment(experiment);

    return NextResponse.json({
      experimentId: experiment.id,
      responses: responses.map((r) => ({
        id: r.id,
        content: r.content,
        parameters: r.parameters,
        metrics: r.metrics,
        tokenCount: r.tokenCount,
        model: r.model,
      })),
    });
  } catch (error: any) {
    console.error("API Error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error", message: error.message },
      { status: 500 }
    );
  }
}

