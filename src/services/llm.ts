import OpenAI from "openai";
import { LLMParameters } from "@/types";
import { sleep } from "@/lib/utils";

const USE_MOCK = !process.env.OPENAI_API_KEY;

// Log which mode we're using on startup
if (USE_MOCK) {
  console.log("🤖 LLM Service: Running in MOCK MODE (no OpenAI API key detected)");
} else {
  console.log("✨ LLM Service: Running in REAL MODE (OpenAI API key detected)");
}

let openai: OpenAI | null = null;

if (!USE_MOCK && process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export interface LLMGenerateResult {
  content: string;
  tokenCount: number;
  model: string;
}

/**
 * Generate a response from the LLM
 */
export async function generateResponse(
  prompt: string,
  parameters: LLMParameters,
  model: string = "gpt-4o-mini"
): Promise<LLMGenerateResult> {
  if (USE_MOCK || !openai) {
    console.log(`🤖 Generating MOCK response (temp: ${parameters.temperature}, top_p: ${parameters.topP})`);
    return generateMockResponse(prompt, parameters);
  }

  try {
    console.log(`✨ Calling OpenAI API (model: ${model}, temp: ${parameters.temperature}, top_p: ${parameters.topP})`);
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: parameters.temperature,
      top_p: parameters.topP,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content || "";
    const tokenCount = response.usage?.total_tokens || 0;

    console.log(`✅ OpenAI response received (tokens: ${tokenCount}, model: ${response.model})`);
    return {
      content,
      tokenCount,
      model: response.model,
    };
  } catch (error: any) {
    console.error("❌ OpenAI API error:", error.message);
    
    // Fallback to mock on error
    if (error.code === "insufficient_quota" || error.code === "rate_limit_exceeded") {
      console.warn("⚠️ API quota exceeded, falling back to MOCK response");
      return generateMockResponse(prompt, parameters);
    }
    
    throw new Error(`LLM generation failed: ${error.message}`);
  }
}

/**
 * Generate a mock response for testing without API access
 */
async function generateMockResponse(
  prompt: string,
  parameters: LLMParameters
): Promise<LLMGenerateResult> {
  // Simulate API delay
  await sleep(500 + Math.random() * 1000);

  // Generate response based on temperature
  const responses = generateResponseVariations(prompt, parameters);
  const tokenCount = Math.floor(responses.split(/\s+/).length * 1.3);
  
  console.log(`✅ Mock response generated (tokens: ${tokenCount}, variation: ${parameters.temperature >= 1.0 ? "creative" : parameters.temperature >= 0.5 ? "balanced" : "focused"})`);
  
  return {
    content: responses,
    tokenCount: tokenCount,
    model: "mock-gpt-4",
  };
}

/**
 * Generate different response variations based on parameters
 */
function generateResponseVariations(
  prompt: string,
  parameters: LLMParameters
): string {
  const { temperature, topP } = parameters;

  // Base response templates
  const templates = [
    {
      temp: "low",
      response: generateLowTemperatureResponse(prompt),
    },
    {
      temp: "medium",
      response: generateMediumTemperatureResponse(prompt),
    },
    {
      temp: "high",
      response: generateHighTemperatureResponse(prompt),
    },
  ];

  // Select template based on temperature
  if (temperature < 0.3) {
    return templates[0].response;
  } else if (temperature < 0.8) {
    return templates[1].response;
  } else {
    return templates[2].response;
  }
}

function generateLowTemperatureResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes("explain") || promptLower.includes("what is")) {
    return `Based on your question about "${prompt.slice(0, 50)}...", here's a comprehensive explanation:

This topic can be understood by breaking it down into several key components. First, we need to establish the foundational concepts. The primary aspect involves understanding the core principles that govern this subject matter.

Secondly, it's important to consider the practical applications. These applications demonstrate how theoretical knowledge translates into real-world scenarios. For instance, in professional settings, this knowledge is applied through systematic methodologies.

Key points to remember:
- The fundamental principles remain consistent
- Applications vary based on context
- Understanding the theory is essential for practical implementation

In conclusion, this represents a well-structured approach to understanding the topic, with clear logical progression and evidence-based reasoning.`;
  }

  return `In response to your query regarding "${prompt.slice(0, 50)}...", here's a detailed analysis:

The topic at hand requires careful consideration of multiple factors. Through a systematic examination, we can identify several critical elements:

1. Primary considerations: These form the foundation of our understanding
2. Secondary factors: These provide additional context and nuance
3. Practical implications: These demonstrate real-world applications

Each of these elements contributes to a comprehensive understanding of the subject matter. The structured approach ensures clarity and logical progression through the material.

Therefore, the most appropriate response involves synthesizing these components into a coherent framework that addresses all relevant aspects of your question.`;
}

function generateMediumTemperatureResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes("how") || promptLower.includes("steps")) {
    return `Great question about "${prompt.slice(0, 50)}..."! Let me walk you through this:

To approach this effectively, I'd suggest following these steps:

1. **Start with the basics**: Understanding the foundational concepts is crucial. This gives you a solid framework to build upon.

2. **Explore the details**: Once you have the basics down, dive deeper into specific aspects. Look for patterns and connections between different elements.

3. **Apply your knowledge**: Theory is important, but practical application cements your understanding. Try implementing what you've learned in real scenarios.

4. **Iterate and improve**: As you gain experience, refine your approach. Learn from what works and adjust what doesn't.

Additionally, consider these helpful tips:
- Take your time to fully understand each step
- Don't hesitate to revisit earlier concepts if needed
- Practice makes perfect!

This approach should give you a solid foundation to work with. Feel free to adapt it based on your specific needs and circumstances.`;
  }

  return `Interesting question! Regarding "${prompt.slice(0, 50)}...", here are my thoughts:

This is actually a multi-faceted topic worth exploring from different angles. On one hand, we have the traditional perspective which emphasizes systematic approaches and proven methodologies. On the other hand, modern interpretations bring fresh insights and alternative viewpoints.

What makes this particularly interesting is how these different perspectives complement each other. For example:
- Traditional methods provide stability and reliability
- Modern approaches offer innovation and flexibility
- Combining both creates a balanced strategy

In practice, the best approach often depends on your specific context and goals. Some situations call for tried-and-true methods, while others benefit from creative solutions.

The key is maintaining flexibility while staying grounded in fundamental principles. This balanced approach tends to yield the best results across various scenarios.`;
}

function generateHighTemperatureResponse(prompt: string): string {
  const promptLower = prompt.toLowerCase();
  
  if (promptLower.includes("creative") || promptLower.includes("imagine")) {
    return `Oh, what a fascinating prompt: "${prompt.slice(0, 50)}..."! Let me explore this creatively:

Imagine a world where conventional wisdom takes a backseat to innovative thinking. In this space, we're free to experiment with bold ideas and unconventional approaches. The possibilities become truly exciting when we step outside traditional boundaries!

Here's where things get really interesting: what if we combined seemingly unrelated concepts? Picture this scenario: traditional methodologies meet cutting-edge innovation, creating a hybrid approach that's greater than the sum of its parts.

Think about it like this:
→ Breaking free from established patterns
→ Embracing uncertainty as opportunity
→ Discovering unexpected connections
→ Creating something entirely new

The beauty of this approach lies in its flexibility and adaptability. Rather than following a rigid framework, we're dancing with ideas, letting creativity guide the process. Sometimes the most unexpected paths lead to the most remarkable destinations!

Who knows? This might just spark something revolutionary. The key is staying open to possibilities and willing to explore uncharted territory. Adventure awaits! 🚀`;
  }

  return `Wow, "${prompt.slice(0, 50)}..." - now that's something to think about!

You know what's fascinating? How this question opens up so many different avenues of exploration. We could go traditional, or we could throw caution to the wind and try something completely different!

Let me throw some ideas at you:
• What if we approached this from an entirely new angle?
• Consider the unexpected connections between disparate concepts
• Embrace the chaos and see where it leads
• Sometimes the scenic route reveals the best views

Here's my take: instead of following the beaten path, why not create your own trail? Mix things up! Combine elements that don't usually go together. Add a dash of creativity, a sprinkle of logic, and see what emerges.

The magic happens in those liminal spaces between structure and spontaneity. That's where innovation lives! That's where breakthrough moments occur! 

Remember: rules are guidelines, not prisons. Feel free to bend, twist, or completely reimagine them. The universe rewards bold thinking! ✨

So go ahead - experiment, play around, and discover what works for YOU. That's the real secret sauce!`;
}

/**
 * Validate LLM parameters
 */
export function validateParameters(parameters: LLMParameters): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (parameters.temperature < 0 || parameters.temperature > 2) {
    errors.push("Temperature must be between 0 and 2");
  }

  if (parameters.topP < 0 || parameters.topP > 1) {
    errors.push("Top P must be between 0 and 1");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if using mock mode
 */
export function isMockMode(): boolean {
  return USE_MOCK;
}

