# LAID Command Center

**LAID** = Leverage Artificial Intelligence Daily  
**Built for:** Los Silva (@loshustle) — AI Consultant, Orlando FL  
**Product:** AIDS (AI Delivered Systems) — $2,500-$10,000 consulting

A content marketing system and sales command center for business owners doing $500K-$10M in home services, DTC, and agencies.

---

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/laid-command-center.git
cd laid-command-center

# 2. Install dependencies
npm install

# 3. Run locally
npm run dev

# 4. Build for production
npm run build
```

---

## What's Inside

| Feature | Description |
|---------|-------------|
| **Dashboard** | System health, weekly targets, conversion analytics |
| **Feed** | 90 content pieces (15 topics × 6 formats) with topic cards + format tabs |
| **Assets** | 15 copy-pasteable deliverables mapped to DM keywords |
| **Tracker** | 20 Orlando prospects with icebreakers and stage management |
| **Swarm** | Content pipeline visualization |
| **Settings** | Brand config, system controls, export tools |

---

## Content System

**15 Topics (v8 — May 2026):**

| Keyword | Tool | Headline |
|---------|------|----------|
| GPT55 | GPT-5.5 Instant | 3x faster, remembers clients |
| SYMPHONY | OpenAI Symphony | Open-source agent orchestration |
| KIMI | Kimi K2.6 | 300 agents, $0.60/million tokens |
| CURSOR | Cursor SDK | AI coding inside your apps |
| IBM | IBM watsonx | Small business agent automation |
| ELEVEN | ElevenMusic | AI music for ads/hold music |
| CAR | Gemini in Cars | Voice search optimization |
| GUMLOOP | Gumloop | AI-native automation |
| CLAUDE | Claude Code | Auto-picks best AI model |
| DEEPSEEK | DeepSeek V4 | Multimodal, half price |
| GOOGLEIO | Google I/O 2026 | Business preview |
| MAYO | Mayo Clinic AI | Early detection pattern |
| N8N | n8n AI Workflows | Unlimited free automation |
| AWS | OpenAI on AWS | Enterprise AI in 2 days |
| FILES | Gemini Files | Word/Excel/PDF from chat |

**6 Formats per topic:** Short, LinkedIn, X (Twitter), Email, Blog, Carousel

**2 Tones:** Pro (money-focused, aggressive) + Beginner (warm, simple)

---

## Research Bot

Daily AI news scanner that drafts content automatically.

```bash
# Scan sources and draft content
python research_bot.py --run

# Review what it found
python research_bot.py --review

# Approve a draft
python research_bot.py --approve 1

# List monitored sources
python research_bot.py --sources
```

**Monitored sources:** OpenAI, Anthropic, Google, Mistral, xAI, TechCrunch, The Verge, VentureBeat, Notion, Zapier, Figma, Replit, Product Hunt

---

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS 3.4.19
- shadcn/ui (40+ components)
- HashRouter for static deployment
- localStorage for state persistence

---

## Deploy to Production

### Option 1: Vercel (Recommended)
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repo
4. Deploy (auto-builds on every push)

### Option 2: Netlify
1. Push to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Connect repo
4. Build command: `npm run build`
5. Publish directory: `dist`

### Option 3: Manual
```bash
npm run build
# Upload dist/ folder to any static host
```

---

## Project Structure

```
laid-command-center/
├── src/
│   ├── components/      # UI components (ContentCard, AssetCard, etc.)
│   ├── data/
│   │   ├── laid_content.json     # 90 content pieces
│   │   ├── laid_assets.json      # 15 deliverables
│   │   └── laid_prospects.json   # 20 prospects
│   ├── lib/
│   │   └── mdrender.ts           # Markdown rendering utility
│   ├── views/
│   │   ├── DashboardView.tsx
│   │   ├── FeedView.tsx          # Topic-based feed with format tabs
│   │   ├── AssetsView.tsx
│   │   ├── TrackerView.tsx
│   │   ├── SwarmView.tsx
│   │   └── SettingsView.tsx
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── App.tsx
│   └── main.tsx
├── research_bot.py      # AI news scanner & content drafter
├── MASTER_COMMAND.md    # Full system documentation for new sessions
├── STRATEGIC_PLAN.md    # Roadmap: carousels, white-label, monetization
├── README.md            # This file
├── package.json
├── tailwind.config.js
├── vite.config.ts
└── index.html
```

---

## Data Files

| File | Purpose |
|------|---------|
| `src/data/laid_content.json` | 90 content pieces with hooks, bodies, CTAs |
| `src/data/laid_assets.json` | 15 deliverables with copy-paste content |
| `src/data/laid_prospects.json` | 20 prospects with icebreakers |

---

## Git Setup

```bash
# If starting from ZIP (no git history)
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Connect to GitHub
git remote add origin https://github.com/YOUR_USERNAME/laid-command-center.git
git push -u origin main
```

---

## License

MIT — Use it, sell it, white-label it.

Built by Los Silva. Powered by AI.
