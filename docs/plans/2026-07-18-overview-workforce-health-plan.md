# Implementation Plan: Overview AI Workforce Health

## Goal

Replace the first menu page's current operational dashboard with the approved bilingual, read-only AI workforce health overview. Reuse the existing page props and keep API and shared data contracts unchanged.

## Files To Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/pages/DashboardPage.tsx` | Replace the current Overview content, add local data derivation, and render the five approved health sections |
| 2 | `src/index.css` | Replace obsolete Dashboard-specific styles with the health-board layout, comparison rows, attention list, and responsive stacking |

## Task 1: Derive Workforce Health Data

**File:** `src/pages/DashboardPage.tsx`

- Remove `MiniBarChart` and `CostBreakdown`, which belong only to the old dashboard.
- Add local bilingual labels for the four Agent statuses.
- Derive status counts for `online`, `idle`, `degraded`, and `offline` from `agents`.
- Derive the attention list from Agents that are degraded, offline, high risk, or critical risk.
- Sort attention Agents by operational state first, then risk severity, while preserving stable name ordering for ties.
- Filter model performance to enabled Providers and retain reliability, p95 latency, and per-million-token cost.
- Filter workload to enabled Agents and sort descending by active task count.
- Calculate proportional bar widths with a non-zero denominator and use zero-width bars for zero values.

## Task 2: Replace Overview Markup

**File:** `src/pages/DashboardPage.tsx`

- Keep the existing loading skeleton boundary.
- Change the unavailable-dashboard empty state to bilingual copy.
- Replace the page introduction with `AI 团队健康 / AI Workforce Health`, bilingual supporting copy, and a bilingual telemetry badge.
- Render four summary cards for active Agents, team success rate, running tasks, and monthly cost.
- Render `团队健康 / Team health` with one comparison row per Agent status.
- Render `需要关注 / Needs attention` with Agent identity, owner, bilingual state, Provider, success rate, active tasks, and heartbeat.
- Render `模型表现 / Model performance` with reliability bars and supporting latency and cost values.
- Render `工作负载 / Workload` with enabled Agents, bilingual status, active-task totals, and proportional bars.
- Add bilingual empty messages to sections whose Agent or Provider inputs are empty.
- Keep every section presentational: no buttons, links, filters, or mutation callbacks.

## Task 3: Implement Health-Board Styling

**File:** `src/index.css`

- Retain shared `page-intro`, `summary-strip`, `content-columns`, `panel`, `badge`, and `progress-track` primitives where they fit.
- Add Dashboard-owned classes for health distribution, attention rows, model rows, workload rows, bilingual labels, and compact metadata.
- Use semantic status colors for health bars and Agent state indicators.
- Keep attention emphasis local to the affected row; avoid full-panel warning backgrounds.
- Give bar tracks and metric/value columns stable dimensions so changing values do not shift surrounding layout.
- Remove obsolete Dashboard-only selectors for throughput, reliability, spend, activity, alerts, mini charts, and cost rows when they have no remaining users.
- Preserve shared selectors still used by other pages.

## Task 4: Responsive Behavior

**File:** `src/index.css`

- Keep the desktop main area at a wider primary column and narrower supporting column.
- At the existing tablet breakpoint, stack the main and supporting columns in the approved section order.
- At the narrow breakpoint, collapse summary metrics to one column and allow bilingual labels and metadata to wrap.
- Ensure Agent identity, numeric values, and bars do not overlap or resize their rows unexpectedly.

## Verification

1. Confirm the existing mock data produces four summary cards, status counts totaling seven Agents, and five active Agents.
2. Confirm degraded and offline Agents lead the attention list, followed by Agents included for high or critical risk.
3. Confirm only enabled Providers appear in model performance.
4. Confirm only enabled Agents appear in workload and are ordered by active task count.
5. Confirm empty Agent and Provider arrays render the approved bilingual empty messages without invented values.
6. Inspect the page at desktop and narrow viewport widths for section order, wrapping, stable bars, and overlap.
7. Confirm the Overview contains no interactive controls and the other menu pages retain their existing shared styling.
8. Use the current edit diagnostics for both changed files and run the project build once because the page rewrite changes JSX structure and removes local helpers.
