# Implementation Plan: Agents Page Redesign

## Files to Modify

| # | File | Change |
|---|------|--------|
| 1 | `src/api/mockApi.ts` | Add `batchToggleAgents(ids, enabled)` method |
| 2 | `src/pages/AppRoot.tsx` | Add `batchToggleAgents` handler; pass to `AgentsPage` |
| 3 | `src/pages/AgentsPage.tsx` | Filter chips, checkbox column, batch bar, summary click, intro cleanup |
| 4 | `src/index.css` | New styles for chips, checkbox, batch bar, hover enhancements |

## Task Breakdown

### Task 1: Mock API — `batchToggleAgents`

**File:** `src/api/mockApi.ts`

- Add `async batchToggleAgents(ids: string[], enabled: boolean)` method
- Map over `agentState`: for agents whose `id` is in `ids`, update `enabled`; if enabling an offline agent, set status to `'idle'`
- Call `withNetwork` with the updated matching agents array
- Return the updated agents (filtered by ids)

### Task 2: AppRoot — Batch handler

**File:** `src/pages/AppRoot.tsx`

- Add `async function batchToggleAgents(ids: string[], enabled: boolean)`:
  - Optimistically update local state (`setAgents`)
  - Call `mockApi.batchToggleAgents(ids, enabled)`
  - Push success toast (e.g. "N agents enabled/disabled")
  - On error, revert and push danger toast
- Pass `onBatchToggleAgents={batchToggleAgents}` to `<AgentsPage>`

### Task 3: AgentsPage — Core UI rewrite

**File:** `src/pages/AgentsPage.tsx`

**Subtasks (all in one edit batch):**

1. **State additions:**
   - `selectedIds: Set<string>` (useState)
   - Delete the old Status-related filter — no change needed to `AgentFilters` shape

2. **Summary strip interactivity:**
   - Online stat card `onClick` → set `filters.status = 'online'`
   - High risk stat card `onClick` → set `filters.riskLevel = 'high'`
   - Wrap stat cards in `<button type="button" className="link-button" …>` for clickability

3. **Filter bar — Status dropdown → chips:**
   - Remove the `<select>` for Status
   - Render a flex row of chip buttons using the existing `Button` component
   - Statuses: `['all', 'online', 'idle', 'degraded', 'offline']`
   - Active chip = `variant="primary"`, inactive = `variant="secondary"`
   - Each chip label: `Online` or `Online (4)` — compute count from `agents.filter(a => a.status === ...)`
   - `onClick` sets `filters.status`

4. **Batch-action bar:**
   - Render between filter bar and table when `selectedIds.size > 0`
   - Left text: "N agents selected"
   - Right: Enable button + Disable button
   - **Disable guard:** if any selected agent has `riskLevel === 'critical' || 'high'`, open `ConfirmDialog` before proceeding
   - On confirm, call `onBatchToggleAgents([...selectedIds], enabled)`, then clear selection

5. **Table checkbox column:**
   - Insert `<th>` with checkbox in `<thead>`
   - First `<td>` in each row with checkbox
   - Header checkbox: checked = all visible selected, indeterminate = partial
   - `onChange` selects/deselects all visible, or individual

6. **Page intro cleanup:**
   - Remove the right-aligned `Badge` (`N visible`)

### Task 4: CSS additions

**File:** `src/index.css`

- `.filter-chips` — flex row, gap
- `.batch-bar` — floating bar between filter and table
- `.batch-bar.active` — visible state
- `th:first-child, td:first-child` — adjust width for checkbox column
- `tbody tr:hover` — subtle background change
- `.stat-card-clickable` — cursor pointer, no extra focus ring disruption

## Verification

1. Load Agents page — chips render correctly with counts; no Status dropdown present
2. Click Online chip — table filters to online agents; chip visually active
3. Click another chip or All — filter updates
4. Click Online stat card — Online chip becomes active, table filters
5. Check a row checkbox — batch bar appears with correct count
6. Click header checkbox — all visible rows selected; batch bar shows total count
7. Click Enable — toast shows, agents enabled, selection cleared
8. Click Disable on high-risk agents — ConfirmDialog appears
9. Click Disable on low-risk agents — no dialog, direct action
10. Unselect all — batch bar disappears
11. Responsive: narrow viewport — chips wrap, batch bar stacks
12. Error case: mock API fails — state reverts, error toast shown
