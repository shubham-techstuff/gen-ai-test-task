"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Download,
  BarChart3,
  Award,
  TrendingUp,
  FileText,
  Sparkles,
} from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Bar, BarChart, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Experiment, MetricExplanation } from "@/types";
import { getMetricExplanations } from "@/services/metrics";
import Link from "next/link";

export default function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [selectedResponseIndex, setSelectedResponseIndex] = useState(0);

  const { data: experiment, isLoading, error } = useQuery<Experiment>({
    queryKey: ["experiment", id],
    queryFn: async () => {
      const response = await fetch(`/api/experiments?id=${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch experiment");
      }
      return response.json();
    },
  });

  const handleExport = async (format: "json" | "csv") => {
    window.location.href = `/api/export?id=${id}&format=${format}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">
            Loading experiment results...
          </p>
        </div>
      </div>
    );
  }

  if (error || !experiment) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>
            Failed to load experiment. It may have been deleted or doesn't exist.
          </AlertDescription>
          <Button variant="outline" className="mt-4" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </Alert>
      </div>
    );
  }

  const selectedResponse = experiment.responses[selectedResponseIndex];
  const explanations = selectedResponse
    ? getMetricExplanations(selectedResponse.metrics)
    : [];

  // Prepare radar chart data
  const radarData = [
    {
      metric: "Coherence",
      score: selectedResponse.metrics.coherence,
    },
    {
      metric: "Completeness",
      score: selectedResponse.metrics.completeness,
    },
    {
      metric: "Readability",
      score: selectedResponse.metrics.readability,
    },
    {
      metric: "Length",
      score: selectedResponse.metrics.lengthAppropriatenss,
    },
    {
      metric: "Structure",
      score: selectedResponse.metrics.structuralQuality,
    },
  ];

  // Prepare comparison bar chart data
  const comparisonData = experiment.responses.map((response, idx) => ({
    name: `T:${response.parameters.temperature.toFixed(1)} P:${response.parameters.topP.toFixed(1)}`,
    overall: response.metrics.overall,
    coherence: response.metrics.coherence,
    completeness: response.metrics.completeness,
    readability: response.metrics.readability,
  }));

  // Find best response
  const bestResponse = experiment.responses.reduce((best, curr) =>
    curr.metrics.overall > best.metrics.overall ? curr : best
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => handleExport("json")}>
                <Download className="h-4 w-4" />
                Export JSON
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleExport("csv")}>
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Experiment Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
                Experiment Results
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Generated {experiment.responses.length} response
                {experiment.responses.length !== 1 ? "s" : ""} •{" "}
                {new Date(experiment.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                {experiment.prompt}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Best Response Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900 dark:text-green-100">
                <Award className="h-5 w-5" />
                Best Configuration
              </CardTitle>
              <CardDescription className="text-green-700 dark:text-green-300">
                Highest overall quality score
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Temperature
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {bestResponse.parameters.temperature.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Top P
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {bestResponse.parameters.topP.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Overall Score
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    {bestResponse.metrics.overall}/100
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Response Selector */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6 flex flex-wrap gap-2"
        >
          {experiment.responses.map((response, idx) => (
            <button
              key={response.id}
              onClick={() => setSelectedResponseIndex(idx)}
              className={`rounded-lg border px-4 py-3 text-left transition-all ${
                idx === selectedResponseIndex
                  ? "border-blue-600 bg-blue-50 shadow-md dark:border-blue-500 dark:bg-blue-950/30"
                  : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
              }`}
            >
              <p className="mb-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                Response {idx + 1}
              </p>
              <p className="text-sm">
                <span className="font-semibold">T:</span>{" "}
                {response.parameters.temperature.toFixed(1)} •{" "}
                <span className="font-semibold">P:</span>{" "}
                {response.parameters.topP.toFixed(1)}
              </p>
              <Badge
                variant={getScoreBadgeVariant(response.metrics.overall)}
                className="mt-2"
              >
                {response.metrics.overall}/100
              </Badge>
            </button>
          ))}
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column: Response Content */}
          <motion.div
            key={selectedResponseIndex}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Response Content
                </CardTitle>
                <CardDescription>
                  Temperature: {selectedResponse.parameters.temperature.toFixed(2)} •
                  Top P: {selectedResponse.parameters.topP.toFixed(2)} • Tokens:{" "}
                  {selectedResponse.tokenCount}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-[500px] overflow-y-auto rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                  <p className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                    {selectedResponse.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column: Metrics */}
          <motion.div
            key={`metrics-${selectedResponseIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Overall Quality Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p
                    className={`text-6xl font-bold ${getScoreColor(
                      selectedResponse.metrics.overall
                    )}`}
                  >
                    {selectedResponse.metrics.overall}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    out of 100
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Individual Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Metric Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {explanations.map((explanation) => (
                  <div key={explanation.name}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {explanation.name}
                      </span>
                      <span
                        className={`text-sm font-bold ${getScoreColor(
                          explanation.score
                        )}`}
                      >
                        {explanation.score}/100
                      </span>
                    </div>
                    <Progress value={explanation.score} max={100} />
                    <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                      {explanation.details}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Radar Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quality Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Comparison Chart */}
        {experiment.responses.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <Card>
              <CardHeader>
                <CardTitle>Parameter Comparison</CardTitle>
                <CardDescription>
                  Compare quality metrics across all parameter configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="overall" fill="#3b82f6" name="Overall" />
                    <Bar dataKey="coherence" fill="#8b5cf6" name="Coherence" />
                    <Bar dataKey="completeness" fill="#10b981" name="Completeness" />
                    <Bar dataKey="readability" fill="#f59e0b" name="Readability" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}

