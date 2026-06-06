# Quick Developer Notes

> **The all-in-one developer & BI productivity workspace** — Notes · DAX Insight · DAX Studio · Mermaid Studio · JSON Toolkit · Text Compare · Kanban

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38BDF8?logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

Stop switching tabs between Notepad++, DAX Studio, JSON validators and diff viewers. **Quick Developer Notes** unifies everything in a single ultra-fast workspace — built local-first, zero paid services required.

---

## Features

| Module | Description | Backend needed? |
|--------|-------------|----------------|
| **Quick Notes** | HyperNotepad-style rich-text editor · slash commands · code blocks · tables · autosave · Smart Paste (JSON / DAX / Mermaid / SQL / C#) | Yes |
| **DAX Insight** | Paste DAX → keyword explanations with cited sources (dax.guide · SQLBI · Microsoft Learn) · Mermaid flow diagram · execution cost estimate | No |
| **DAX Studio** | Monaco editor · workspace explorer · SE/FE execution insights · enterprise results grid (sort / filter / resize / paginate 100·500·1000) · CSV/Excel export | Yes |
| **Mermaid Studio** | Live render · zoom/pan · 5 themes · split-screen · export PNG (2× retina) + SVG | No |
| **JSON Toolkit** | Beautify · minify · validate · tree view · Smart unescape | No |
| **Text Compare** | GitHub-style split + inline diff · word-level highlighting | No |
| **Kanban Board** | Drag-and-drop (dnd-kit) · Backlog → Today → In Progress → Testing → Done | Yes |

> **Vercel / static deploy**: DAX Insight, Mermaid Studio, JSON Toolkit, and Text Compare work fully without a backend. Notes, Kanban, and DAX Studio require the self-hosted .NET backend.

---

## Tech Stack

**Frontend (this repo)**
- Next.js 16 App Router · React 19 · TypeScript 5
- Tailwind CSS v4 (`@theme inline` CSS custom properties)
- Monaco Editor — DAX syntax highlighting, hover citations, auto-complete
- TipTap v3 — rich-text editor
- Mermaid.js — client-side diagram rendering
- Framer Motion — scroll animations, spring-physics parallax
- dnd-kit — Kanban drag-and-drop

**Backend (self-hosted, optional)**
- .NET 9 · ASP.NET Core Minimal APIs · Clean Architecture
- Entity Framework Core · SQLite (zero-install)
- Serilog — structured logging with rolling files

---

## Quick Start

### Frontend only

```bash
git clone https://github.com/kumaresh-rgb/quickdevtool.git
cd quickdevtool
npm install
npm run dev
```

Open **http://localhost:3000**

### Full stack (Notes + Kanban + DAX Studio persistence)

```bash
# Terminal 1 — .NET backend
cd backend/src/QuickDevNotes.Api
dotnet run --no-launch-profile

# Terminal 2 — Next.js frontend
npm install
npm run dev
```

The SQLite database is auto-created and seeded on first run.

---

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/kumaresh-rgb/quickdevtool)

1. Click **Deploy with Vercel** or import the repo at [vercel.com/new](https://vercel.com/new)
2. Vercel auto-detects Next.js — no extra configuration needed
3. *(Optional)* Set `NEXT_PUBLIC_API_URL` to your self-hosted backend URL to enable full persistence

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5180` | URL of the .NET backend API |

```bash
cp .env.example .env.local
# then edit .env.local
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout (theme script, fonts, favicon)
│   ├── page.tsx            # Landing page
│   ├── globals.css         # Design system (CSS custom properties, dark/light)
│   └── app/
│       ├── layout.tsx      # App shell
│       ├── notes/          # Quick Notes rich-text editor
│       ├── insight/        # DAX Insight (3-panel)
│       ├── studio/         # DAX Studio (4-panel enterprise)
│       ├── mermaid/        # Mermaid Studio
│       ├── json/           # JSON Toolkit
│       ├── compare/        # Text Compare
│       └── kanban/         # Kanban Board
├── components/
│   ├── AppShell.tsx        # Sidebar + mobile hamburger drawer
│   ├── DaxEditor.tsx       # Monaco DAX editor with hover citations
│   ├── MermaidView.tsx     # Mermaid renderer with pan/zoom
│   ├── ThemeToggle.tsx     # Dark/light toggle
│   ├── landing/            # Hero, FloatingSnippets, TiltCard, CursorGlow
│   ├── notes/              # RichEditor (TipTap v3)
│   ├── studio/             # ResultGrid (enterprise paginated table)
│   └── ui/                 # Shared UI primitives
└── lib/
    ├── api.ts              # Typed fetch client (NEXT_PUBLIC_API_URL)
    ├── logger.ts           # Structured console logger (Serilog-style timestamps)
    ├── nav.ts              # Navigation config
    ├── dax-knowledge.ts    # DAX keyword database + cited sources
    ├── dax-analyze.ts      # DAX analyzer (flow diagram, cost estimate, warnings)
    ├── dax-format.ts       # Client-side DAX formatter
    ├── diff.ts             # LCS line + word diff algorithm
    └── detect-lang.ts      # Smart paste language detection
```

---

## DAX Knowledge Sources

DAX Insight cites sources in priority order:

1. [dax.guide](https://dax.guide) — canonical DAX function reference
2. [SQLBI](https://www.sqlbi.com) — deep performance articles by Marco Russo & Alberto Ferrari
3. [Microsoft Learn](https://learn.microsoft.com/en-us/dax/) — official DAX documentation
4. [Microsoft Fabric docs](https://learn.microsoft.com/en-us/fabric/) — Fabric/Power BI specific context

---

## Local-First Philosophy

- **Zero paid services** — no Azure, no Stripe, no cloud databases
- **Your data stays on your machine** — SQLite file, never uploaded anywhere
- **Works offline** — all client-side tools run without internet
- **No account needed** — open and use immediately

---

## Roadmap

- [ ] Public note sharing (read-only links)
- [ ] AES-256 encrypted notes
- [ ] Password-protected notes
- [ ] Column pinning in DAX Studio grid
- [ ] Parquet export
- [ ] Auto-expiring notes
- [ ] Mobile bottom navigation
- [ ] Landing page: Testimonials · Pricing · Roadmap sections

---

## License

MIT © [Kumaresh](https://github.com/kumaresh-rgb)
