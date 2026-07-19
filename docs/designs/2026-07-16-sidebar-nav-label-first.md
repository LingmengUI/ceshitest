# Sidebar Navigation — Label-First Layout

**Date:** 2026-07-16  
**Scope:** Primary sidebar nav items only (not brand block, readiness card, or topbar)  
**Files:** `src/components/Shell.tsx`, `src/index.css`

## Problem

Nav items use a left-aligned number code (`01`–`06`) beside the label. The code and label compete for attention; spacing and alignment feel tight and uneven.

## Decision

Adopt **label-first** layout:

- Label is the primary left-aligned text.
- Code sits on the right, smaller and muted.
- Selected state emphasizes the row and turns the code primary-colored.
- Hover brightens the row; code stays muted unless selected.

## Markup

Each nav button:

```tsx
<button className={`nav-item ${active ? 'active' : ''}`} …>
  <span className="nav-label">{item.label}</span>
  <span className="nav-code" aria-hidden="true">{item.code}</span>
</button>
```

- Order: label first, code second.
- Keep existing `navItems` data (`key`, `label`, `code`).
- Keep accessibility: `aria-current="page"` on active item; code remains decorative (`aria-hidden`).

## Styles

| Token / rule | Target |
|---|---|
| `.sidebar-nav` | Slightly larger gap between items (~0.25–0.35rem) |
| `.nav-item` | `display: flex; justify-content: space-between; align-items: center`; horizontal padding ~0.65–0.75rem; vertical padding comfortable for touch (~0.6–0.7rem) |
| `.nav-label` | Inherits item color/weight; primary reading target |
| `.nav-code` | Monospace, smaller size, muted color; no fixed left column width |
| `.nav-item:hover` | Stronger text + muted surface background; code stays muted |
| `.nav-item.active` | Strong text + surface-strong background; `.nav-code` uses `--primary` |

Out of scope: brand header, readiness card, mobile drawer behavior, topbar.

## Success criteria

1. Labels scan left-to-right as a clean list.
2. Codes are secondary and right-aligned.
3. Active item is obvious without a left-rail code column.
4. No change to navigation behavior or page keys.

## Non-goals

- Removing codes entirely
- Iconography
- Collapsible sidebar / nested sections
- Redesigning the rest of the shell
