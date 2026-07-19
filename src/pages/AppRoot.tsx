// Page: AppRoot.tsx
import { useCallback, useEffect, useMemo, useState } from 'react'
import { mockApi } from '../api/mockApi'
import { tasks as fallbackTasks } from '../data/mockData'
import type { PageKey } from '../components/Shell'
import { Shell } from '../components/Shell'
import { ConfirmDialog, ToastRegion, type ToastMessage } from '../components/ui'
import { useTheme } from '../hooks/useTheme'
import { AgentsPage } from './AgentsPage'
import { DashboardPage } from './DashboardPage'
import { IncidentsPage } from './IncidentsPage'
import { ProvidersPage } from './ProvidersPage'
import { SettingsPage } from './SettingsPage'
import { TaskBoardPage } from './TaskBoardPage'
import type { Agent, DashboardMetrics, Incident, OpsTask, ProviderConfig, Settings, TaskStatus } from '../types'
import {
  deleteTask,
  moveTask,
  persistSettings,
  persistTasks,
  readPersistedSettings,
  readPersistedTasks,
  upsertTask,
} from '../utils/domain'

interface ConfirmState {
  title: string
  message: string
  confirmLabel: string
  onConfirm: () => void
}

function toastId() {
  return `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function AppRoot() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')
  const [globalSearch, setGlobalSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [dashboard, setDashboard] = useState<DashboardMetrics | null>(null)
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<OpsTask[]>(() => readPersistedTasks(fallbackTasks))
  const [providers, setProviders] = useState<ProviderConfig[]>([])
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [settings, setSettings] = useState<Settings>(() => readPersistedSettings())
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [confirm, setConfirm] = useState<ConfirmState | null>(null)
  const [pendingAgentIds, setPendingAgentIds] = useState<Set<string>>(() => new Set())

  useTheme(settings.theme)

  const pushToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const nextToast = { ...toast, id: toastId() }
    setToasts((current) => [nextToast, ...current].slice(0, 4))
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== nextToast.id))
    }, 5200)
  }, [])

  useEffect(() => {
    let mounted = true

    async function load() {
      setLoading(true)
      const [dashboardResult, agentResult, taskResult, providerResult, incidentResult] = await Promise.allSettled([
        mockApi.dashboard(),
        mockApi.agents(),
        mockApi.tasks(),
        mockApi.providers(),
        mockApi.incidents(),
      ])

      if (!mounted) return

      if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value)
      if (agentResult.status === 'fulfilled') setAgents(agentResult.value)
      if (taskResult.status === 'fulfilled') {
        setTasks((current) => readPersistedTasks(current))
      }
      if (providerResult.status === 'fulfilled') setProviders(providerResult.value)
      if (incidentResult.status === 'fulfilled') setIncidents(incidentResult.value)

      const failures = [dashboardResult, agentResult, taskResult, providerResult, incidentResult].filter(
        (result) => result.status === 'rejected',
      ).length
      if (failures) {
        pushToast({
          tone: 'warning',
          title: 'Some telemetry failed to load',
          message: 'The mock API intentionally fails occasionally to exercise error states.',
        })
      }
      setLoading(false)
    }

    void load()
    return () => {
      mounted = false
    }
  }, [pushToast])

  useEffect(() => {
    void persistTasks(tasks)
  }, [tasks])

  const notificationCount = useMemo(
    () => incidents.filter((incident) => incident.status !== 'resolved' && ['sev1', 'sev2'].includes(incident.severity)).length,
    [incidents],
  )

  const visibleTasks = useMemo(() => {
    const query = globalSearch.trim().toLowerCase()
    if (!query || activePage !== 'tasks') return tasks
    return tasks.filter((task) => `${task.title} ${task.description} ${task.model}`.toLowerCase().includes(query))
  }, [activePage, globalSearch, tasks])

  function saveTask(task: OpsTask) {
    setTasks((current) => upsertTask(current, task))
    pushToast({ tone: 'success', title: 'Task saved', message: `${task.title} is now on the board.` })
  }

  function requestDeleteTask(task: OpsTask) {
    setConfirm({
      title: 'Delete task?',
      message: `Remove “${task.title}” from the operations board.`,
      confirmLabel: 'Delete task',
      onConfirm: () => {
        setTasks((current) => deleteTask(current, task.id))
        setConfirm(null)
        pushToast({ tone: 'success', title: 'Task deleted' })
      },
    })
  }

  function moveTaskToStatus(taskId: string, status: TaskStatus) {
    setTasks((current) => moveTask(current, taskId, status))
    pushToast({ tone: 'info', title: 'Task moved', message: `Status changed to ${status}.` })
  }

  async function batchToggleAgents(ids: string[], enabled: boolean) {
    const uniqueIds = ids.filter((id) => !pendingAgentIds.has(id))
    if (!uniqueIds.length) return

    setPendingAgentIds((current) => new Set([...current, ...uniqueIds]))
    try {
      const updatedAgents = await mockApi.batchToggleAgents(uniqueIds, enabled)
      setAgents((current) => {
        const updates = new Map(updatedAgents.map((agent) => [agent.id, agent]))
        return current.map((agent) => updates.get(agent.id) ?? agent)
      })
      pushToast({ tone: 'success', title: enabled ? 'Agents enabled' : 'Agents disabled', message: `${uniqueIds.length} agent${uniqueIds.length > 1 ? 's' : ''} updated.` })
    } catch (error) {
      pushToast({ tone: 'danger', title: 'Batch update failed', message: error instanceof Error ? error.message : 'Unexpected mock API failure.' })
    } finally {
      setPendingAgentIds((current) => {
        const next = new Set(current)
        uniqueIds.forEach((id) => next.delete(id))
        return next
      })
    }
  }

  async function toggleAgent(agent: Agent) {
    if (pendingAgentIds.has(agent.id)) return

    const nextEnabled = !agent.enabled
    setPendingAgentIds((current) => new Set(current).add(agent.id))
    try {
      const updatedAgent = await mockApi.toggleAgent(agent.id, nextEnabled)
      if (!updatedAgent) throw new Error('Agent was not returned by mock API.')
      setAgents((current) => current.map((item) => (item.id === agent.id ? updatedAgent : item)))
      pushToast({ tone: 'success', title: nextEnabled ? 'Agent enabled' : 'Agent disabled', message: agent.name })
    } catch (error) {
      pushToast({ tone: 'danger', title: 'Agent update failed', message: error instanceof Error ? error.message : 'Unexpected mock API failure.' })
    } finally {
      setPendingAgentIds((current) => {
        const next = new Set(current)
        next.delete(agent.id)
        return next
      })
    }
  }

  async function saveProvider(provider: ProviderConfig) {
    try {
      const savedProvider = await mockApi.saveProvider(provider)
      if (!savedProvider) throw new Error('Provider was not returned by mock API.')
      setProviders((current) => current.map((item) => (item.id === provider.id ? savedProvider : item)))
      pushToast({ tone: 'success', title: 'Provider saved', message: `${provider.name} configuration updated.` })
      return true
    } catch (error) {
      pushToast({ tone: 'danger', title: 'Provider save failed', message: error instanceof Error ? error.message : 'Unexpected mock API failure.' })
      return false
    }
  }

  function requestResolveIncident(incident: Incident) {
    setConfirm({
      title: 'Resolve incident?',
      message: `Mark “${incident.title}” as resolved after verifying mitigation is complete.`,
      confirmLabel: 'Resolve incident',
      onConfirm: async () => {
        setConfirm(null)
        try {
          const resolved = await mockApi.resolveIncident(incident.id)
          if (!resolved) throw new Error('Incident was not returned by mock API.')
          setIncidents((current) => current.map((item) => (item.id === incident.id ? resolved : item)))
          pushToast({ tone: 'success', title: 'Incident resolved', message: incident.title })
        } catch (error) {
          pushToast({ tone: 'danger', title: 'Resolution failed', message: error instanceof Error ? error.message : 'Unexpected mock API failure.' })
        }
      },
    })
  }

  function saveSettings(nextSettings: Settings) {
    setSettings(nextSettings)
    const persisted = persistSettings(nextSettings)
    pushToast({
      tone: persisted ? 'success' : 'warning',
      title: persisted ? 'Settings saved' : 'Settings applied for this session only',
      message: persisted ? 'Preferences were written to localStorage.' : 'localStorage is unavailable.',
    })
  }

  function navigate(page: PageKey) {
    setActivePage(page)
    setMobileOpen(false)
  }

  return (
    <>
      <Shell
        activePage={activePage}
        globalSearch={globalSearch}
        mobileOpen={mobileOpen}
        notificationCount={notificationCount}
        theme={settings.theme}
        onNavigate={navigate}
        onSearch={setGlobalSearch}
        onThemeChange={(theme) => saveSettings({ ...settings, theme })}
        onToggleMobile={() => setMobileOpen((open) => !open)}
      >
        {activePage === 'dashboard' ? (
          <DashboardPage agents={agents} dashboard={dashboard} incidents={incidents} loading={loading} providers={providers} tasks={tasks} />
        ) : null}
        {activePage === 'agents' ? <AgentsPage agents={agents} loading={loading} providers={providers} onToggleAgent={toggleAgent} onBatchToggleAgents={batchToggleAgents} /> : null}
        {activePage === 'tasks' ? (
          <TaskBoardPage agents={agents} loading={loading} tasks={visibleTasks} onDeleteTask={requestDeleteTask} onMoveTask={moveTaskToStatus} onSaveTask={saveTask} />
        ) : null}
        {activePage === 'providers' ? <ProvidersPage loading={loading} providers={providers} onSaveProvider={saveProvider} /> : null}
        {activePage === 'incidents' ? (
          <IncidentsPage agents={agents} incidents={incidents} loading={loading} providers={providers} onResolveIncident={requestResolveIncident} />
        ) : null}
        {activePage === 'settings' ? <SettingsPage providers={providers} settings={settings} onSaveSettings={saveSettings} /> : null}
      </Shell>
      <ToastRegion toasts={toasts} onDismiss={(id) => setToasts((current) => current.filter((toast) => toast.id !== id))} />
      {confirm ? <ConfirmDialog title={confirm.title} message={confirm.message} confirmLabel={confirm.confirmLabel} onCancel={() => setConfirm(null)} onConfirm={confirm.onConfirm} /> : null}
    </>
  )
}
