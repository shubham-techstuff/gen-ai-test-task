// Quick test to show mock mode in action
const prompts = ["Explain machine learning"];
const temperatures = [0.3, 0.7, 1.5];

console.log("🎭 Mock Mode Temperature Comparison\n");
console.log("=" .repeat(60));

// Simulate the logic
temperatures.forEach(temp => {
  let style, tone, example;
  
  if (temp < 0.3) {
    style = "Formal & Structured";
    tone = "Professional, systematic";
    example = '"In response to your query... detailed analysis..."';
  } else if (temp < 0.8) {
    style = "Balanced & Conversational";
    tone = "Friendly but informative";
    example = '"Interesting question! ... multi-faceted topic..."';
  } else {
    style = "Creative & Expressive";
    tone = "Enthusiastic, playful";
    example = '"Wow! ... fascinating? ... let me throw ideas..."';
  }
  
  console.log(`\n🌡️  Temperature: ${temp}`);
  console.log(`   Style: ${style}`);
  console.log(`   Tone: ${tone}`);
  console.log(`   Sample: ${example}`);
});

console.log("\n" + "=".repeat(60));
console.log("\n✨ All without calling any API! Zero cost! ✨\n");

