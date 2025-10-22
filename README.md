# LLM Response Quality Analyzer

> A comprehensive full-stack application for analyzing and comparing LLM response quality across different parameter configurations.

## 🎯 Overview

This application was built as part of the GenAI Labs Challenge 2025. It allows users to generate multiple LLM responses using different temperature and top_p parameters, then compare them using five custom-designed quality metrics.

**Live Demo:** [Coming Soon]  
**Demo Video:** [Coming Soon]

## ✨ Features

### Core Functionality
- 🎛️ **Parameter Experimentation**: Configure multiple temperature and top_p combinations
- 🤖 **LLM Integration**: OpenAI API integration with automatic mock fallback
- 📊 **Quality Metrics**: 5 comprehensive metrics analyzing response characteristics
- 📈 **Data Visualization**: Interactive radar and bar charts for comparison
- 💾 **Data Persistence**: SQLite database for experiment storage
- 📤 **Export Options**: Export experiments as JSON or CSV

### Quality Metrics
1. **Coherence Score** - Measures logical flow and topic consistency
2. **Completeness Score** - Evaluates how well the response addresses the prompt
3. **Readability Score** - Uses Flesch Reading Ease formula
4. **Length Appropriateness** - Checks if response length matches prompt requirements
5. **Structural Quality** - Analyzes formatting and organization

### UI/UX Features
- 🎨 Modern, responsive design with Tailwind CSS
- 🌓 Dark mode support
- ⚡ Smooth animations with Framer Motion
- 📱 Mobile-friendly interface
- ♿ Accessibility-focused (ARIA labels, keyboard navigation)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- pnpm (or npm/yarn)
- OpenAI API key (optional - uses mock mode without it)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd my-app
```

2. Install dependencies:
```bash
pnpm install
```

3. Create environment file:
```bash
# Create .env.local file
echo "OPENAI_API_KEY=your_api_key_here" > .env.local
```

> **Note:** Leave `OPENAI_API_KEY` empty or undefined to use mock mode for testing without API costs.

4. Run development server:
```bash
pnpm dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
pnpm build
pnpm start
```

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- Next.js 16 (App Router, SSR)
- React 19
- TypeScript
- Tailwind CSS 4
- TanStack Query v5
- Framer Motion
- Recharts

**Backend:**
- Next.js API Routes
- SQLite (better-sqlite3)
- OpenAI API
- Zod (validation)

**UI Components:**
- Radix UI (accessible primitives)
- Custom component library

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── generate/      # Generate LLM responses
│   │   ├── experiments/   # CRUD operations
│   │   └── export/        # Export functionality
│   ├── results/[id]/      # Results dashboard
│   ├── history/           # Experiment history
│   └── about/             # About & metrics info
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── providers.tsx     # React Query provider
├── services/              # Business logic
│   ├── database.ts       # SQLite operations
│   ├── llm.ts           # LLM service
│   └── metrics.ts       # Quality metrics algorithms
├── types/                 # TypeScript types
└── lib/                   # Utilities
```

## 📊 Quality Metrics Explained

### 1. Coherence Score (0-100)
**Purpose:** Measures logical flow and topic consistency

**Algorithm:**
- Analyzes sentence-to-sentence word overlap
- Detects transition words (however, therefore, etc.)
- Calculates semantic similarity using word overlap ratios
- Awards bonus for consistent paragraph structure

**Interpretation:**
- 80-100: Excellent logical flow
- 60-79: Good coherence with clear transitions
- 0-59: Poor coherence; disconnected ideas

### 2. Completeness Score (0-100)
**Purpose:** Evaluates how well the response addresses the prompt

**Algorithm:**
- Extracts key terms from prompt
- Checks term coverage in response
- Looks for response patterns (examples, lists, explanations)
- Measures depth through structural analysis

**Interpretation:**
- 80-100: Thoroughly addresses all aspects
- 60-79: Covers most key points
- 0-59: Incomplete response

### 3. Readability Score (0-100)
**Purpose:** Measures text readability and comprehension ease

