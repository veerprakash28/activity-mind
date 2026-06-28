# ActivityMind Web Developer Guide

## Commands
* **Start Dev Server**: `npm run dev` (runs Next.js with Turbopack)
* **Build Production**: `npm run build`
* **Start Production Server**: `npm start`
* **Linting**: `npm run lint`

## Tech Stack
* **Framework**: Next.js 16 (App Router)
* **Language**: TypeScript
* **Database**: Dexie.js (IndexedDB wrapper for local-first storage)
* **Icons**: `lucide-react`
* **Styling**: Vanilla CSS (variables defined in `src/app/globals.css`)

## Key Design Patterns & Guidelines
1. **Sidebar Collapse Sync**: The sidebar's collapse state is managed in `Sidebar.tsx` and toggles the `sidebar-collapsed` class on `document.body`. This automatically adjusts the margin of `.app-main` via CSS.
2. **Local-first DB**: Use Dexie.js database hooks and helpers from `src/database/db.ts` to query, save, or delete activities, tasks, and history.
3. **AI Brainstorming**: The AI brainstorming engine (`src/database/smartEngine.ts`) uses the Google Generative AI SDK (`@google/generative-ai`) directly on the client side. If the API key is missing or quota is exceeded, it gracefully falls back to a heuristic recommendation engine.
4. **Theme Branding**: Custom theme colors (primary, background, surface, etc.) are loaded from the database and applied dynamically as CSS variables on the root document.
