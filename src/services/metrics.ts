import { QualityMetrics, MetricExplanation } from "@/types";
import { average, clamp } from "@/lib/utils";

/**
 * Calculate all quality metrics for a given LLM response
 */
export function calculateMetrics(prompt: string, response: string): QualityMetrics {
  const coherence = calculateCoherence(response);
  const completeness = calculateCompleteness(prompt, response);
  const readability = calculateReadability(response);
  const lengthAppropriatenss = calculateLengthAppropriateness(prompt, response);
  const structuralQuality = calculateStructuralQuality(response);

  const overall = average([
    coherence,
    completeness,
    readability,
    lengthAppropriatenss,
    structuralQuality,
  ]);

  return {
    coherence: Math.round(coherence),
    completeness: Math.round(completeness),
    readability: Math.round(readability),
    lengthAppropriatenss: Math.round(lengthAppropriatenss),
    structuralQuality: Math.round(structuralQuality),
    overall: Math.round(overall),
  };
}

/**
 * Coherence Score (0-100)
 * Measures logical flow and topic consistency within the response
 * 
 * Algorithm:
 * - Analyzes sentence transitions
 * - Checks for repeated words/concepts across sentences
 * - Measures topic drift using word overlap
 * - Penalizes sudden topic changes
 */
export function calculateCoherence(text: string): number {
  const sentences = splitIntoSentences(text);
  
  if (sentences.length === 0) return 0;
  if (sentences.length === 1) return 85; // Single sentence is coherent

  let totalScore = 0;
  const transitionWords = [
    "however", "therefore", "furthermore", "moreover", "additionally",
    "consequently", "nevertheless", "meanwhile", "similarly", "likewise",
    "thus", "hence", "accordingly", "besides", "also", "then", "next",
    "finally", "first", "second", "third", "lastly", "indeed", "certainly",
  ];

  // Check sentence-to-sentence coherence
  for (let i = 0; i < sentences.length - 1; i++) {
    const current = sentences[i].toLowerCase();
    const next = sentences[i + 1].toLowerCase();

    // Calculate word overlap between consecutive sentences
    const currentWords = new Set(
      current.split(/\s+/).filter((w) => w.length > 3)
    );
    const nextWords = new Set(next.split(/\s+/).filter((w) => w.length > 3));
    
    const intersection = new Set(
      [...currentWords].filter((w) => nextWords.has(w))
    );
    const overlapRatio = intersection.size / Math.max(currentWords.size, 1);

    // Check for transition words
    const hasTransition = transitionWords.some((word) =>
      next.includes(word)
    );

    // Calculate sentence pair score
    let pairScore = overlapRatio * 70; // Word overlap contributes 70%
    if (hasTransition) pairScore += 30; // Transition words contribute 30%

    totalScore += clamp(pairScore, 0, 100);
  }

  // Average coherence across all sentence pairs
  const coherenceScore = totalScore / (sentences.length - 1);

  // Bonus for consistent paragraph structure
  const paragraphs = text.split(/\n\n+/);
  const structureBonus = Math.min(paragraphs.length * 2, 10);

  return clamp(coherenceScore + structureBonus, 0, 100);
}

/**
 * Completeness Score (0-100)
 * Measures how well the response addresses the prompt
 * 
 * Algorithm:
 * - Extracts key terms from prompt
 * - Checks if response addresses these terms
 * - Looks for common response patterns (lists, examples, explanations)
 * - Measures response depth
 */
export function calculateCompleteness(prompt: string, response: string): number {
  const promptLower = prompt.toLowerCase();
  const responseLower = response.toLowerCase();

  // Extract key terms from prompt (nouns, verbs, adjectives)
  const promptWords = promptLower
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter((w) => !isCommonWord(w));

  if (promptWords.length === 0) return 75; // Default for simple prompts

  // Check how many key terms are addressed
  let addressedTerms = 0;
  for (const word of promptWords) {
    if (responseLower.includes(word)) {
      addressedTerms++;
    }
  }

  const termCoverage = (addressedTerms / promptWords.length) * 60;

  // Check for response patterns that indicate completeness
  let patternScore = 0;

  // Has examples or explanations
  if (
    /for example|such as|e\.g\.|i\.e\.|specifically|instance/i.test(response)
  ) {
    patternScore += 15;
  }

  // Has structured content (lists, steps)
  if (/\n[\s]*[-•*\d]+\.?[\s]/.test(response) || /first|second|third|finally/i.test(response)) {
    patternScore += 15;
  }

  // Provides details or elaboration
  if (response.length > 200 && response.split(/\.\s+/).length >= 3) {
    patternScore += 10;
  }

  return clamp(termCoverage + patternScore, 0, 100);
}

