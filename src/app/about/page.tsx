"use client";

import { motion } from "framer-motion";
import { ArrowLeft, BarChart3, Target, Brain, BookOpen, Ruler, Layout, Github, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AboutPage() {
  const metrics = [
    {
      icon: Brain,
      name: "Coherence Score",
      description: "Measures logical flow and topic consistency within the response",
      algorithm: [
        "Analyzes sentence transitions and word overlap between consecutive sentences",
        "Detects transition words and phrases (however, therefore, furthermore, etc.)",
        "Calculates semantic similarity using word overlap ratios",
        "Awards bonus points for consistent paragraph structure",
      ],
      range: "0-100",
      interpretation: {
        high: "Excellent logical flow with strong connections between ideas",
        medium: "Good coherence with mostly clear transitions",
        low: "Poor coherence; ideas seem disconnected or jumpy",
      },
    },
    {
      icon: Target,
      name: "Completeness Score",
      description: "Measures how well the response addresses all aspects of the prompt",
      algorithm: [
        "Extracts key terms from the prompt (nouns, verbs, important concepts)",
        "Checks if response addresses these key terms",
        "Looks for common response patterns (examples, lists, explanations)",
        "Measures depth through response patterns and structure",
      ],
      range: "0-100",
      interpretation: {
        high: "Thoroughly addresses all aspects of the prompt",
        medium: "Covers most key points from the prompt",
        low: "Incomplete response; many prompt aspects not addressed",
      },
    },
    {
      icon: BookOpen,
      name: "Readability Score",
      description: "Measures how easy the text is to read and understand",
      algorithm: [
        "Uses Flesch Reading Ease formula (industry-standard readability metric)",
        "Measures sentence length variance and complexity",
        "Evaluates vocabulary complexity through syllable counting",
        "Penalizes overly long sentences (> 40 words)",
      ],
      range: "0-100",
      interpretation: {
        high: "Very easy to read and understand",
        medium: "Moderately easy to read; appropriate complexity",
        low: "Hard to read; overly complex or poorly structured",
      },
    },
    {
      icon: Ruler,
      name: "Length Appropriateness",
      description: "Evaluates if the response length matches the prompt requirements",
      algorithm: [
        "Estimates expected response length based on prompt complexity",
        "Analyzes prompt type (question, explanation, list, etc.)",
        "Adjusts expectations for different question types",
        "Penalizes responses that are too short (incomplete) or too verbose",
      ],
      range: "0-100",
      interpretation: {
        high: "Optimal length for the given prompt",
        medium: "Reasonable length; slightly too short or long",
        low: "Significantly too short or excessively verbose",
      },
    },
    {
      icon: Layout,
      name: "Structural Quality",
      description: "Measures formatting, organization, and presentation quality",
      algorithm: [
        "Checks for proper paragraph breaks and spacing",
        "Validates list formatting and consistency",
        "Looks for code blocks, headers, and structural elements",
        "Evaluates punctuation consistency and balanced syntax",
      ],
      range: "0-100",
      interpretation: {
        high: "Well-formatted with clear structure",
        medium: "Good structure with minor formatting issues",
        low: "Poor structure; lacks proper formatting",
      },
    },
  ];

  const features = [
    "Multiple parameter configurations per experiment",
    "Real-time response generation with OpenAI API",
    "Comprehensive quality metrics (5 distinct measures)",
    "Interactive data visualization (radar & bar charts)",
    "Side-by-side response comparison",
    "Export functionality (JSON & CSV formats)",
    "Experiment history and management",
    "Persistent data storage with SQLite",
    "Responsive design for all devices",
    "Dark mode support",
  ];

  const techStack = [
    { category: "Frontend", items: ["Next.js 16", "React 19", "TypeScript", "Tailwind CSS 4"] },
    { category: "State Management", items: ["TanStack Query v5"] },
    { category: "UI Components", items: ["Radix UI", "Framer Motion", "Recharts"] },
    { category: "Backend", items: ["Next.js API Routes", "SQLite (better-sqlite3)"] },
    { category: "LLM Integration", items: ["OpenAI API", "Custom Mock Service"] },
    { category: "Data Export", items: ["Papa Parse (CSV)", "Native JSON"] },
  ];

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
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h1 className="mb-3 text-4xl font-bold text-gray-900 dark:text-gray-100">
            About This Project
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-gray-600 dark:text-gray-400">
            A comprehensive LLM response quality analyzer built for the GenAI Labs Challenge.
            Understand how temperature and top_p parameters affect response characteristics
            through data-driven metrics.
          </p>
        </motion.div>

        {/* Quality Metrics Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="mb-6 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Quality Metrics Explained
          </h2>
          <div className="space-y-6">
            {metrics.map((metric, index) => (
              <motion.div
                key={metric.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                        <metric.icon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="mb-2">{metric.name}</CardTitle>
                        <CardDescription>{metric.description}</CardDescription>
                      </div>
                      <Badge variant="outline">{metric.range}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                        Algorithm:
                      </h4>
                      <ul className="space-y-1">
                        {metric.algorithm.map((step, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300"
                          >
                            <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="mb-2 font-semibold text-gray-900 dark:text-gray-100">
                        Interpretation:
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                          <Badge variant="success" className="mt-0.5">
                            80-100
                          </Badge>
                          <span className="text-gray-700 dark:text-gray-300">
                            {metric.interpretation.high}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge variant="warning" className="mt-0.5">
                            60-79
                          </Badge>
                          <span className="text-gray-700 dark:text-gray-300">
                            {metric.interpretation.medium}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <Badge variant="destructive" className="mt-0.5">
                            0-59
                          </Badge>
                          <span className="text-gray-700 dark:text-gray-300">
                            {metric.interpretation.low}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>Key Features</CardTitle>
              <CardDescription>
                Everything you need to analyze and compare LLM responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <div className="h-1.5 w-1.5 rounded-full bg-green-600" />
                    {feature}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tech Stack Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-12"
        >
          <Card>
            <CardHeader>
              <CardTitle>Technology Stack</CardTitle>
              <CardDescription>
                Built with modern, production-ready technologies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {techStack.map((stack) => (
                  <div key={stack.category}>
                    <h4 className="mb-3 font-semibold text-gray-900 dark:text-gray-100">
                      {stack.category}
                    </h4>
                    <div className="space-y-2">
                      {stack.items.map((item) => (
                        <Badge key={item} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Project Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>GenAI Labs Challenge 2025</CardTitle>
              <CardDescription>
                A full-stack demonstration of LLM parameter analysis and quality metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-gray-700 dark:text-gray-300">
                This application was developed as part of the GenAI Labs Challenge to
                demonstrate expertise in full-stack development, LLM integration, data
                analysis, and UI/UX design. The project showcases the ability to build
                production-ready applications that solve real-world problems in the AI
                space.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" asChild>
                  <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                    View Source
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4" />
                    Connect
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}

