"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, Trash2, Eye, Calendar, Target, TrendingUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExperimentSummary } from "@/types";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export default function HistoryPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{ experiments: ExperimentSummary[] }>({
    queryKey: ["experiments"],
    queryFn: async () => {
      const response = await fetch("/api/experiments");
      if (!response.ok) {
        throw new Error("Failed to fetch experiments");
      }
      return response.json();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/experiments?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete experiment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["experiments"] });
    },
  });

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this experiment?")) {
      deleteMutation.mutate(id);
    }
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
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Experiment History
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                View and manage your past experiments
              </p>
            </div>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                Loading experiments...
              </p>
            </div>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load experiments. Please try again later.
            </AlertDescription>
          </Alert>
        ) : !data || data.experiments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <p className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
                No experiments yet
              </p>
              <p className="mb-4 text-gray-600 dark:text-gray-400">
                Create your first experiment to get started
              </p>
              <Button asChild>
                <Link href="/">Create Experiment</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {data.experiments.map((experiment, index) => (
              <motion.div
                key={experiment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="mb-2">
                          {experiment.name || "Untitled Experiment"}
                        </CardTitle>
                        <CardDescription className="line-clamp-2">
                          {experiment.prompt}
                        </CardDescription>
                      </div>
                      {experiment.bestResponse && (
                        <Badge
                          variant={getScoreBadgeVariant(
                            experiment.bestResponse.overallScore
                          )}
                          className="ml-4"
                        >
                          Best: {experiment.bestResponse.overallScore}/100
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="h-4 w-4" />
                          {formatDate(experiment.createdAt)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                          <TrendingUp className="h-4 w-4" />
                          {experiment.responseCount} response
                          {experiment.responseCount !== 1 ? "s" : ""}
                        </div>
                        {experiment.bestResponse && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <Target className="h-4 w-4" />
                            T:{" "}
                            {experiment.bestResponse.parameters.temperature.toFixed(
                              1
                            )}{" "}
                            • P:{" "}
                            {experiment.bestResponse.parameters.topP.toFixed(1)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/results/${experiment.id}`}>
                            <Eye className="h-4 w-4" />
                            View
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(experiment.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