/**
 * Readability Score (0-100)
 * Measures how easy the text is to read and understand
 * 
 * Algorithm:
 * - Uses Flesch Reading Ease formula
 * - Measures sentence length variance
 * - Checks vocabulary complexity
 * - Penalizes overly long sentences
 */
export function calculateReadability(text: string): number {
  const sentences = splitIntoSentences(text);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const syllables = countTotalSyllables(text);

  if (words.length === 0 || sentences.length === 0) return 0;

  // Flesch Reading Ease formula
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;

  const fleschScore =
    206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;

  // Convert Flesch score (0-100+) to our scale
  let readabilityScore = clamp(fleschScore, 0, 100);

  // Penalize very long sentences
  const longSentences = sentences.filter((s) => s.split(/\s+/).length > 40).length;
  const longSentencePenalty = (longSentences / sentences.length) * 20;

  // Bonus for good paragraph breaks
  const paragraphs = text.split(/\n\n+/);
  const paragraphBonus = paragraphs.length > 1 ? 5 : 0;

  return clamp(readabilityScore - longSentencePenalty + paragraphBonus, 0, 100);
}

/**
 * Length Appropriateness Score (0-100)
 * Measures if the response length is appropriate for the prompt
 * 
 * Algorithm:
 * - Estimates expected length based on prompt complexity
 * - Penalizes responses that are too short or too verbose
 * - Considers prompt type (question, task, creative)
 */
export function calculateLengthAppropriateness(prompt: string, response: string): number {
  const promptWords = prompt.split(/\s+/).length;
  const responseWords = response.split(/\s+/).length;

  // Estimate expected response length based on prompt
  let expectedMin = 20;
  let expectedMax = 500;

  // Adjust based on prompt length and type
  if (promptWords < 10) {
    expectedMin = 30;
    expectedMax = 200;
  } else if (promptWords < 30) {
    expectedMin = 50;
    expectedMax = 400;
  } else {
    expectedMin = 100;
    expectedMax = 800;
  }

  // Check for specific prompt types
  if (/list|enumerate|steps|how to/i.test(prompt)) {
    expectedMin = 50;
    expectedMax = 600;
  }

  if (/explain|describe|discuss|analyze/i.test(prompt)) {
    expectedMin = 80;
    expectedMax = 500;
  }

  if (/yes|no|true|false|choose|select/i.test(prompt)) {
    expectedMin = 20;
    expectedMax = 150;
  }

  // Calculate score based on how close to optimal range
  let score = 100;

  if (responseWords < expectedMin) {
    // Too short
    const shortfall = expectedMin - responseWords;
    score = Math.max(0, 100 - (shortfall / expectedMin) * 80);
  } else if (responseWords > expectedMax) {
    // Too long
    const excess = responseWords - expectedMax;
    score = Math.max(0, 100 - (excess / expectedMax) * 50);
  }

  return clamp(score, 0, 100);
}

/**
 * Structural Quality Score (0-100)
 * Measures the formatting and structure quality
 * 
 * Algorithm:
 * - Checks for proper paragraph breaks
 * - Validates list formatting
 * - Looks for consistent punctuation
 * - Checks for code blocks, headers, etc.
 */
