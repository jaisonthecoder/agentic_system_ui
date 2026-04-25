import { useState, useEffect } from 'react'
import { fetchTasks, createTask } from '../../api'
import type { Task } from '../../types'
import styles from './TasksView.module.scss'

const ICONS: Record<string, string> = {
  autonomous: '🔍', pipeline: '⛓', assistant: '💬', 'event-driven': '⚡', auto: '🤖',
}

const STATUS_MAP: Record<string, { color: string; bg: string; label: string }> = {
  running: { color: 'var(--blue)',   bg: 'var(--blueDim)',   label: '⟳ Running' },
  done:    { color: 'var(--accent)', bg: 'var(--accentDim)', label: '✓ Done'    },
  failed:  { color: 'var(--danger)', bg: 'var(--dangerDim)', label: '✗ Failed'  },
  pending: { color: 'var(--amber)',  bg: 'var(--amberDim)',  label: '⏰ Pending' },
}

interface TasksViewProps {
  onViewTask: (task: Task) => void
}

export default function TasksView({ onViewTask }: TasksViewProps) {
  const [tasks, setTasks]         = useState<Task[]>([])
  const [filter, setFilter]       = useState('all')
  const [loading, setLoading]     = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [goal, setGoal]           = useState('')
  const [agentType, setAgentType] = useState('auto')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try { setTasks(await fetchTasks()) } catch { /* silently fail on poll */ }
    setLoading(false)
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 3_000)
    return () => clearInterval(t)
  }, [])

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)

  const submit = async () => {
    if (!goal.trim()) return
    setSubmitting(true)
    try {
      await createTask({ goal, agentType })
      setGoal('')
      setAgentType('auto')
      setShowModal(false)
      load()
    } catch (e) {
      alert('Error: ' + (e instanceof Error ? e.message : String(e)))
    }
    setSubmitting(false)
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.title}>Tasks</div>
          <div className={styles.desc}>Background jobs running on the Python backend</div>
        </div>
        <button className={styles.btnSecondary} onClick={load}>↻ Refresh</button>
        <button className={styles.btnPrimary} onClick={() => setShowModal(true)}>+ New Task</button>
      </div>

      <div className={styles.body}>
        <div className={styles.filters}>
          {['all', 'running', 'done', 'failed'].map((f) => (
            <button
              key={f}
              className={`${styles.filterBtn}${filter === f ? ` ${styles.active}` : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'all' && ` (${tasks.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>⏳</div>
            <div>Loading…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>✅</div>
            <div>No tasks yet</div>
          </div>
        ) : (
          <div className={styles.list}>
            {filtered.map((t) => {
              const sm = STATUS_MAP[t.status] ?? STATUS_MAP.pending
              return (
                <div key={t.id} className={styles.card} onClick={() => onViewTask(t)}>
                  <div
                    className={styles.cardIcon}
                    style={{ background: sm.bg, color: sm.color }}
                  >
                    {ICONS[t.agent_type ?? 'auto'] ?? '🤖'}
                  </div>
                  <div>
                    <div className={styles.cardGoal}>{t.goal}</div>
                    <div className={styles.cardMeta}>
                      🤖 {t.agent_type ?? 'auto'}&nbsp;·&nbsp;
                      🕐 {t.created_at ?? '—'}
                      {t.session_id && ` · 🔑 ${t.session_id}`}
                    </div>
                  </div>
                  <div
                    className={styles.badge}
                    style={{
                      background: sm.bg,
                      color: sm.color,
                      borderColor: sm.color + '33',
                    }}
                  >
                    {sm.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div
          className={styles.overlay}
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Create New Task"
        >
          <div className={styles.modal}>
            <div className={styles.modalTitle}>Create New Task</div>
            <div className={styles.modalDesc}>
              Describe in plain English. The backend handles everything automatically.
            </div>
            <label className={styles.fieldLabel}>What do you want done?</label>
            <textarea
              className={styles.textarea}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g. Review all open PRs and send a summary to Slack #engineering"
            />
            <label className={styles.fieldLabel}>Agent Type</label>
            <select
              className={styles.select}
              value={agentType}
              onChange={(e) => setAgentType(e.target.value)}
            >
              <option value="auto">🤖 Auto (recommended)</option>
              <option value="autonomous">🚀 Autonomous</option>
              <option value="pipeline">⛓ Pipeline</option>
              <option value="assistant">💬 Assistant</option>
            </select>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setShowModal(false)}>Cancel</button>
              <button
                className={styles.btnPrimary}
                disabled={submitting || !goal.trim()}
                onClick={submit}
              >
                {submitting ? '…' : '▶ Run Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
