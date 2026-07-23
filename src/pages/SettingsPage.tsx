// Page: SettingsPage.tsx
import { useState } from 'react'
import type { ProviderConfig, Settings } from '../types'
import { Button, Panel } from '../components/ui'

export function SettingsPage({
  providers,
  settings,
  onSaveSettings,
}: {
  providers: ProviderConfig[]
  settings: Settings
  onSaveSettings: (settings: Settings) => void
}) {
  const [draft, setDraft] = useState(settings)
  const [error, setError] = useState('')

  function saveSettings() {
    if (draft.costWarningThreshold < 0) {
      setError('Cost warning threshold cannot be negative.')
      return
    }
    setError('')
    onSaveSettings(draft)
  }

  return (
    <div className="page-grid settings-page settings-console editorial-page" data-page="settings">
      <section className="page-intro panel wide-panel">
        <div>
          <span className="eyebrow">Workspace policy</span>
          <h2>Set the operating rules in plain view.</h2>
          <p className="muted">Keep appearance, spend thresholds, default routing, and operator notifications grouped as readable policy sections.</p>
        </div>
        <Button variant="primary" onClick={saveSettings}>Save settings</Button>
      </section>

      <Panel className="settings-command-panel wide-panel">
        <div className="settings-grid">
          <section className="settings-card">
            <h3>Appearance</h3>
            <p>Choose how the command center resolves light and dark mode.</p>
            <label>
              <span>Theme</span>
              <select value={draft.theme} onChange={(event) => setDraft({ ...draft, theme: event.target.value as Settings['theme'] })}>
                <option value="system">System</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <label className="toggle-row">
              <span>Compact list density</span>
              <input
                checked={draft.compactListDensity}
                type="checkbox"
                onChange={(event) => setDraft({ ...draft, compactListDensity: event.target.checked })}
              />
            </label>
          </section>

          <section className="settings-card">
            <h3>Cost controls</h3>
            <p>Warn operators when projected monthly model spend crosses this threshold.</p>
            <label>
              <span>Warning threshold (USD)</span>
              <input
                min="0"
                type="number"
                value={draft.costWarningThreshold}
                onChange={(event) => setDraft({ ...draft, costWarningThreshold: Number(event.target.value) })}
              />
            </label>
          </section>

          <section className="settings-card">
            <h3>Default routing</h3>
            <p>New tasks use this provider unless a policy selects a better match.</p>
            <label>
              <span>Default provider</span>
              <select value={draft.defaultProvider} onChange={(event) => setDraft({ ...draft, defaultProvider: event.target.value as Settings['defaultProvider'] })}>
                {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
              </select>
            </label>
          </section>

          <section className="settings-card notification-card">
            <h3>Notifications</h3>
            <p>Control which operator notifications appear in the command center.</p>
            {Object.entries(draft.notifications).map(([key, enabled]) => (
              <label className="toggle-row" key={key}>
                <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())}</span>
                <input
                  checked={enabled}
                  type="checkbox"
                  onChange={(event) => setDraft({
                    ...draft,
                    notifications: { ...draft.notifications, [key]: event.target.checked },
                  })}
                />
              </label>
            ))}
          </section>
        </div>
        {error ? <p className="form-error" role="alert">{error}</p> : null}
      </Panel>
    </div>
  )
}
