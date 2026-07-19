import type { ReactNode } from 'react'
import type { AgentStatus, IncidentSeverity, RiskLevel, TaskPriority, TaskStatus } from '../types'

type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info'

type BadgeValue = AgentStatus | RiskLevel | TaskPriority | TaskStatus | IncidentSeverity | Tone | string

const badgeClass: Record<string, string> = {
  online: 'success',
  idle: 'neutral',
  degraded: 'warning',
  offline: 'danger',
  low: 'success',
  medium: 'info',
  high: 'warning',
  critical: 'danger',
  urgent: 'danger',
  backlog: 'neutral',
  running: 'info',
  review: 'warning',
  completed: 'success',
  failed: 'danger',
  sev1: 'danger',
  sev2: 'warning',
  sev3: 'info',
  sev4: 'neutral',
  open: 'danger',
  investigating: 'warning',
  mitigated: 'info',
  resolved: 'success',
}

export interface ToastMessage {
  id: string
  tone: Tone
  title: string
  message?: string
}

export function Badge({ value, label }: { value: BadgeValue; label?: string }) {
  return <span className={`badge badge-${badgeClass[value] ?? 'neutral'}`}>{label ?? value}</span>
}

export function Button({
  children,
  variant = 'secondary',
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  return (
    <button className={`btn btn-${variant} ${className}`} type="button" {...props}>
      {children}
    </button>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

export function EmptyState({ title, message, action }: { title: string; message: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">◇</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  )
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton-stack" aria-label="Loading content">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index} />
      ))}
    </div>
  )
}

export function Modal({
  title,
  description,
  children,
  onClose,
  footer,
  wide = false,
}: {
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className={`modal ${wide ? 'modal-wide' : ''}`}
        role="dialog"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-description' : undefined}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {description ? <p id="modal-description">{description}</p> : null}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog">×</button>
        </header>
        <div className="modal-body">{children}</div>
        {footer ? <footer className="modal-footer">{footer}</footer> : null}
      </section>
    </div>
  )
}

export function ToastRegion({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  return (
    <div className="toast-region" aria-live="polite" aria-relevant="additions removals">
      {toasts.map((toast) => (
        <div className={`toast toast-${toast.tone}`} key={toast.id}>
          <div>
            <strong>{toast.title}</strong>
            {toast.message ? <p>{toast.message}</p> : null}
          </div>
          <button className="icon-button" type="button" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">×</button>
        </div>
      ))}
    </div>
  )
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Modal
      title={title}
      description={message}
      onClose={onCancel}
      footer={
        <>
          <Button onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
        </>
      }
    >
      <p className="muted">This action cannot be undone.</p>
    </Modal>
  )
}

export function StatCard({ label, value, delta, tone = 'neutral' }: { label: string; value: string; delta: string; tone?: Tone }) {
  return (
    <Panel className="stat-card">
      <span className="eyebrow">{label}</span>
      <strong>{value}</strong>
      <span className={`stat-delta text-${tone}`}>{delta}</span>
    </Panel>
  )
}
