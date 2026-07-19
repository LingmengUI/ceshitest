// Page: AgentsPage.tsx
import { useMemo, useState } from 'react'
import type { Agent, AgentFilters, AgentSortKey, ProviderConfig, SortDirection } from '../types'
import { Badge, Button, ConfirmDialog, EmptyState, Modal, Panel, Skeleton } from '../components/ui'
import { filterAgents, formatCurrency } from '../utils/domain'

const STATUS_CHIPS: Array<{ key: AgentFilters['status']; label: string; tone: string }> = [
  { key: 'all', label: 'All', tone: 'neutral' },
  { key: 'online', label: 'Online', tone: 'success' },
  { key: 'idle', label: 'Idle', tone: 'neutral' },
  { key: 'degraded', label: 'Degraded', tone: 'warning' },
  { key: 'offline', label: 'Offline', tone: 'danger' },
]

export function AgentsPage({
  agents,
  loading,
  providers,
  onToggleAgent,
  onBatchToggleAgents,
}: {
  agents: Agent[]
  loading: boolean
  providers: ProviderConfig[]
  onToggleAgent: (agent: Agent) => void
  onBatchToggleAgents: (ids: string[], enabled: boolean) => void
}) {
  const [filters, setFilters] = useState<AgentFilters>({ status: 'all', provider: 'all', capability: 'all', riskLevel: 'all', query: '' })
  const [sortKey, setSortKey] = useState<AgentSortKey>('name')
  const [direction, setDirection] = useState<SortDirection>('asc')
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBatchEnabled, setConfirmBatchEnabled] = useState<boolean | null>(null)

  const capabilities = useMemo(() => Array.from(new Set(agents.map((agent) => agent.capability))).sort(), [agents])
  const visibleAgents = useMemo(() => filterAgents(agents, filters, sortKey, direction), [agents, direction, filters, sortKey])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: agents.length }
    for (const agent of agents) {
      counts[agent.status] = (counts[agent.status] ?? 0) + 1
    }
    return counts
  }, [agents])

  const hasSelection = selectedIds.size > 0
  const selectedAgents = useMemo(
    () => agents.filter((agent) => selectedIds.has(agent.id)),
    [agents, selectedIds],
  )
  const selectionHasHighRisk = useMemo(
    () => selectedAgents.some((agent) => agent.riskLevel === 'critical' || agent.riskLevel === 'high'),
    [selectedAgents],
  )

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds((prev) => {
      const allVisible = new Set(visibleAgents.map((a) => a.id))
      const allSelected = visibleAgents.every((a) => prev.has(a.id))
      if (allSelected) {
        const next = new Set(prev)
        for (const id of allVisible) next.delete(id)
        return next
      }
      const next = new Set(prev)
      for (const id of allVisible) next.add(id)
      return next
    })
  }

  const allVisibleSelected = visibleAgents.length > 0 && visibleAgents.every((a) => selectedIds.has(a.id))
  const someVisibleSelected = visibleAgents.some((a) => selectedIds.has(a.id))

  function updateSort(nextKey: AgentSortKey) {
    if (sortKey === nextKey) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(nextKey)
    setDirection('asc')
  }

  function getAriaSort(key: AgentSortKey): 'none' | 'ascending' | 'descending' {
    if (sortKey !== key) return 'none'
    return direction === 'asc' ? 'ascending' : 'descending'
  }

  if (loading && agents.length === 0) return <Skeleton rows={8} />

  return (
    <div className="page-grid agents-layout editorial-page" data-page="agents">
      <section className="page-intro panel wide-panel">
        <div>
          <span className="eyebrow">Agent directory</span>
          <h2>Keep the fleet readable.</h2>
          <p className="muted">Filter the agent roster by owner, provider, capability, and risk before changing production availability.</p>
        </div>
      </section>

      <section className="summary-strip wide-panel" aria-label="Agent summary">
        <Panel className="stat-card"><span className="eyebrow">Visible</span><strong>{visibleAgents.length}</strong><span className="stat-delta text-neutral">Current filters</span></Panel>
        <button className="stat-card link-button" type="button" onClick={() => setFilters({ ...filters, status: 'online' })}>
          <Panel className="stat-card"><span className="eyebrow">Online</span><strong>{agents.filter((agent) => agent.status === 'online').length}</strong><span className="stat-delta text-success">Ready</span></Panel>
        </button>
        <button className="stat-card link-button" type="button" onClick={() => setFilters({ ...filters, riskLevel: 'high' })}>
          <Panel className="stat-card"><span className="eyebrow">High risk</span><strong>{agents.filter((agent) => agent.riskLevel === 'critical' || agent.riskLevel === 'high').length}</strong><span className="stat-delta text-warning">Review first</span></Panel>
        </button>
        <Panel className="stat-card"><span className="eyebrow">Capabilities</span><strong>{capabilities.length}</strong><span className="stat-delta text-info">Unique skills</span></Panel>
      </section>

      <Panel className="agents-table-panel wide-panel">
        <div className="panel-heading table-heading">
          <div>
            <span className="eyebrow">Agent fleet</span>
            <h2>Production AI agents</h2>
          </div>
        </div>

        <div className="filter-bar" role="search">
          <label>
            <span>Search</span>
            <input value={filters.query} onChange={(event) => setFilters({ ...filters, query: event.target.value })} placeholder="Agent, owner, capability" />
          </label>
          <label>
            <span>Status</span>
            <div className="filter-chips">
              {STATUS_CHIPS.map((chip) => (
                <Button
                  key={chip.key}
                  variant={filters.status === chip.key ? 'primary' : 'secondary'}
                  onClick={() => setFilters({ ...filters, status: chip.key })}
                >
                  {chip.label}
                  {chip.key !== 'all' ? <Badge value={chip.tone} label={`${statusCounts[chip.key] ?? 0}`} /> : null}
                </Button>
              ))}
            </div>
          </label>
          <label>
            <span>Provider</span>
            <select value={filters.provider} onChange={(event) => setFilters({ ...filters, provider: event.target.value as AgentFilters['provider'] })}>
              <option value="all">All providers</option>
              {providers.map((provider) => <option key={provider.id} value={provider.id}>{provider.name}</option>)}
            </select>
          </label>
          <label>
            <span>Capability</span>
            <select value={filters.capability} onChange={(event) => setFilters({ ...filters, capability: event.target.value })}>
              <option value="all">All capabilities</option>
              {capabilities.map((capability) => <option key={capability} value={capability}>{capability}</option>)}
            </select>
          </label>
          <label>
            <span>Risk</span>
            <select value={filters.riskLevel} onChange={(event) => setFilters({ ...filters, riskLevel: event.target.value as AgentFilters['riskLevel'] })}>
              <option value="all">All risk levels</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>

        {hasSelection ? (
          <div className="batch-bar active">
            <span className="batch-bar-label">{selectedIds.size} agent{selectedIds.size > 1 ? 's' : ''} selected</span>
            <div className="batch-bar-actions">
              <Button variant="primary" onClick={() => onBatchToggleAgents([...selectedIds], true)}>Enable</Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (selectionHasHighRisk) {
                    setConfirmBatchEnabled(false)
                  } else {
                    onBatchToggleAgents([...selectedIds], false)
                    setSelectedIds(new Set())
                  }
                }}
              >
                Disable
              </Button>
            </div>
          </div>
        ) : null}

        {visibleAgents.length === 0 ? (
          <EmptyState title="No agents match these filters" message="Clear search or broaden filter criteria to inspect the fleet." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="checkbox-col">
                    <input
                      type="checkbox"
                      ref={(el) => { if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected }}
                      checked={allVisibleSelected}
                      onChange={toggleAll}
                      aria-label="Select all visible agents"
                    />
                  </th>
                  <th aria-sort={getAriaSort('name')}><button type="button" aria-label="Sort by Agent" onClick={() => updateSort('name')}>Agent</button></th>
                  <th aria-sort={getAriaSort('status')}><button type="button" aria-label="Sort by Status" onClick={() => updateSort('status')}>Status</button></th>
                  <th aria-sort={getAriaSort('provider')}><button type="button" aria-label="Sort by Provider" onClick={() => updateSort('provider')}>Provider</button></th>
                  <th>Capability</th>
                  <th aria-sort={getAriaSort('riskLevel')}><button type="button" aria-label="Sort by Risk" onClick={() => updateSort('riskLevel')}>Risk</button></th>
                  <th aria-sort={getAriaSort('successRate')}><button type="button" aria-label="Sort by Success" onClick={() => updateSort('successRate')}>Success</button></th>
                  <th aria-sort={getAriaSort('monthlyCost')}><button type="button" aria-label="Sort by Cost" onClick={() => updateSort('monthlyCost')}>Cost</button></th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visibleAgents.map((agent) => (
                  <tr key={agent.id} className={selectedIds.has(agent.id) ? 'row-selected' : ''}>
                    <td className="checkbox-col">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(agent.id)}
                        onChange={() => toggleId(agent.id)}
                        aria-label={`Select ${agent.name}`}
                      />
                    </td>
                    <td>
                      <button className="link-button" type="button" onClick={() => setSelectedAgent(agent)}>{agent.name}</button>
                      <small>{agent.owner} · {agent.lastHeartbeat}</small>
                    </td>
                    <td><Badge value={agent.status} /></td>
                    <td>{providers.find((provider) => provider.id === agent.provider)?.name ?? agent.provider}</td>
                    <td>{agent.capability}</td>
                    <td><Badge value={agent.riskLevel} /></td>
                    <td>{agent.successRate}%</td>
                    <td>{formatCurrency(agent.monthlyCost)}</td>
                    <td><Button variant={agent.enabled ? 'secondary' : 'primary'} onClick={() => onToggleAgent(agent)}>{agent.enabled ? 'Disable' : 'Enable'}</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {selectedAgent ? (
        <Modal title={selectedAgent.name} description={selectedAgent.description} onClose={() => setSelectedAgent(null)} wide>
          <div className="detail-grid">
            <div><span className="eyebrow">Status</span><Badge value={selectedAgent.status} /></div>
            <div><span className="eyebrow">Risk</span><Badge value={selectedAgent.riskLevel} /></div>
            <div><span className="eyebrow">Owner</span><strong>{selectedAgent.owner}</strong></div>
            <div><span className="eyebrow">Active tasks</span><strong>{selectedAgent.activeTasks}</strong></div>
            <div><span className="eyebrow">Monthly cost</span><strong>{formatCurrency(selectedAgent.monthlyCost)}</strong></div>
            <div><span className="eyebrow">Success rate</span><strong>{selectedAgent.successRate}%</strong></div>
          </div>
        </Modal>
      ) : null}

      {confirmBatchEnabled !== null ? (
        <ConfirmDialog
          title={confirmBatchEnabled ? 'Enable agents?' : 'Disable agents?'}
          message={`This will ${confirmBatchEnabled ? 'enable' : 'disable'} ${selectedIds.size} agent${selectedIds.size > 1 ? 's' : ''}.${!confirmBatchEnabled && selectionHasHighRisk ? ' Some selected agents have a high or critical risk level.' : ''}`}
          confirmLabel={confirmBatchEnabled ? 'Enable' : 'Disable'}
          onConfirm={() => {
            onBatchToggleAgents([...selectedIds], confirmBatchEnabled)
            setSelectedIds(new Set())
            setConfirmBatchEnabled(null)
          }}
          onCancel={() => setConfirmBatchEnabled(null)}
        />
      ) : null}
    </div>
  )
}
