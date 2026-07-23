import { defaultSettings } from '../data/mockData'
import type {
  Agent,
  AgentFilters,
  AgentSortKey,
  OpsTask,
  ProviderConfig,
  Settings,
  SortDirection,
  TaskStatus,
} from '../types'
import { readJson, writeJson, type StorageLike } from './storage'

export const TASK_STORAGE_KEY = 'ai-ops-command-center:tasks'
export const SETTINGS_STORAGE_KEY = 'ai-ops-command-center:settings'

const TASK_STATUSES: TaskStatus[] = ['backlog', 'running', 'review', 'completed', 'failed']
const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const
const THEMES = ['light', 'dark', 'system'] as const
const PROVIDER_KEYS = ['openai', 'anthropic', 'google', 'deepseek', 'local'] as const

type PersistedSettings = Partial<Omit<Settings, 'notifications'>> & {
  notifications?: Partial<Settings['notifications']>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isOpsTask(value: unknown): value is OpsTask {
  if (!isRecord(value)) return false
  return (
    typeof value.id === 'string' &&
    typeof value.title === 'string' &&
    typeof value.assignedAgentId === 'string' &&
    TASK_PRIORITIES.includes(value.priority as typeof TASK_PRIORITIES[number]) &&
    typeof value.model === 'string' &&
    typeof value.tokenCost === 'number' &&
    Number.isFinite(value.tokenCost) &&
    value.tokenCost >= 0 &&
    typeof value.deadline === 'string' &&
    TASK_STATUSES.includes(value.status as TaskStatus) &&
    typeof value.description === 'string'
  )
}

function isPersistedSettings(value: unknown): value is PersistedSettings {
  if (!isRecord(value)) return false
  if (value.theme !== undefined && !THEMES.includes(value.theme as typeof THEMES[number])) return false
  if (value.compactListDensity !== undefined && typeof value.compactListDensity !== 'boolean') return false
  if (value.costWarningThreshold !== undefined && (
    typeof value.costWarningThreshold !== 'number' ||
    !Number.isFinite(value.costWarningThreshold) ||
    value.costWarningThreshold < 0
  )) return false
  if (value.defaultProvider !== undefined && !PROVIDER_KEYS.includes(value.defaultProvider as typeof PROVIDER_KEYS[number])) return false
  if (value.notifications !== undefined) {
    const notifications = value.notifications
    if (!isRecord(notifications)) return false
    const keys: (keyof Settings['notifications'])[] = [
      'criticalAlerts',
      'weeklyCostDigest',
      'providerDegradation',
      'taskFailures',
    ]
    if (keys.some((key) => notifications[key] !== undefined && typeof notifications[key] !== 'boolean')) {
      return false
    }
  }
  return true
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)
}

export function filterAgents(
  agents: Agent[],
  filters: AgentFilters,
  sortKey: AgentSortKey,
  direction: SortDirection,
): Agent[] {
  const query = filters.query.trim().toLowerCase()

  return [...agents]
    .filter((agent) => {
      const matchesQuery =
        !query ||
        agent.name.toLowerCase().includes(query) ||
        agent.capability.toLowerCase().includes(query) ||
        agent.owner.toLowerCase().includes(query)

      return (
        matchesQuery &&
        (filters.status === 'all' || agent.status === filters.status) &&
        (filters.provider === 'all' || agent.provider === filters.provider) &&
        (filters.capability === 'all' || agent.capability === filters.capability) &&
        (filters.riskLevel === 'all' || agent.riskLevel === filters.riskLevel)
      )
    })
    .sort((a, b) => {
      const aValue = a[sortKey]
      const bValue = b[sortKey]
      const result = typeof aValue === 'number' && typeof bValue === 'number'
        ? aValue - bValue
        : String(aValue).localeCompare(String(bValue))
      return direction === 'asc' ? result : -result
    })
}

export function moveTask(tasks: OpsTask[], taskId: string, status: TaskStatus): OpsTask[] {
  return tasks.map((task) => (task.id === taskId ? { ...task, status } : task))
}

export function upsertTask(tasks: OpsTask[], task: OpsTask): OpsTask[] {
  return tasks.some((item) => item.id === task.id)
    ? tasks.map((item) => (item.id === task.id ? task : item))
    : [task, ...tasks]
}

export function deleteTask(tasks: OpsTask[], taskId: string): OpsTask[] {
  return tasks.filter((task) => task.id !== taskId)
}

export function readPersistedTasks(fallback: OpsTask[], storage?: StorageLike | null): OpsTask[] {
  return readJson(TASK_STORAGE_KEY, fallback, storage, (value): value is OpsTask[] => (
    Array.isArray(value) && value.every(isOpsTask)
  ))
}

export function persistTasks(tasks: OpsTask[], storage?: StorageLike | null): boolean {
  return writeJson(TASK_STORAGE_KEY, tasks, storage)
}

export function readPersistedSettings(storage?: StorageLike | null): Settings {
  const stored = readJson<PersistedSettings>(SETTINGS_STORAGE_KEY, {}, storage, isPersistedSettings)
  return {
    ...defaultSettings,
    ...stored,
    notifications: {
      ...defaultSettings.notifications,
      ...stored.notifications,
    },
  }
}

export function persistSettings(settings: Settings, storage?: StorageLike | null): boolean {
  return writeJson(SETTINGS_STORAGE_KEY, settings, storage)
}

export interface ProviderValidationResult {
  valid: boolean
  errors: Partial<Record<keyof ProviderConfig, string>>
}

export function validateProviderConfig(provider: ProviderConfig): ProviderValidationResult {
  const errors: ProviderValidationResult['errors'] = {}

  if (!provider.name.trim()) errors.name = 'Provider name is required.'
  if (provider.rateLimitPerMinute < 1) errors.rateLimitPerMinute = 'Rate limit must be at least 1 request per minute.'
  if (provider.latencyMs < 1) errors.latencyMs = 'Latency must be greater than 0ms.'
  if (provider.costPerMillionTokens < 0) errors.costPerMillionTokens = 'Cost cannot be negative.'
  if (provider.reliability < 0 || provider.reliability > 100) errors.reliability = 'Reliability must be between 0 and 100.'
  if (!provider.region.trim()) errors.region = 'Region is required.'
  if (!provider.apiKeyAlias.trim()) errors.apiKeyAlias = 'Credential alias is required.'

  return { valid: Object.keys(errors).length === 0, errors }
}
