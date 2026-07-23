import { describe, expect, it } from 'vitest'
import { agents, defaultSettings, providers, tasks } from '../data/mockData'
import type { StorageLike } from './storage'
import {
  filterAgents,
  moveTask,
  persistSettings,
  readPersistedSettings,
  validateProviderConfig,
} from './domain'

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { values: Record<string, string> } {
  const values = { ...initial }

  return {
    values,
    getItem: (key) => values[key] ?? null,
    setItem: (key, value) => {
      values[key] = value
    },
    removeItem: (key) => {
      delete values[key]
    },
  }
}

describe('domain utilities', () => {
  it('filters agents by status, provider, capability, risk, and search query', () => {
    const [agent] = filterAgents(
      agents,
      {
        status: 'online',
        provider: 'openai',
        capability: 'Support automation',
        riskLevel: 'high',
        query: 'orbit',
      },
      'name',
      'asc',
    )

    expect(agent.name).toBe('Orbit Customer Copilot')
  })

  it('moves a task to a different kanban status without mutating other tasks', () => {
    const moved = moveTask(tasks, 'task-1003', 'running')

    expect(moved.find((task) => task.id === 'task-1003')?.status).toBe('running')
    expect(moved.find((task) => task.id === 'task-1004')?.status).toBe('completed')
    expect(tasks.find((task) => task.id === 'task-1003')?.status).toBe('backlog')
  })

  it('persists settings and merges missing notification keys with defaults', () => {
    const storage = memoryStorage()
    const settings = {
      ...defaultSettings,
      theme: 'dark' as const,
      compactListDensity: true,
      notifications: {
        ...defaultSettings.notifications,
        taskFailures: false,
      },
    }

    expect(persistSettings(settings, storage)).toBe(true)
    const restored = readPersistedSettings(storage)

    expect(restored.theme).toBe('dark')
    expect(restored.compactListDensity).toBe(true)
    expect(restored.notifications.taskFailures).toBe(false)
    expect(restored.notifications.providerDegradation).toBe(true)
  })

  it('validates provider configuration before simulated saves', () => {
    const invalidProvider = {
      ...providers[0],
      name: '',
      rateLimitPerMinute: 0,
      costPerMillionTokens: -1,
      reliability: 110,
      region: '',
      apiKeyAlias: '',
    }

    const result = validateProviderConfig(invalidProvider)

    expect(result.valid).toBe(false)
    expect(result.errors.name).toBeDefined()
    expect(result.errors.rateLimitPerMinute).toBeDefined()
    expect(result.errors.costPerMillionTokens).toBeDefined()
    expect(result.errors.reliability).toBeDefined()
    expect(result.errors.region).toBeDefined()
    expect(result.errors.apiKeyAlias).toBeDefined()
  })
})
