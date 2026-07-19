# Agents Page Redesign

**Date:** 2026-07-13
**Status:** Draft for review

## Background

The Agents page displays a fleet of production AI agents with status, provider, capability, risk, and cost information. The current implementation uses a table with dropdown-based filters and per-row Enable/Disable toggles. This redesign adds quick status filter chips, checkbox-based multi-select, and batch enable/disable operations while refreshing the visual layout.

## Scope

1. Replace the Status dropdown with clickable filter chips.
2. Add per-row checkbox + table header "select all" for batch operations.
3. Add a floating batch-action bar (Enable / Disable) that appears when ≥1 row is selected.
4. Minor visual refresh to the page intro, summary strip interaction, and table hover states.
5. New mock API method `batchToggleAgents` and corresponding `AppRoot` handler.
6. Confirmation dialog when batch-disabling high-risk or critical agents.

## Design Decisions (Approved)

### Layout: Compact Enhancement (Option A)
Keep the existing `page-grid / agents-layout` structure. The filter bar, table, and summary strip retain their relative positions. The only structural addition is the batch-action bar between the filter bar and the table.

### Section 1: Quick Status Filter Chips

- Replace the Status `<select>` dropdown with a row of color-coded, mutually exclusive chip buttons.
- Chips: **All** (default) | **Online** 🟢 (success) | **Idle** ⚪ (neutral) | **Degraded** 🟡 (warning) | **Offline** 🔴 (danger)
- Each chip displays the count of agents in that status, e.g. `Online (4)`.
- Selecting a chip sets `filters.status`; clicking "All" or another chip clears/resets.
- Chips compose with other filters (Search, Provider, Capability, Risk) via AND logic — existing `filterAgents` utility unchanged.
- CSS: render as a flex row of `Button` variants (`btn-*` classes), with the active chip using `btn-primary` and inactive chips using `btn-secondary`/`btn-ghost`.

### Section 2: Multi-Select & Batch Actions

- **Checkbox column**: Insert as the first column in `<thead>` and `<tbody>`. Compact width.
- **Header checkbox**: Three-state (unchecked, indeterminate for partial, checked for all). Selects/deselects all visible rows.
- **Batch-action bar**: Appears between the filter bar and the table when `selected.size > 0`.
  - Left: "N agents selected"
  - Right: **Enable** (`btn-primary`) and **Disable** (`btn-danger`) buttons.
- **Confirmation safeguard**: If any selected agent has `riskLevel === 'critical'` or `'high'`, clicking **Disable** opens a `ConfirmDialog` warning the user.
- **Post-action**: Clear all selections, show a success toast (or error toast if the mock API rejects).
- **Mock API**: Add `mockApi.batchToggleAgents(ids: string[], enabled: boolean)` that updates `agentState` in a single pass.
- **AppRoot**: Add `batchToggleAgents(ids, enabled)` handler that calls the mock API and pushes toast feedback.
- **Props**: Pass `onBatchToggleAgents` to `AgentsPage`.

### Section 3: Visual Refresh

- **Page intro**: Remove the right-hand badge ("N visible") — the summary strip already conveys this.
- **Summary strip**: 
  - Keep 4 stat cards (Visible, Online, High risk, Capabilities).
  - Clicking the Online stat card selects the Online filter chip. Clicking High risk selects the High risk filter in the Risk dropdown.
- **Filter bar**: Adjust `grid-template-columns` to accommodate chips replacing the Status dropdown (chips need less horizontal space).
- **Table**: 
  - Add checkbox column as described.
  - Hover contrast slightly increased (existing `box-shadow: inset 0 0 0 1px` remains; add subtle background shift on hover).
- **Responsive**: 
  - Chips wrap naturally on narrow screens.
  - Batch-action bar stacks buttons vertically at mobile widths.

### Data & State Changes

| File | Change |
|------|--------|
| `src/types.ts` | No new types required. `AgentFilters.status` already supports the needed values. |
| `src/utils/domain.ts` | No changes — `filterAgents` already handles status filtering from `AgentFilters`. |
| `src/api/mockApi.ts` | Add `batchToggleAgents(ids, enabled)`. |
| `src/pages/AppRoot.tsx` | Add `batchToggleAgents` handler; pass to `AgentsPage`. |
| `src/pages/AgentsPage.tsx` | Replace Status dropdown with chips; add checkbox column, selection state, batch-action bar. |
| `src/components/ui.tsx` | No changes needed — `Button`, `Badge`, `ConfirmDialog` already available. |
| `src/index.css` | Add styles for filter chips, checkbox column, batch-action bar, enhanced table hover. |

## Out of Scope

- No changes to the Agent detail modal.
- No changes to other pages.
- No routing or navigation changes.
- No backend/persistence changes for the batch action (single-page state only).
