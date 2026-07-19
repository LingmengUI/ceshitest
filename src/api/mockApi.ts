import { agents, dashboardMetrics, incidents, providers, tasks } from '../data/mockData'
import type { Agent, DashboardMetrics, Incident, OpsTask, ProviderConfig } from '../types'

const NETWORK_LATENCY = [350, 900]
const FAILURE_RATE = 0.08

function clone<T>(value: T): T {
  return structuredClone(value)
}

function delay() {
  const [min, max] = NETWORK_LATENCY
  const duration = Math.floor(Math.random() * (max - min + 1)) + min
  return new Promise((resolve) => window.setTimeout(resolve, duration))
}

async function simulateNetwork(failureMessage: string): Promise<void> {
  await delay()
  if (Math.random() < FAILURE_RATE) {
    throw new Error(failureMessage)
  }
}

async function withNetwork<T>(value: T, failureMessage = 'Mock API request failed. Please retry.'): Promise<T> {
  await simulateNetwork(failureMessage)
  return clone(value)
}

let mutationQueue = Promise.resolve()

function mutateWithNetwork<T>(mutation: () => T, failureMessage: string): Promise<T> {
  const request = mutationQueue.then(async () => {
    await simulateNetwork(failureMessage)
    return clone(mutation())
  })
  mutationQueue = request.then(() => undefined, () => undefined)
  return request
}

let agentState = clone(agents)
let providerState = clone(providers)
let incidentState = clone(incidents)

export const mockApi = {
  dashboard: () => withNetwork<DashboardMetrics>(dashboardMetrics, 'Unable to load dashboard telemetry.'),
  agents: () => withNetwork<Agent[]>(agentState, 'Unable to load agents.'),
  tasks: () => withNetwork<OpsTask[]>(tasks, 'Unable to load tasks.'),
  providers: () => withNetwork<ProviderConfig[]>(providerState, 'Unable to load providers.'),
  incidents: () => withNetwork<Incident[]>(incidentState, 'Unable to load incidents.'),

  batchToggleAgents(ids: string[], enabled: boolean) {
    return mutateWithNetwork(() => {
      agentState = agentState.map((agent) =>
        ids.includes(agent.id)
          ? { ...agent, enabled, status: enabled && agent.status === 'offline' ? 'idle' : agent.status }
          : agent,
      )
      return agentState.filter((agent) => ids.includes(agent.id))
    }, 'Unable to batch update agents.')
  },

  toggleAgent(agentId: string, enabled: boolean) {
    return mutateWithNetwork(() => {
      agentState = agentState.map((agent) =>
        agent.id === agentId
          ? { ...agent, enabled, status: enabled && agent.status === 'offline' ? 'idle' : agent.status }
          : agent,
      )
      return agentState.find((agent) => agent.id === agentId)
    }, 'Unable to update agent status.')
  },

  saveProvider(provider: ProviderConfig) {
    return mutateWithNetwork(() => {
      providerState = providerState.map((item) => (item.id === provider.id ? provider : item))
      return provider
    }, 'Unable to save provider configuration.')
  },

  resolveIncident(incidentId: string) {
    return mutateWithNetwork(() => {
      incidentState = incidentState.map((incident) =>
        incident.id === incidentId && incident.status !== 'resolved'
          ? {
              ...incident,
              status: 'resolved',
              events: [
                ...incident.events,
                {
                  id: `${incident.id}-resolved`,
                  time: 'Just now',
                  title: 'Resolved',
                  description: 'Incident was marked resolved by the command center operator.',
                },
              ],
            }
          : incident,
      )
      return incidentState.find((incident) => incident.id === incidentId)
    }, 'Unable to resolve incident.')
  },
}
