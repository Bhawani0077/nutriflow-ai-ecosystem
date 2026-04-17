# NutriFlow AI Ecosystem 🥦🏋️‍♂️

> **The Proactive, AI-Driven Smart Diet & Fitness Assistant**

NutriFlow is a high-performance, full-stack health management platform that bridges the gap between passive tracking and intelligent guidance. By leveraging **GPT-4** and clinical metabolic formulas (**Mifflin-St Jeor**), NutriFlow provides hyper-personalized, explainable recommendations for nutrition and exercise.

![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D24-blue)
![pnpm](https://img.shields.io/badge/package--manager-pnpm-orange)

---

## 🌟 Key Features

- **Explainable AI (XAI)**: Every meal and workout comes with a biological rationale (the *"Why"*).
- **Metabolic Precision**: Auto-calculations of BMR and TDEE based on specialized user profiling.
- **Adaptive Feedback**: Plans evolve daily based on your completion logs and energy levels.
- **AI Nutrition Scanner**: Analyze food density and caloric value via natural language input.
- **Budget Food Finder**: Intelligent meal planning focused on maximizing nutrient density per dollar spent.
- **Progress Analytics**: High-fidelity heatmaps and compliance bars for long-term habit tracking.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Framer Motion.
- **Backend**: Node.js, Express 5 (Alpha), Zod (Strict Validation).
- **Database**: PostgreSQL, Drizzle ORM (Type-safe schema).
- **AI**: OpenAI GPT-4 (Structured JSON Mode).
- **Architecture**: pnpm Workspace Monorepo.

---

## 📂 Project Structure

```text
├── artifacts/
│   ├── diet-fitness-app/   # React Mobile-First Frontend
│   └── api-server/         # Express API with GPT integration
├── lib/
│   ├── db/                 # Drizzle Schema & PostgreSQL Connection
│   └── api-spec/           # OpenAPI 3.x Specification
├── package.json            # Monorepo Workspace Config
└── pnpm-workspace.yaml     # pnpm Workspace root
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js v24+
- pnpm v11+
- PostgreSQL Instance

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bhawani0077/nutriflow-ai-ecosystem.git
   cd nutriflow-ai-ecosystem
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Configure Environment**
   Create a `.env` in `artifacts/api-server/` with:
   ```env
   DATABASE_URL=your_postgres_url
   OPENAI_API_KEY=your_key
   ```

4. **Run Development Server**
   ```bash
   pnpm run dev
   ```

---

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**Developed with ❤️ by Bhawani Singh**
