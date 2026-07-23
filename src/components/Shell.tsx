import type { ReactNode } from 'react'
import type { ThemePreference } from '../types'
import { Button } from './ui'

export type PageKey = 'dashboard' | 'agents' | 'tasks' | 'providers' | 'incidents' | 'settings'

const navItems: Array<{ key: PageKey; label: string; code: string }> = [
  { key: 'dashboard', label: 'Overview', code: '01' },
  { key: 'agents', label: 'AI Workforce', code: '02' },
  { key: 'tasks', label: 'Work Queue', code: '03' },
  { key: 'providers', label: 'Model Hub', code: '04' },
  { key: 'incidents', label: 'Reliability', code: '05' },
  { key: 'settings', label: 'Configuration', code: '06' },
]

export function Shell({
  activePage,
  children,
  globalSearch,
  mobileOpen,
  notificationCount,
  theme,
  onNavigate,
  onSearch,
  onToggleMobile,
  onThemeChange,
}: {
  activePage: PageKey
  children: ReactNode
  globalSearch: string
  mobileOpen: boolean
  notificationCount: number
  theme: ThemePreference
  onNavigate: (page: PageKey) => void
  onSearch: (value: string) => void
  onToggleMobile: () => void
  onThemeChange: (theme: ThemePreference) => void
}) {
  const activeLabel = navItems.find((item) => item.key === activePage)?.label ?? 'Dashboard'

  const nav = (
    <nav className="sidebar-nav" aria-label="Primary navigation">
      {navItems.map((item) => (
        <button
          key={item.key}
          className={`nav-item ${activePage === item.key ? 'active' : ''}`}
          type="button"
          onClick={() => onNavigate(item.key)}
          aria-current={activePage === item.key ? 'page' : undefined}
        >
          <span className="nav-code" aria-hidden="true">{item.code}</span>
          {item.label}
        </button>
      ))}
    </nav>
  )

  return (
    <div className="app-shell">
      {mobileOpen ? <div className="mobile-backdrop" onClick={onToggleMobile} role="presentation" /> : null}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 10L10 3l7 7-7 7-7-7z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M10 6l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <strong>Xinr</strong>
            <span>AI operations platform</span>
          </div>
        </div>
        {nav}
        <div className="sidebar-card">
        <span className="eyebrow">Platform status</span>
        <strong>All systems nominal</strong>
        <p>6 providers · 10 agents · online</p>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <button className="icon-button menu-button" type="button" onClick={onToggleMobile} aria-label="Open navigation">☰</button>
          <div>
            <span className="eyebrow">Operations workspace</span>
            <h1>{activeLabel}</h1>
          </div>
          <label className="search-box">
            <span className="sr-only">Search command center</span>
            <input value={globalSearch} onChange={(event) => onSearch(event.target.value)} placeholder="Search agents, tasks, incidents…" />
          </label>
          <div className="topbar-actions">
            <button className="notification-button" type="button" aria-label={`${notificationCount} critical notifications`}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span>{notificationCount}</span>
            </button>
            <select value={theme} onChange={(event) => onThemeChange(event.target.value as ThemePreference)} aria-label="Theme preference">
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
            <Button className="user-menu" variant="ghost" aria-label="User menu">
              <span className="avatar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4"/>
                  <path d="M20 21a8 8 0 0 0-16 0"/>
                </svg>
              </span>
              ops@xinr.io
            </Button>
          </div>
        </header>
        <main className="content" id="main-content">{children}</main>
      </div>
    </div>
  )
}
