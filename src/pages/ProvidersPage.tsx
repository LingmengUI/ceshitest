// Page: ProvidersPage.tsx
import { useState } from 'react'
import type { ProviderConfig } from '../types'
import { Badge, Button, EmptyState, Modal, Panel, Skeleton } from '../components/ui'
import { validateProviderConfig, type ProviderValidationResult } from '../utils/domain'

export function ProvidersPage({
  loading,
  providers,
  onSaveProvider,
}: {
  loading: boolean
  providers: ProviderConfig[]
  onSaveProvider: (provider: ProviderConfig) => Promise<boolean>
}) {
  const [editingProvider, setEditingProvider] = useState<ProviderConfig | null>(null)
  const [validation, setValidation] = useState<ProviderValidationResult>({ valid: true, errors: {} })
  const [saving, setSaving] = useState(false)

  async function saveProvider() {
    if (!editingProvider) return
    const result = validateProviderConfig(editingProvider)
    setValidation(result)
    if (!result.valid) return

    setSaving(true)
    const saved = await onSaveProvider(editingProvider)
    setSaving(false)
    if (saved) setEditingProvider(null)
  }

  if (loading && providers.length === 0) return <Skeleton rows={7} />

  return (
    <div className="page-grid providers-layout editorial-page" data-page="providers">
      <section className="page-intro panel wide-panel">
        <div>
          <span className="eyebrow">Provider routing</span>
          <h2>Review the model vendors in one steady list.</h2>
          <p className="muted">Keep rate limits, latency, cost, credentials, and regional notes visible before changing routing policy.</p>
        </div>
        <Badge value="online" label={`${providers.filter((provider) => provider.enabled).length} enabled`} />
      </section>

      <section className="summary-strip wide-panel" aria-label="Provider summary">
        <Panel className="stat-card"><span className="eyebrow">Configured</span><strong>{providers.length}</strong><span className="stat-delta text-neutral">Providers</span></Panel>
        <Panel className="stat-card"><span className="eyebrow">Enabled</span><strong>{providers.filter((provider) => provider.enabled).length}</strong><span className="stat-delta text-success">Routable</span></Panel>
        <Panel className="stat-card"><span className="eyebrow">Avg reliability</span><strong>{providers.length ? `${(providers.reduce((sum, provider) => sum + provider.reliability, 0) / providers.length).toFixed(1)}%` : '0%'}</strong><span className="stat-delta text-info">Across vendors</span></Panel>
      </section>

      <Panel className="provider-command-strip wide-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Routing fabric</span>
            <h2>Model providers</h2>
          </div>
        </div>

        {providers.length === 0 ? (
          <EmptyState title="No providers configured" message="Add provider configuration to enable routing policies." />
        ) : (
          <div className="provider-mosaic">
            {providers.map((provider) => (
              <article className="provider-card" key={provider.id}>
                <div className="provider-topline">
                  <div>
                    <h3>{provider.name}</h3>
                    <p>{provider.notes}</p>
                  </div>
                  <Badge value={provider.enabled ? 'online' : 'offline'} label={provider.enabled ? 'Enabled' : 'Disabled'} />
                </div>
                <dl className="metric-list">
                  <div><dt>Rate limit</dt><dd>{provider.rateLimitPerMinute.toLocaleString()} rpm</dd></div>
                  <div><dt>Latency</dt><dd>{provider.latencyMs}ms p95</dd></div>
                  <div><dt>Cost</dt><dd>${provider.costPerMillionTokens.toFixed(2)} / 1M</dd></div>
                  <div><dt>Reliability</dt><dd>{provider.reliability}%</dd></div>
                  <div><dt>Region</dt><dd>{provider.region}</dd></div>
                  <div><dt>Credential</dt><dd>{provider.apiKeyAlias}</dd></div>
                </dl>
                <Button variant="primary" onClick={() => { setEditingProvider(provider); setValidation({ valid: true, errors: {} }) }}>Configure</Button>
              </article>
            ))}
          </div>
        )}
      </Panel>

      {editingProvider ? (
        <Modal
          title={`Configure ${editingProvider.name}`}
          description="Simulated provider configuration is validated locally and saved through the mock API."
          onClose={() => setEditingProvider(null)}
          footer={
            <>
              <Button onClick={() => setEditingProvider(null)}>Cancel</Button>
              <Button variant="primary" onClick={saveProvider} disabled={saving}>{saving ? 'Saving…' : 'Save provider'}</Button>
            </>
          }
          wide
        >
          <div className="form-grid">
            <label><span>Name</span><input value={editingProvider.name} onChange={(event) => setEditingProvider({ ...editingProvider, name: event.target.value })} /></label>
            <label><span>Region</span><input value={editingProvider.region} onChange={(event) => setEditingProvider({ ...editingProvider, region: event.target.value })} /></label>
            <label><span>Rate limit / min</span><input type="number" min="1" value={editingProvider.rateLimitPerMinute} onChange={(event) => setEditingProvider({ ...editingProvider, rateLimitPerMinute: Number(event.target.value) })} /></label>
            <label><span>Latency ms</span><input type="number" min="1" value={editingProvider.latencyMs} onChange={(event) => setEditingProvider({ ...editingProvider, latencyMs: Number(event.target.value) })} /></label>
            <label><span>Cost / 1M tokens</span><input type="number" min="0" step="0.01" value={editingProvider.costPerMillionTokens} onChange={(event) => setEditingProvider({ ...editingProvider, costPerMillionTokens: Number(event.target.value) })} /></label>
            <label><span>Reliability %</span><input type="number" min="0" max="100" step="0.01" value={editingProvider.reliability} onChange={(event) => setEditingProvider({ ...editingProvider, reliability: Number(event.target.value) })} /></label>
            <label><span>Credential alias</span><input value={editingProvider.apiKeyAlias} onChange={(event) => setEditingProvider({ ...editingProvider, apiKeyAlias: event.target.value })} /></label>
            <label><span>Status</span><select value={editingProvider.enabled ? 'enabled' : 'disabled'} onChange={(event) => setEditingProvider({ ...editingProvider, enabled: event.target.value === 'enabled' })}><option value="enabled">Enabled</option><option value="disabled">Disabled</option></select></label>
            <label className="full"><span>Notes</span><textarea value={editingProvider.notes} onChange={(event) => setEditingProvider({ ...editingProvider, notes: event.target.value })} /></label>
          </div>
          {!validation.valid ? (
            <div className="form-error" role="alert">
              {Object.values(validation.errors).map((error) => <p key={error}>{error}</p>)}
            </div>
          ) : null}
        </Modal>
      ) : null}
    </div>
  )
}
