export type ThemePreference = 'light' | 'dark' | 'system'
export type AgentStatus = 'online' | 'idle' | 'degraded' | 'offline'
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'
export type TaskStatus = 'backlog' | 'running' | 'review' | 'completed' | 'failed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'
export type ProviderKey = 'openai' | 'anthropic' | 'google' | 'deepseek' | 'local'
export type IncidentSeverity = 'sev1' | 'sev2' | 'sev3' | 'sev4'
export type IncidentStatus = 'open' | 'investigating' | 'mitigated' | 'resolved'

export interface Agent {
  id: string
  name: string
  status: AgentStatus
  provider: ProviderKey
  capability: string
  riskLevel: RiskLevel
  owner: string
  successRate: number
  activeTasks: number
  monthlyCost: number
  lastHeartbeat: string
  enabled: boolean
  description: string
}

export interface OpsTask {
  id: string
  title: string
  assignedAgentId: string
  priority: TaskPriority
  model: string
  tokenCost: number
  deadline: string
  status: TaskStatus
  description: string
}

export interface ProviderConfig {
  id: ProviderKey
  name: string
  enabled: boolean
  rateLimitPerMinute: number
  latencyMs: number
  costPerMillionTokens: number
  reliability: number
  region: string
  apiKeyAlias: string
  notes: string
}

export interface IncidentEvent {
  id: string
  time: string
  title: string
  description: string
}

export interface Incident {
  id: string
  title: string
  severity: IncidentSeverity
  affectedAgentId: string
  affectedProvider: ProviderKey
  time: string
  status: IncidentStatus
  summary: string
  events: IncidentEvent[]
}

export interface Settings {
  theme: ThemePreference
  compactListDensity: boolean
  costWarningThreshold: number
  defaultProvider: ProviderKey
  notifications: {
    criticalAlerts: boolean
    weeklyCostDigest: boolean
    providerDegradation: boolean
    taskFailures: boolean
  }
}

export interface ActivityItem {
  id: string
  time: string
  actor: string
  action: string
  tone: 'neutral' | 'success' | 'warning' | 'danger'
}

export interface AlertItem {
  id: string
  title: string
  severity: IncidentSeverity
  message: string
  time: string
}

export interface ChartPoint {
  label: string
  value: number
}

export interface DashboardMetrics {
  activeAgents: number
  runningTasks: number
  successRate: number
  monthlyCost: number
  incidents: number
  taskVolume: ChartPoint[]
  modelCosts: ChartPoint[]
  errorTrend: ChartPoint[]
  recentActivity: ActivityItem[]
  alerts: AlertItem[]
}

export interface AgentFilters {
  status: 'all' | AgentStatus
  provider: 'all' | ProviderKey
  capability: 'all' | string
  riskLevel: 'all' | RiskLevel
  query: string
}

export type AgentSortKey = 'name' | 'status' | 'provider' | 'riskLevel' | 'successRate' | 'monthlyCost'
export type SortDirection = 'asc' | 'desc'
