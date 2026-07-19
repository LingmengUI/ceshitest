// Page: IncidentsPage.tsx
import { useState } from 'react'
import type { Agent, Incident, ProviderConfig } from '../types'
import { Badge, Button, EmptyState, Modal, Panel, Skeleton } from '../components/ui'

export function IncidentsPage({
  agents,
  incidents,
  loading,
  providers,
  onResolveIncident,
}: {
  agents: Agent[]
  incidents: Incident[]
  loading: boolean
  providers: ProviderConfig[]
  onResolveIncident: (incident: Incident) => void
}) {
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  function agentName(agentId: string) {
    return agents.find((agent) => agent.id === agentId)?.name ?? 'Unknown agent'
  }

  function providerName(providerId: Incident['affectedProvider']) {
    return providers.find((provider) => provider.id === providerId)?.name ?? providerId
  }

  if (loading && incidents.length === 0) return <Skeleton rows={8} />

  return (
    <div className="page-grid incidents-layout editorial-page" data-page="incidents">
      <section className="page-intro panel wide-panel">
        <div>
          <span className="eyebrow">Incident response</span>
          <h2>Handle active issues from a clean queue.</h2>
          <p className="muted">Review severity, ownership, provider impact, and resolution state without a loud command-center layout.</p>
        </div>
        <Badge value="sev2" label={`${incidents.filter((incident) => incident.status !== 'resolved').length} active`} />
      </section>

      <section className="summary-strip wide-panel" aria-label="Incident summary">
        <Panel className="stat-card"><span className="eyebrow">Active</span><strong>{incidents.filter((incident) => incident.status !== 'resolved').length}</strong><span className="stat-delta text-warning">Needs review</span></Panel>
        <Panel className="stat-card"><span className="eyebrow">Sev1</span><strong>{incidents.filter((incident) => incident.severity === 'sev1').length}</strong><span className="stat-delta text-danger">Highest impact</span></Panel>
        <Panel className="stat-card"><span className="eyebrow">Investigating</span><strong>{incidents.filter((incident) => incident.status === 'investigating').length}</strong><span className="stat-delta text-info">In progress</span></Panel>
      </section>

      <Panel className="incident-timeline-panel wide-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Incident response</span>
            <h2>Incident center</h2>
          </div>
          <Badge value="sev2" label={`${incidents.filter((incident) => incident.status !== 'resolved').length} active`} />
        </div>

        {incidents.length === 0 ? (
          <EmptyState title="No incidents reported" message="All monitored AI operations are currently within policy thresholds." />
        ) : (
          <div className="incident-list">
            {incidents.map((incident) => (
              <article className="incident-row" key={incident.id}>
                <div className="incident-main">
                  <Badge value={incident.severity} />
                  <div>
                    <h3>{incident.title}</h3>
                    <p>{incident.summary}</p>
                    <small>{incident.time} · {agentName(incident.affectedAgentId)} · {providerName(incident.affectedProvider)}</small>
                  </div>
                </div>
                <div className="incident-actions">
                  <Badge value={incident.status} />
                  <Button onClick={() => setSelectedIncident(incident)}>View details</Button>
                  {incident.status !== 'resolved' ? <Button variant="primary" onClick={() => onResolveIncident(incident)}>Mark resolved</Button> : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>

      {selectedIncident ? (
        <Modal
          title={selectedIncident.title}
          description={selectedIncident.summary}
          onClose={() => setSelectedIncident(null)}
          footer={
            selectedIncident.status !== 'resolved' ? (
              <Button variant="primary" onClick={() => { onResolveIncident(selectedIncident); setSelectedIncident(null) }}>Mark resolved</Button>
            ) : null
          }
          wide
        >
          <div className="detail-grid incident-detail">
            <div><span className="eyebrow">Severity</span><Badge value={selectedIncident.severity} /></div>
            <div><span className="eyebrow">Status</span><Badge value={selectedIncident.status} /></div>
            <div><span className="eyebrow">Agent</span><strong>{agentName(selectedIncident.affectedAgentId)}</strong></div>
            <div><span className="eyebrow">Provider</span><strong>{providerName(selectedIncident.affectedProvider)}</strong></div>
          </div>
          <ol className="timeline">
            {selectedIncident.events.map((event) => (
              <li key={event.id}>
                <time>{event.time}</time>
                <div>
                  <strong>{event.title}</strong>
                  <p>{event.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </Modal>
      ) : null}
    </div>
  )
}
