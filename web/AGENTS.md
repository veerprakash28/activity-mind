# Agent Guidelines for ActivityMind Web

## Code Styling & Quality
* **CSS Variable Styling**: Do not write ad-hoc inline styles for colors, spacing, or borders unless absolutely necessary. Use the CSS variables defined in `src/app/globals.css` (e.g., `var(--color-primary)`, `var(--color-surface)`, `var(--radius-lg)`).
* **Framework Guidelines**: Use standard Next.js App Router patterns. Keep Client Components marked with `'use client'` at the top and keep Server Components static where possible.
* **Database Queries**: Never write raw IndexedDB queries. Always use the Dexie database instance and wrappers exported from `src/database/db.ts`.

## UI Consistency Rules
* **Sidebar Layout**: When modifying the sidebar or layout, ensure the sidebar collapse state is synced to the body class `sidebar-collapsed` so the main content adjusts its margin correctly.
* **Component Parity**: Maintain styling and feature parity with the mobile app. Look at the mobile app's React Native implementation for reference when adding new pages or features.
* **No Placeholders**: Never use placeholder images or lorem ipsum. Use the `ActivityCard` component or mock data that matches real team-building scenarios.