export function calculateStructuralQuality(text: string): number {
  let score = 60; // Base score

  // Check for paragraph structure (good spacing)
  const paragraphs = text.split(/\n\n+/);
  if (paragraphs.length > 1) {
    score += Math.min(paragraphs.length * 3, 15);
  }

  // Check for proper list formatting
  const listMatches = text.match(/\n[\s]*[-•*\d]+\.?[\s]/g);
  if (listMatches && listMatches.length >= 2) {
    score += 10;
  }

  // Check for code blocks
  if (/```[\s\S]*```|`[^`]+`/.test(text)) {
    score += 5;
  }

  // Check for headers or sections
  if (/^#{1,6}\s+.+$/m.test(text) || /^[A-Z][^.!?]+:$/m.test(text)) {
    score += 5;
  }

  // Check punctuation consistency
  const sentences = splitIntoSentences(text);
  const properlyEnded = sentences.filter((s) =>
    /[.!?]$/.test(s.trim())
  ).length;
  
  if (sentences.length > 0) {
    const punctuationScore = (properlyEnded / sentences.length) * 10;
    score += punctuationScore;
  }

  // Penalize excessive line breaks
  const excessiveBreaks = (text.match(/\n{4,}/g) || []).length;
  score -= excessiveBreaks * 5;

  // Check for balanced quotes and parentheses
  const openParens = (text.match(/\(/g) || []).length;
  const closeParens = (text.match(/\)/g) || []).length;
  if (openParens === closeParens) {
    score += 5;
  }

  return clamp(score, 0, 100);
}

/**
 * Get detailed explanations for all metrics
 */
export function getMetricExplanations(metrics: QualityMetrics): MetricExplanation[] {
  return [
    {
      name: "Coherence",
      score: metrics.coherence,
      description: "Measures logical flow and topic consistency",
      details: getCoherenceDetails(metrics.coherence),
    },
    {
      name: "Completeness",
      score: metrics.completeness,
      description: "How well the response addresses the prompt",
      details: getCompletenessDetails(metrics.completeness),
    },
    {
      name: "Readability",
      score: metrics.readability,
      description: "How easy the text is to read and understand",
      details: getReadabilityDetails(metrics.readability),
    },
    {
      name: "Length Appropriateness",
      score: metrics.lengthAppropriatenss,
      description: "Whether the response length matches the prompt",
      details: getLengthDetails(metrics.lengthAppropriatenss),
    },
    {
      name: "Structural Quality",
      score: metrics.structuralQuality,
      description: "Formatting and organization quality",
      details: getStructuralDetails(metrics.structuralQuality),
    },
  ];
}

// Helper functions

function splitIntoSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function countTotalSyllables(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  return words.reduce((total, word) => total + countSyllables(word), 0);
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length === 0) return 0;
  
  const vowels = "aeiouy";
  let count = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !previousWasVowel) {
      count++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent 'e'
  if (word.endsWith("e")) {
    count--;
  }

  return Math.max(1, count);
}

function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
    "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
    "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
    "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  ]);
  return commonWords.has(word.toLowerCase());
}

function getCoherenceDetails(score: number): string {
  if (score >= 80) return "Excellent logical flow with strong connections between ideas.";
  if (score >= 60) return "Good coherence with mostly clear transitions.";
  if (score >= 40) return "Moderate coherence; some ideas could be better connected.";
  return "Poor coherence; ideas seem disconnected or jumpy.";
}

function getCompletenessDetails(score: number): string {
  if (score >= 80) return "Thoroughly addresses all aspects of the prompt.";
  if (score >= 60) return "Covers most key points from the prompt.";
  if (score >= 40) return "Addresses some aspects but misses key points.";
  return "Incomplete response; many prompt aspects not addressed.";
}

function getReadabilityDetails(score: number): string {
  if (score >= 80) return "Very easy to read and understand.";
  if (score >= 60) return "Moderately easy to read; appropriate complexity.";
  if (score >= 40) return "Somewhat difficult to read; complex sentences.";
  return "Hard to read; overly complex or poorly structured.";
}

function getLengthDetails(score: number): string {
  if (score >= 80) return "Optimal length for the given prompt.";
  if (score >= 60) return "Reasonable length; slightly too short or long.";
  if (score >= 40) return "Length is noticeably inappropriate.";
  return "Significantly too short or excessively verbose.";
}

function getStructuralDetails(score: number): string {
  if (score >= 80) return "Well-formatted with clear structure.";
  if (score >= 60) return "Good structure with minor formatting issues.";
  if (score >= 40) return "Basic structure; could use better formatting.";
  return "Poor structure; lacks proper formatting.";
}

