// Page: DashboardPage.tsx
import type { Agent, AgentStatus, DashboardMetrics, Incident, OpsTask, ProviderConfig, RiskLevel } from '../types'
import { formatCurrency } from '../utils/domain'
import { Badge, EmptyState, Panel, Skeleton, StatCard } from '../components/ui'

const agentStatuses: AgentStatus[] = ['online', 'idle', 'degraded', 'offline']

const statusLabels: Record<AgentStatus, string> = {
  online: '在线 / Online',
  idle: '空闲 / Idle',
  degraded: '性能下降 / Degraded',
  offline: '离线 / Offline',
}

const attentionStatusRank: Record<AgentStatus, number> = {
  offline: 0,
  degraded: 1,
  online: 2,
  idle: 3,
}

const riskRank: Record<RiskLevel, number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
}

export function DashboardPage({
  agents,
  dashboard,
  incidents,
  loading,
  providers,
  tasks,
}: {
  agents: Agent[]
  dashboard: DashboardMetrics | null
  incidents: Incident[]
  loading: boolean
  providers: ProviderConfig[]
  tasks: OpsTask[]
}) {
  if (loading && !dashboard) return <Skeleton rows={8} />

  if (!dashboard) {
    return <EmptyState title="遥测不可用 / Telemetry unavailable" message="无法加载团队健康数据，请刷新页面重试。 / Workforce health data could not be loaded. Refresh the page to retry." />
  }

  const statusCounts = agentStatuses.reduce<Record<AgentStatus, number>>(
    (counts, status) => ({ ...counts, [status]: agents.filter((agent) => agent.status === status).length }),
    { online: 0, idle: 0, degraded: 0, offline: 0 },
  )
  const attentionAgents = agents
    .filter((agent) => ['degraded', 'offline'].includes(agent.status) || ['high', 'critical'].includes(agent.riskLevel))
    .sort((left, right) => (
      attentionStatusRank[left.status] - attentionStatusRank[right.status]
      || riskRank[left.riskLevel] - riskRank[right.riskLevel]
      || left.name.localeCompare(right.name)
    ))
  const enabledProviders = providers.filter((provider) => provider.enabled)
  const workloadAgents = agents
    .filter((agent) => agent.enabled)
    .sort((left, right) => right.activeTasks - left.activeTasks || left.name.localeCompare(right.name))
  const maxWorkload = Math.max(...workloadAgents.map((agent) => agent.activeTasks), 1)
  const providerNames = new Map(providers.map((provider) => [provider.id, provider.name]))
  const urgentRunningTasks = tasks.filter((task) => task.status === 'running' && task.priority === 'urgent').length
  const openIncidents = incidents.filter((incident) => incident.status !== 'resolved').length

  return (
    <div className="page-grid dashboard-grid dashboard-health editorial-page" data-page="dashboard">
      <section className="page-intro panel wide-panel">
        <div>
          <span className="eyebrow">团队状态 / Workforce status</span>
          <h2>AI 团队健康 / AI Workforce Health</h2>
          <p className="muted">集中查看 Agent 状态、产能、质量与模型表现。 / A focused view of Agent health, output, quality, and model performance.</p>
        </div>
        <Badge value="running" label="实时遥测 / Live telemetry" />
      </section>

      <section className="summary-strip wide-panel" aria-label="AI 团队健康摘要 / AI workforce health summary">
        <StatCard label="活跃 Agent / Active agents" value={String(dashboard.activeAgents)} delta={`${statusCounts.online} 在线 / online`} tone={statusCounts.degraded || statusCounts.offline ? 'warning' : 'success'} />
        <StatCard label="团队成功率 / Team success rate" value={`${dashboard.successRate}%`} delta={`${attentionAgents.length} 个需关注 / need attention`} tone={dashboard.successRate >= 97 ? 'success' : 'warning'} />
        <StatCard label="运行中任务 / Running tasks" value={String(dashboard.runningTasks)} delta={`${urgentRunningTasks} 个紧急 / urgent`} tone={urgentRunningTasks ? 'warning' : 'info'} />
        <StatCard label="月度成本 / Monthly cost" value={formatCurrency(dashboard.monthlyCost)} delta={`${openIncidents} 个未解决事件 / open incidents`} tone={openIncidents ? 'warning' : 'neutral'} />
      </section>

      <div className="content-columns wide-panel">
        <div className="primary-column">
          <Panel className="team-health-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">状态分布 / Status distribution</span>
                <h2>团队健康 / Team health</h2>
              </div>
              <span className="panel-total">{agents.length} Agents</span>
            </div>
            {agents.length ? (
              <div className="health-distribution">
                {agentStatuses.map((status) => (
                  <div className="health-row" key={status}>
                    <div className="health-label">
                      <span className={`status-dot status-${status}`} />
                      <strong>{statusLabels[status]}</strong>
                    </div>
                    <div className="progress-track" aria-label={`${statusLabels[status]} ${statusCounts[status]}`}>
                      <span className={`status-fill status-${status}`} style={{ width: `${(statusCounts[status] / agents.length) * 100}%` }} />
                    </div>
                    <b>{statusCounts[status]}</b>
                  </div>
                ))}
              </div>
            ) : (
              <p className="health-empty">暂无 Agent 数据 / No Agent data available.</p>
            )}
          </Panel>

          <Panel className="attention-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">运营关注 / Operational focus</span>
                <h2>需要关注 / Needs attention</h2>
              </div>
              <span className="panel-total">{attentionAgents.length}</span>
            </div>
            {attentionAgents.length ? (
              <div className="attention-list">
                {attentionAgents.map((agent) => (
                  <article className={`attention-row attention-${agent.status}`} key={agent.id}>
                    <div className="attention-identity">
                      <div>
                        <strong>{agent.name}</strong>
                        <span>{agent.owner}</span>
                      </div>
                      <Badge value={agent.status} label={statusLabels[agent.status]} />
                    </div>
                    <dl className="attention-metrics">
                      <div><dt>模型 / Provider</dt><dd>{providerNames.get(agent.provider) ?? agent.provider}</dd></div>
                      <div><dt>成功率 / Success</dt><dd>{agent.successRate}%</dd></div>
                      <div><dt>任务 / Tasks</dt><dd>{agent.activeTasks}</dd></div>
                      <div><dt>心跳 / Heartbeat</dt><dd>{agent.lastHeartbeat}</dd></div>
                    </dl>
                  </article>
                ))}
              </div>
            ) : (
              <p className="health-empty">所有 Agent 状态健康 / All Agents are operating normally.</p>
            )}
          </Panel>
        </div>

        <aside className="secondary-column">
          <Panel className="model-health-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">路由质量 / Routing quality</span>
                <h2>模型表现 / Model performance</h2>
              </div>
            </div>
            {enabledProviders.length ? (
              <div className="model-health-list">
                {enabledProviders.map((provider) => (
                  <div className="model-health-row" key={provider.id}>
                    <div className="comparison-heading">
                      <strong>{provider.name}</strong>
                      <b>{provider.reliability}%</b>
                    </div>
                    <div className="progress-track" aria-label={`${provider.name} ${provider.reliability}% reliability`}>
                      <span style={{ width: `${provider.reliability}%` }} />
                    </div>
                    <span className="comparison-meta">可靠性 / Reliability · {provider.latencyMs}ms p95 · ${provider.costPerMillionTokens.toFixed(2)} / 1M tokens</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="health-empty">暂无启用的模型服务 / No enabled model providers.</p>
            )}
          </Panel>

          <Panel className="workload-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">活跃产能 / Active capacity</span>
                <h2>工作负载 / Workload</h2>
              </div>
            </div>
            {workloadAgents.length ? (
              <div className="workload-list">
                {workloadAgents.map((agent) => (
                  <div className="workload-row" key={agent.id}>
                    <div className="comparison-heading">
                      <div>
                        <strong>{agent.name}</strong>
                        <span>{statusLabels[agent.status]}</span>
                      </div>
                      <b>{agent.activeTasks}</b>
                    </div>
                    <div className="progress-track" aria-label={`${agent.name} ${agent.activeTasks} active tasks`}>
                      <span className={`status-fill status-${agent.status}`} style={{ width: `${(agent.activeTasks / maxWorkload) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="health-empty">暂无启用的 Agent / No enabled Agents.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  )
}