**Algorithm:**
- Uses Flesch Reading Ease formula
- Measures sentence length and complexity
- Evaluates vocabulary complexity via syllable counting
- Penalizes overly long sentences

**Interpretation:**
- 80-100: Very easy to read
- 60-79: Moderately easy; appropriate complexity
- 0-59: Hard to read; overly complex

### 4. Length Appropriateness (0-100)
**Purpose:** Checks if response length matches prompt requirements

**Algorithm:**
- Estimates expected length based on prompt complexity
- Analyzes prompt type (question, explanation, list)
- Adjusts expectations for different question types
- Penalizes too short or verbose responses

**Interpretation:**
- 80-100: Optimal length
- 60-79: Reasonable length
- 0-59: Too short or excessively verbose

### 5. Structural Quality (0-100)
**Purpose:** Analyzes formatting and organization quality

**Algorithm:**
- Checks paragraph breaks and spacing
- Validates list formatting consistency
- Looks for structural elements (code blocks, headers)
- Evaluates punctuation and syntax balance

**Interpretation:**
- 80-100: Well-formatted with clear structure
- 60-79: Good structure with minor issues
- 0-59: Poor structure; lacks formatting

## 🔧 Configuration

### Environment Variables

Create `.env.local` in the project root:

```env
# OpenAI API Key (optional)
OPENAI_API_KEY=sk-...

# Leave empty to use mock mode
# OPENAI_API_KEY=
```

### Mock Mode

The application automatically falls back to mock mode if no OpenAI API key is provided. Mock mode generates realistic-looking responses with varying characteristics based on temperature settings.

**Features:**
- No API costs
- Instant responses
- Realistic variation based on parameters
- Perfect for development and testing

## 📝 API Endpoints

### POST `/api/generate`
Generate LLM responses with multiple parameter sets

**Request:**
```json
{
  "prompt": "Explain quantum computing",
  "parameters": [
    { "temperature": 0.3, "topP": 1.0 },
    { "temperature": 0.7, "topP": 1.0 }
  ],
  "model": "gpt-4o-mini"
}
```

**Response:**
```json
{
  "experimentId": "1234-5678",
  "responses": [...]
}
```

### GET `/api/experiments`
Get all experiments or a specific experiment

**Query Parameters:**
- `id` (optional): Experiment ID

### DELETE `/api/experiments?id={id}`
Delete an experiment

### GET `/api/export?id={id}&format={json|csv}`
Export an experiment

## 🚢 Deployment

### Vercel (Recommended)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variable: `OPENAI_API_KEY`
4. Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

### Other Platforms

The application can be deployed to any platform supporting Next.js:
- Railway
- Render
- Fly.io
- Digital Ocean

**Note:** Ensure the platform supports:
- Node.js 18+
- File system access (for SQLite)
- Persistent storage volume (for database)

## 🎓 Design Decisions

### Why SQLite?
- Simple setup, no external database required
- File-based storage suitable for MVP
- Easy to migrate to PostgreSQL/MySQL later
- Perfect for Vercel deployment with persistent storage

### Why Mock Mode?
- Enables testing without API costs
- Faster iteration during development
- Demonstrates the full workflow without dependencies
- Shows parameter effect simulation

### Why These Metrics?
Each metric was chosen to measure distinct aspects of response quality:
- **Coherence**: Technical writing principle
- **Completeness**: Core requirement evaluation
- **Readability**: User experience focus
- **Length**: Context appropriateness
- **Structure**: Professional presentation

## 🔍 Testing

```bash
# Run development server
pnpm dev

# Build for production
pnpm build

# Check for type errors
pnpm typecheck

# Lint code
pnpm lint
```

## 🤝 Contributing

This is a challenge submission project. For questions or suggestions, please reach out.

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername]
- LinkedIn: [Your LinkedIn]
- Email: your.email@example.com

## 🙏 Acknowledgments

- GenAI Labs for the challenge opportunity
- OpenAI for the API
- Next.js team for the amazing framework
- Radix UI for accessible components

---

Built with ❤️ for the GenAI Labs Challenge 2025
