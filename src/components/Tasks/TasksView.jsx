import { useState, useEffect } from 'react'
import { fetchTasks, createTask } from '../../api'

const ICONS = { autonomous: '🔍', pipeline: '⛓', assistant: '💬', 'event-driven': '⚡', auto: '🤖' }
const STATUS_COLOR = { running: 'var(--blue)', done: 'var(--accent)', failed: 'var(--red)', pending: 'var(--amber)' }
const STATUS_BG    = { running: 'var(--blue-dim)', done: 'var(--accent-dim)', failed: 'var(--red-dim)', pending: 'var(--amber-dim)' }
const STATUS_LABEL = { running: '⟳ Running', done: '✓ Done', failed: '✗ Failed', pending: '⏰ Pending' }

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
  hdr: {
    padding: '22px 28px 18px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
  },
  title: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  desc: { fontSize: 12, color: 'var(--muted2)', marginTop: 2 },
  btnP: { padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'var(--accent)', color: '#000', border: 'none' },
  btnS: { padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'var(--panel2)', color: 'var(--text)', border: '1px solid var(--border2)' },
  body: { padding: '20px 28px', overflowY: 'auto', flex: 1 },
  filters: { display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  fBtn: (active) => ({
    padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--muted2)',
    cursor: 'pointer', transition: 'all .15s',
  }),
  list: { display: 'flex', flexDirection: 'column', gap: 8 },
  card: {
    background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12,
    padding: '14px 18px', display: 'grid', gridTemplateColumns: 'auto 1fr auto',
    gap: 14, alignItems: 'center', cursor: 'pointer', transition: 'all .15s',
  },
  icon: (status) => ({
    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
    background: STATUS_BG[status] || 'var(--panel2)',
    color: STATUS_COLOR[status] || 'var(--muted2)',
  }),
  goal: { fontSize: 14, fontWeight: 700, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  meta: { fontSize: 11, color: 'var(--muted2)' },
  badge: (status) => ({
    padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
    background: STATUS_BG[status] || 'var(--panel2)',
    color: STATUS_COLOR[status] || 'var(--muted2)',
    border: `1px solid ${STATUS_COLOR[status] || 'var(--border2)'}33`,
  }),
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: 'var(--muted)' },
  // Modal
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal: { background: 'var(--panel)', border: '1px solid var(--border2)', borderRadius: 18, padding: 28, maxWidth: 480, width: '90%', animation: 'slideUp .22s ease' },
  label: { fontSize: 12, fontWeight: 700, marginBottom: 5, display: 'block' },
  ta: { width: '100%', background: 'var(--panel2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'vertical', minHeight: 70 },
  sel: { width: '100%', background: 'var(--panel2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none' },
  mfooter: { display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 },
}

export default function TasksView({ onViewTask }) {
  const [tasks, setTasks] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [goal, setGoal] = useState('')
  const [agentType, setAgentType] = useState('auto')
  const [submitting, setSubmitting] = useState(false)

  const load = async () => {
    try { setTasks(await fetchTasks()) } catch {}
    setLoading(false)
  }

  useEffect(() => { load(); const t = setInterval(load, 3000); return () => clearInterval(t) }, [])

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)

  const submit = async () => {
    if (!goal.trim()) return
    setSubmitting(true)
    try { await createTask({ goal, agentType }); setGoal(''); setAgentType('auto'); setShowModal(false); load() }
    catch (e) { alert('Error: ' + e.message) }
    setSubmitting(false)
  }

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div><div style={s.title}>Tasks</div><div style={s.desc}>Background jobs running on the Python backend</div></div>
        <button style={{ ...s.btnS, marginLeft: 'auto' }} onClick={load}>↻ Refresh</button>
        <button style={s.btnP} onClick={() => setShowModal(true)}>+ New Task</button>
      </div>

      <div style={s.body}>
        <div style={s.filters}>
          {['all', 'running', 'done', 'failed'].map(f => (
            <button key={f} style={s.fBtn(filter === f)} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'all' && ` (${tasks.length})`}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={s.empty}><div style={{ fontSize: 40, opacity: .4 }}>⏳</div><div>Loading…</div></div>
        ) : filtered.length === 0 ? (
          <div style={s.empty}><div style={{ fontSize: 40, opacity: .4 }}>✅</div><div>No tasks yet</div></div>
        ) : (
          <div style={s.list}>
            {filtered.map(t => (
              <div key={t.id} style={s.card} onClick={() => onViewTask(t)}>
                <div style={s.icon(t.status)}>{ICONS[t.agent_type] || '🤖'}</div>
                <div>
                  <div style={s.goal}>{t.goal}</div>
                  <div style={s.meta}>
                    🤖 {t.agent_type || 'auto'} &nbsp;·&nbsp;
                    🕐 {t.created_at || '—'}&nbsp;
                    {t.session_id && `· 🔑 ${t.session_id}`}
                  </div>
                </div>
                <div style={s.badge(t.status)}>{STATUS_LABEL[t.status] || t.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={s.modal}>
            <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Create New Task</div>
            <div style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 20, lineHeight: 1.6 }}>
              Describe in plain English. The backend handles everything automatically.
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>What do you want done?</label>
              <textarea style={s.ta} value={goal} onChange={e => setGoal(e.target.value)}
                placeholder="e.g. Review all open PRs and send a summary to Slack #engineering" />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={s.label}>Agent Type</label>
              <select style={s.sel} value={agentType} onChange={e => setAgentType(e.target.value)}>
                <option value="auto">🤖 Auto (recommended)</option>
                <option value="autonomous">🚀 Autonomous</option>
                <option value="pipeline">⛓ Pipeline</option>
                <option value="assistant">💬 Assistant</option>
              </select>
            </div>
            <div style={s.mfooter}>
              <button style={s.btnS} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={s.btnP} disabled={submitting || !goal.trim()} onClick={submit}>
                {submitting ? '…' : '▶ Run Task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
