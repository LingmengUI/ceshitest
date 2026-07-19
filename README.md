# Xinr AI Operations Console

Xinr is a React, TypeScript, and Vite single-page application for exploring an AI operations command center UI. This README intentionally contains more than fifty lines so large single-file edit handling can be tested clearly.

## Purpose

The app demonstrates a polished operational dashboard for teams that supervise agents, providers, incidents, task boards, and system settings.

## Stack

- React for the interface layer.
- TypeScript for application types.
- Vite for development and build tooling.
- CSS modules-by-convention through shared global styles.
- Mock data and mock API helpers for local interaction.

## Project structure

```text
src/
  api/
    mockApi.ts
  components/
    Shell.tsx
    ui.tsx
  data/
    mockData.ts
  hooks/
    useTheme.ts
  pages/
    AgentsPage.tsx
    AppRoot.tsx
    DashboardPage.tsx
    IncidentsPage.tsx
    ProvidersPage.tsx
    SettingsPage.tsx
    TaskBoardPage.tsx
  utils/
    domain.ts
    storage.ts
```

## Main areas

### Dashboard

The dashboard summarizes platform health, live activity, and operational signals. It should stay concise and useful at a glance.

### Agents

The agents page focuses on operator-facing control, status visibility, and safe state changes for agent workloads.

### Incidents

The incidents page groups ongoing events, priority indicators, and recovery-oriented actions.

### Providers

The providers page shows external service health, capability metadata, and provider-level status.

### Task board

The task board presents actionable work items in a way that supports scanning, prioritization, and follow-up.

### Settings

Settings expose configurable behavior without overwhelming the operator with implementation details.

## Development workflow

1. Install dependencies with npm.
2. Start the Vite development server.
3. Make targeted changes in the relevant page, component, or utility.
4. Keep mock data realistic enough to exercise empty, loading, success, and error states.
5. Validate UI changes in the browser when layout or interaction behavior is affected.

## Design principles

- Prefer calm operational clarity over decorative noise.
- Keep dense information readable through spacing and hierarchy.
- Use consistent buttons, cards, labels, and status treatments.
- Preserve accessibility semantics for interactive controls.
- Avoid hardcoded behavior that belongs in domain utilities or mock API helpers.

## Testing notes

This repository includes small utility-level tests and is suitable for quick UI iteration. For visual work, browser verification is more useful than only static inspection.

## Editing conventions

- Page-specific UI belongs in `src/pages`.
- Reusable shell or primitive UI belongs in `src/components`.
- Domain transformations belong in `src/utils`.
- Mock backend behavior belongs in `src/api`.
- Static sample entities belong in `src/data`.

## Large edit test marker

The following numbered lines are included to make this file comfortably exceed fifty lines after modification.

01. Large edit verification line.
02. Large edit verification line.
03. Large edit verification line.
04. Large edit verification line.
05. Large edit verification line.
06. Large edit verification line.
07. Large edit verification line.
08. Large edit verification line.
09. Large edit verification line.
10. Large edit verification line.
11. Large edit verification line.
12. Large edit verification line.
13. Large edit verification line.
14. Large edit verification line.
15. Large edit verification line.
16. Large edit verification line.
17. Large edit verification line.
18. Large edit verification line.
19. Large edit verification line.
20. Large edit verification line.
21. Large edit verification line.
22. Large edit verification line.
23. Large edit verification line.
24. Large edit verification line.
25. Large edit verification line.
26. Large edit verification line.
27. Large edit verification line.
28. Large edit verification line.
29. Large edit verification line.
30. Large edit verification line.

## Notes

This file is documentation only, so the edit does not change runtime behavior.
