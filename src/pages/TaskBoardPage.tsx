// Page: TaskBoardPage.tsx
import { useMemo, useState } from 'react'
import type { Agent, OpsTask, TaskPriority, TaskStatus } from '../types'
import { Badge, Button, EmptyState, Modal, Panel, Skeleton } from '../components/ui'
import { formatCompact } from '../utils/domain'

const columns: Array<{ status: TaskStatus; label: string }> = [
  { status: 'backlog', label: 'Backlog' },
  { status: 'running', label: 'Running' },
  { status: 'review', label: 'Review' },
  { status: 'completed', label: 'Completed' },
  { status: 'failed', label: 'Failed' },
]

const priorities: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

const emptyTask = (agents: Agent[]): OpsTask => ({
  id: `task-${Date.now()}`,
  title: '',
  assignedAgentId: agents[0]?.id ?? '',
  priority: 'medium',
  model: 'gpt-5.1-ops',
  tokenCost: 25000,
  deadline: 'Tomorrow 17:00',
  status: 'backlog',
  description: '',
})

export function TaskBoardPage({
  agents,
  loading,
  tasks,
  onDeleteTask,
  onMoveTask,
  onSaveTask,
}: {
  agents: Agent[]
  loading: boolean
  tasks: OpsTask[]
  onDeleteTask: (task: OpsTask) => void
  onMoveTask: (taskId: string, status: TaskStatus) => void
  onSaveTask: (task: OpsTask) => void
}) {
  const [editingTask, setEditingTask] = useState<OpsTask | null>(null)
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null)
  const [error, setError] = useState('')

  const agentById = useMemo(() => new Map(agents.map((agent) => [agent.id, agent])), [agents])
  const tasksByStatus = useMemo(
    () => columns.map((column) => ({ ...column, tasks: tasks.filter((task) => task.status === column.status) })),
    [tasks],
  )

  function saveTask() {
    if (!editingTask) return
    if (!editingTask.title.trim()) {
      setError('Task title is required.')
      return
    }
    if (!editingTask.assignedAgentId) {
      setError('Assign the task to an agent.')
      return
    }
    if (editingTask.tokenCost < 0) {
      setError('Token cost cannot be negative.')
      return
    }
    onSaveTask({ ...editingTask, title: editingTask.title.trim(), description: editingTask.description.trim() })
    setEditingTask(null)
    setError('')
  }

  if (loading && tasks.length === 0) return <Skeleton rows={8} />

  return (
    <div className="page-grid task-board-layout editorial-page" data-page="task-board">
      <section className="page-intro panel wide-panel">
        <div>
          <span className="eyebrow">Work planning</span>
          <h2>Move tasks through a calmer board.</h2>
          <p className="muted">Plan queued work, see what is running, and keep review or recovery items from getting buried.</p>
        </div>
        <Button variant="primary" onClick={() => setEditingTask(emptyTask(agents))}>Add task</Button>
      </section>

      <section className="summary-strip wide-panel" aria-label="Task summary">
        <Panel className="stat-card"><span className="eyebrow">Total tasks</span><strong>{tasks.length}</strong><span className="stat-delta text-neutral">Across all lanes</span></Panel>
        <Panel className="stat-card"><span className="eyebrow">Running</span><strong>{tasks.filter((task) => task.status === 'running').length}</strong><span className="stat-delta text-info">In progress</span></Panel>
        <Panel className="stat-card"><span className="eyebrow">Urgent</span><strong>{tasks.filter((task) => task.priority === 'urgent').length}</strong><span className="stat-delta text-warning">Needs focus</span></Panel>
      </section>

      <Panel className="kanban-panel wide-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">Kanban operations</span>
            <h2>Task board</h2>
          </div>
          <Badge value="running" label={String(tasks.filter((task) => task.status === 'running').length) + ' running'} />
        </div>

        {tasks.length === 0 ? (
          <EmptyState title="No tasks queued" message="Create a task to start routing work to an AI agent." action={<Button variant="primary" onClick={() => setEditingTask(emptyTask(agents))}>Create task</Button>} />
        ) : (
          <div className="kanban" aria-label="Task status board">
            {tasksByStatus.map((column) => (
              <section
                className={`kanban-column ${dragOverStatus === column.status ? 'drag-over' : ''}`}
                key={column.status}
                onDragEnter={() => setDragOverStatus(column.status)}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragOverStatus(null)
                }}
                onDrop={() => {
                  if (draggedTaskId) onMoveTask(draggedTaskId, column.status)
                  setDraggedTaskId(null)
                  setDragOverStatus(null)
                }}
              >
                <header>
                  <h3>{column.label}</h3>
                  <Badge value={column.status} label={String(column.tasks.length)} />
                </header>
                <div className="task-stack">
                  {column.tasks.length === 0 ? <p className="empty-column">Drop tasks here</p> : null}
                  {column.tasks.map((task) => (
                    <article
                      className={`task-card ${draggedTaskId === task.id ? 'is-dragging' : ''}`}
                      draggable
                      key={task.id}
                      onDragStart={() => setDraggedTaskId(task.id)}
                      onDragEnd={() => {
                        setDraggedTaskId(null)
                        setDragOverStatus(null)
                      }}
                    >
                      <div className="task-card-header">
                        <Badge value={task.priority} />
                        <Badge value={task.status} />
                      </div>
                      <h4>{task.title}</h4>
                      <p>{task.description}</p>
                      <dl>
                        <div><dt>Agent</dt><dd>{agentById.get(task.assignedAgentId)?.name ?? 'Unassigned'}</dd></div>
                        <div><dt>Model</dt><dd>{task.model}</dd></div>
                        <div><dt>Cost</dt><dd>{formatCompact(task.tokenCost)} tokens</dd></div>
                        <div><dt>Due</dt><dd>{task.deadline}</dd></div>
                      </dl>
                      <div className="card-actions">
                        <Button variant="ghost" onClick={() => setEditingTask(task)}>Edit</Button>
                        <Button variant="danger" onClick={() => onDeleteTask(task)}>Delete</Button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </Panel>

      {editingTask ? (
        <Modal
          title={tasks.some((task) => task.id === editingTask.id) ? 'Edit task' : 'Add task'}
          description="Configure routing, cost, deadline, and current workflow status."
          onClose={() => setEditingTask(null)}
          footer={<><Button onClick={() => setEditingTask(null)}>Cancel</Button><Button variant="primary" onClick={saveTask}>Save task</Button></>}
        >
          <div className="form-grid">
            <label className="full"><span>Title</span><input value={editingTask.title} onChange={(event) => setEditingTask({ ...editingTask, title: event.target.value })} /></label>
            <label><span>Agent</span><select value={editingTask.assignedAgentId} onChange={(event) => setEditingTask({ ...editingTask, assignedAgentId: event.target.value })}>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select></label>
            <label><span>Priority</span><select value={editingTask.priority} onChange={(event) => setEditingTask({ ...editingTask, priority: event.target.value as TaskPriority })}>{priorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}</select></label>
            <label><span>Status</span><select value={editingTask.status} onChange={(event) => setEditingTask({ ...editingTask, status: event.target.value as TaskStatus })}>{columns.map((column) => <option key={column.status} value={column.status}>{column.label}</option>)}</select></label>
            <label><span>Model</span><input value={editingTask.model} onChange={(event) => setEditingTask({ ...editingTask, model: event.target.value })} /></label>
            <label><span>Token cost</span><input type="number" min="0" value={editingTask.tokenCost} onChange={(event) => setEditingTask({ ...editingTask, tokenCost: Number(event.target.value) })} /></label>
            <label><span>Deadline</span><input value={editingTask.deadline} onChange={(event) => setEditingTask({ ...editingTask, deadline: event.target.value })} /></label>
            <label className="full"><span>Description</span><textarea value={editingTask.description} onChange={(event) => setEditingTask({ ...editingTask, description: event.target.value })} /></label>
          </div>
          {error ? <p className="form-error" role="alert">{error}</p> : null}
        </Modal>
      ) : null}
    </div>
  )
}
