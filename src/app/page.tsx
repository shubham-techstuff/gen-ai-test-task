"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Beaker,
  Sparkles,
  TrendingUp,
  History,
  Info,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

interface ParameterSet {
  id: string;
  temperature: number;
  topP: number;
}

export default function Home() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [parameters, setParameters] = useState<ParameterSet[]>([
    { id: "1", temperature: 0.3, topP: 1 },
    { id: "2", temperature: 0.7, topP: 1 },
    { id: "3", temperature: 1.5, topP: 1 },
  ]);

  const generateMutation = useMutation({
    mutationFn: async (data: { prompt: string; parameters: ParameterSet[] }) => {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: data.prompt,
          parameters: data.parameters.map((p) => ({
            temperature: p.temperature,
            topP: p.topP,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate responses");
      }

      return response.json();
    },
    onSuccess: (data) => {
      router.push(`/results/${data.experimentId}`);
    },
  });

  const addParameterSet = () => {
    setParameters([
      ...parameters,
      {
        id: Date.now().toString(),
        temperature: 0.7,
        topP: 1,
      },
    ]);
  };

  const removeParameterSet = (id: string) => {
    if (parameters.length > 1) {
      setParameters(parameters.filter((p) => p.id !== id));
    }
  };

  const updateParameter = (
    id: string,
    field: "temperature" | "topP",
    value: number
  ) => {
    setParameters(
      parameters.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      generateMutation.mutate({ prompt, parameters });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm dark:border-gray-800 dark:bg-gray-950/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
                <Beaker className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  LLM Response Analyzer
                </h1>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  GenAI Labs Challenge
                </p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/history">
                  <History className="h-4 w-4" />
                  History
                </Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/about">
                  <Info className="h-4 w-4" />
                  About
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Hero Section */}
          <div className="mb-8 text-center">
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
            >
              <Sparkles className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
              Experiment with LLM Parameters
            </h2>
            <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
              Generate multiple responses with different temperature and top_p
              values. Compare quality metrics to understand how parameters affect
              response characteristics.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mx-auto max-w-4xl space-y-6">
            {/* Prompt Input */}
            <Card>
              <CardHeader>
                <CardTitle>Your Prompt</CardTitle>
                <CardDescription>
                  Enter the prompt you want the LLM to respond to
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="E.g., Explain the concept of quantum computing in simple terms..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  required
                  className="resize-none"
                />
                <p className="mt-2 text-xs text-gray-500">
                  {prompt.length} / 5000 characters
                </p>
              </CardContent>
            </Card>

            {/* Parameter Sets */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Parameter Configurations</CardTitle>
                    <CardDescription>
                      Configure different parameter combinations to test
                    </CardDescription>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addParameterSet}
                    disabled={parameters.length >= 10}
                  >
                    <Plus className="h-4 w-4" />
                    Add Set
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {parameters.map((param, index) => (
                  <motion.div
                    key={param.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                        Configuration {index + 1}
                      </h4>
                      {parameters.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParameterSet(param.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>

                    <div className="space-y-4">
                      {/* Temperature */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <Label>Temperature</Label>
                          <span className="text-sm font-medium text-blue-600">
                            {param.temperature.toFixed(2)}
                          </span>
                        </div>
                        <Slider
                          value={[param.temperature]}
                          onValueChange={([value]) =>
                            updateParameter(param.id, "temperature", value)
                          }
                          min={0}
                          max={2}
                          step={0.1}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {param.temperature < 0.3
                            ? "More focused and deterministic"
                            : param.temperature < 0.8
                            ? "Balanced creativity and coherence"
                            : "More creative and diverse"}
                        </p>
                      </div>

                      {/* Top P */}
                      <div>
                        <div className="mb-2 flex items-center justify-between">
                          <Label>Top P (Nucleus Sampling)</Label>
                          <span className="text-sm font-medium text-purple-600">
                            {param.topP.toFixed(2)}
                          </span>
                        </div>
                        <Slider
                          value={[param.topP]}
                          onValueChange={([value]) =>
                            updateParameter(param.id, "topP", value)
                          }
                          min={0}
                          max={1}
                          step={0.05}
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {param.topP < 0.5
                            ? "Very focused token selection"
                            : param.topP < 0.9
                            ? "Balanced token diversity"
                            : "Maximum token diversity"}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {parameters.length >= 10 && (
                  <Alert variant="warning">
                    <AlertDescription>
                      Maximum of 10 parameter sets reached. Remove some to add
                      more.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Error Display */}
            {generateMutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>
                  {generateMutation.error instanceof Error
                    ? generateMutation.error.message
                    : "Failed to generate responses. Please try again."}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <div className="flex justify-center">
              <Button
                type="submit"
                size="lg"
                loading={generateMutation.isPending}
                disabled={!prompt.trim() || generateMutation.isPending}
                className="min-w-[200px]"
              >
                {generateMutation.isPending ? (
                  <>Generating Responses...</>
                ) : (
                  <>
                    <TrendingUp className="h-5 w-5" />
                    Generate & Analyze
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white/50 py-6 dark:border-gray-800 dark:bg-gray-950/50">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>
            Built with Next.js, TypeScript, and Tailwind CSS | GenAI Labs Challenge 2025
          </p>
        </div>
      </footer>
    </div>
  );
}
