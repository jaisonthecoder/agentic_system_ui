import { useState, useEffect } from 'react'
import { fetchAgents } from '../../api'

const TYPE_COLORS = {
  Autonomous:    ['var(--accent)',  'rgba(110,231,183,.12)'],
  Pipeline:      ['var(--purple)', 'rgba(192,132,252,.12)'],
  Assistant:     ['var(--amber)',  'rgba(251,191,36,.12)'],
  'Event-driven':['var(--red)',    'rgba(248,113,113,.12)'],
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
  hdr: { padding: '22px 28px 18px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
  title: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  desc: { fontSize: 12, color: 'var(--muted2)', marginTop: 2 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, padding: '22px 28px', overflowY: 'auto' },
  card: {
    background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 14,
    padding: 22, display: 'flex', flexDirection: 'column', gap: 12,
    cursor: 'pointer', position: 'relative', overflow: 'hidden', transition: 'all .2s',
  },
  icon: (bg) => ({ width: 46, height: 46, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: bg }),
  name: { fontSize: 15, fontWeight: 800, marginBottom: 3 },
  type: (col) => ({ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: col }),
  desc2: { fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6 },
  footer: { display: 'flex', gap: 8 },
  runBtn: (col, bg) => ({
    flex: 1, padding: 8, borderRadius: 8, fontSize: 12, fontWeight: 700,
    border: 'none', background: bg, color: col, cursor: 'pointer', transition: 'all .15s',
  }),
  cfgBtn: {
    flex: 1, padding: 8, borderRadius: 8, fontSize: 12, fontWeight: 700,
    background: 'var(--panel2)', color: 'var(--muted2)', border: '1px solid var(--border)', cursor: 'pointer',
  },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: 'var(--muted)', gridColumn: '1/-1' },
}

export default function AgentsView({ onRunAgent }) {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAgents().then(setAgents).catch(() => setAgents([])).finally(() => setLoading(false))
  }, [])

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div style={s.title}>Agents</div>
        <div style={s.desc}>Specialised workers — click Run to execute against the real backend</div>
      </div>
      <div style={s.grid}>
        {loading ? (
          <div style={s.empty}><div style={{ fontSize: 40, opacity: .4 }}>⏳</div><div>Loading…</div></div>
        ) : agents.length === 0 ? (
          <div style={s.empty}><div style={{ fontSize: 40, opacity: .4 }}>🤖</div><div>No agents returned from backend</div></div>
        ) : agents.map(a => {
          const [col, bg] = TYPE_COLORS[a.type] || ['var(--blue)', 'var(--blue-dim)']
          return (
            <div key={a.id} style={s.card}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={s.icon(bg)}>{a.icon}</div>
                <div>
                  <div style={s.name}>{a.name}</div>
                  <div style={s.type(col)}>{a.type}</div>
                </div>
              </div>
              <div style={s.desc2}>{a.desc}</div>
              <div style={s.footer}>
                <button style={s.runBtn(col, bg)} onClick={() => onRunAgent(a)}>▶ Run Agent</button>
                <button style={s.cfgBtn} onClick={() => alert(`${a.name} config panel — set system prompt, allowed skills, cost limits.`)}>⚙ Config</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
