# Overview AI Workforce Health Design

Date: 2026-07-18
Status: Approved in conversation; awaiting written-spec review

## Goal

Replace the first menu page, `Overview`, with a read-only AI workforce health overview. The page should help operators assess Agent status, output, quality, cost, and model performance at a glance.

## Scope

- Replace all current `DashboardPage` content.
- Reuse the existing Agent, task, dashboard, and Provider data passed into the page.
- Keep the existing mock API and shared data contracts unchanged.
- Keep the page read-only. Do not add actions, filters, or navigation shortcuts.
- Remove the old task-volume trend, error trend, activity feed, spend-mix, and critical-alert sections from Overview.

## Information Architecture

### Page introduction

Use the title `AI 团队健康 / AI Workforce Health` with concise bilingual supporting copy. Show a bilingual live-telemetry badge.

### Core metrics

Show four summary metrics derived from existing data:

1. `活跃 Agent / Active agents`: enabled Agents whose status is not offline.
2. `团队成功率 / Team success rate`: the existing dashboard success rate.
3. `运行中任务 / Running tasks`: the existing dashboard running-task count.
4. `月度成本 / Monthly cost`: the existing dashboard monthly cost.

Each metric may include a short bilingual context line derived from current Agent status or task data.

### Main column

`团队健康 / Team health` summarizes Agent counts for online, idle, degraded, and offline states. Each state uses its established semantic color and a proportional horizontal bar.

`需要关注 / Needs attention` lists Agents that are degraded, offline, high risk, or critical risk. Each row shows:

- Agent name and owner
- Bilingual status
- Provider
- Success rate
- Active task count
- Last heartbeat

The list is ordered so degraded or offline Agents appear before Agents included only because of risk. When no Agent requires attention, show a bilingual healthy-state message.

### Supporting column

`模型表现 / Model performance` compares enabled Providers using existing reliability, p95 latency, and cost-per-million-token data. Reliability is the primary comparison value and is shown with a horizontal bar.

`工作负载 / Workload` compares enabled Agents by active task count, ordered from highest to lowest. Each row shows Agent name, bilingual status, task count, and a proportional horizontal bar.

## Visual Design

Use the selected health-overview-board layout: a summary strip at the top, followed by a wider primary column and a narrower supporting column. Follow the current console's restrained visual language, compact spacing, typography, panel treatment, and semantic colors.

Chinese and English have equal visual weight and appear together, separated by `/`, including headings, metric labels, status labels, empty states, and loading-related messages introduced by this page. Labels may wrap where needed; values remain visually stable.

Avoid large warning surfaces. Use focused status accents on bars, badges, and affected Agent rows. Use horizontal comparison bars for health distribution, model reliability, and workload.

## Data And Behavior

All display values are derived synchronously from the existing props supplied to `DashboardPage`. No persistence, mutation, network endpoint, or shared type changes are required.

Keep the current page-level loading behavior: while loading with no dashboard data, show the existing skeleton. If dashboard data is unavailable after loading, keep the existing telemetry-unavailable empty state and make its copy bilingual.

If Agent data is empty, the health, attention, and workload sections show bilingual empty messages. If Provider data is empty, model performance shows a bilingual empty message. The page must not invent fallback metrics.

## Responsive Behavior

Desktop uses a two-column main area with workforce health and attention in the primary column, and model performance and workload in the supporting column.

On narrow screens, sections stack in this order:

1. Core metrics
2. Team health
3. Needs attention
4. Model performance
5. Workload

Bilingual labels may wrap without overlapping values, bars, or adjacent content. Fixed comparison controls retain stable dimensions as content changes.

## Implementation Boundary

Primary implementation files:

- `src/pages/DashboardPage.tsx`: replace page structure and add local derived-view helpers.
- `src/index.css`: replace or adjust Dashboard-specific layout and component styles.

`src/pages/AppRoot.tsx`, API modules, mock data, shared types, and other pages remain unchanged unless implementation diagnostics reveal a direct compile dependency.

## Verification

- Confirm metric values and status counts from the existing mock data.
- Confirm attention ordering and workload ordering.
- Confirm empty behavior for missing Agent and Provider arrays.
- Check the Overview at desktop and narrow viewport widths for wrapping, ordering, and overlap.
- Confirm no controls or mutations were introduced.
