import { useState, useEffect } from 'react'
import { fetchSkills } from '../../api'

const ICONS = {
  read_file: '📄', write_file: '✍️', web_search: '🔍', execute_python: '🐍',
  summarise_text: '✂️', github_get_pr: '🐙', github_post_review: '✅',
  jira_get_ticket: '🔎', jira_create_ticket: '➕', slack_send_message: '💬',
}

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
  hdr: {
    padding: '22px 28px 18px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
  },
  title: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  desc: { fontSize: 12, color: 'var(--muted2)', marginTop: 2 },
  btnS: { padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'var(--panel2)', color: 'var(--text)', border: '1px solid var(--border2)', marginLeft: 'auto' },
  body: { padding: '22px 28px', overflowY: 'auto', flex: 1 },
  filters: { display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  fBtn: (active) => ({
    padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, border: 'none',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--muted2)', cursor: 'pointer',
  }),
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 10 },
  card: { background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, transition: 'border-color .15s' },
  icon: { fontSize: 22, marginBottom: 8 },
  name: { fontSize: 14, fontWeight: 700, marginBottom: 4 },
  desc2: { fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 10 },
  footer: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  tag: (type) => ({
    fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase',
    padding: '3px 8px', borderRadius: 4,
    color: type === 'mcp' ? 'var(--purple)' : type === 'connector' ? 'var(--blue)' : 'var(--accent)',
    background: type === 'mcp' ? 'var(--purple-dim)' : type === 'connector' ? 'var(--blue-dim)' : 'var(--accent-dim)',
  }),
  toggle: (on) => ({
    width: 36, height: 20, borderRadius: 20, border: 'none', cursor: 'pointer', position: 'relative',
    background: on ? 'var(--accent)' : 'var(--border2)', transition: 'background .2s', flexShrink: 0,
  }),
  thumb: (on) => ({
    position: 'absolute', width: 14, height: 14, borderRadius: '50%', background: on ? '#000' : 'var(--muted)',
    top: 3, left: on ? 19 : 3, transition: 'left .2s',
  }),
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 200, gap: 10, color: 'var(--muted)' },
}

function Toggle({ on, onChange }) {
  return (
    <button style={s.toggle(on)} onClick={() => onChange(!on)}>
      <div style={s.thumb(on)} />
    </button>
  )
}

export default function SkillsView() {
  const [skills, setSkills] = useState([])
  const [filter, setFilter] = useState('all')
  const [enabled, setEnabled] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSkills().then(data => {
      setSkills(data)
      const e = {}; data.forEach(s => { e[s.name] = s.enabled !== false }); setEnabled(e)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const skillType = (s) => s.name?.startsWith('mcp__') ? 'mcp' : s.type || 'builtin'
  const filtered = filter === 'all' ? skills : skills.filter(s => skillType(s) === filter)

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div>
          <div style={s.title}>Skills Registry</div>
          <div style={s.desc}>Live from Python backend — tools your agents can call</div>
        </div>
        <button style={s.btnS} onClick={() => fetchSkills().then(setSkills)}>↻ Refresh</button>
      </div>

      <div style={s.body}>
        <div style={s.filters}>
          {[['all', `All (${skills.length})`], ['builtin', 'Built-in'], ['connector', 'Connectors'], ['mcp', 'MCP']].map(([f, lbl]) => (
            <button key={f} style={s.fBtn(filter === f)} onClick={() => setFilter(f)}>{lbl}</button>
          ))}
        </div>

        {loading ? (
          <div style={s.empty}><div style={{ fontSize: 40, opacity: .4 }}>🔧</div><div>Loading skills…</div></div>
        ) : (
          <div style={s.grid}>
            {filtered.map(sk => (
              <div key={sk.name} style={s.card}>
                <div style={s.icon}>{ICONS[sk.name] || (sk.name?.startsWith('mcp__') ? '🔌' : '⚙️')}</div>
                <div style={s.name}>{sk.name}</div>
                <div style={s.desc2}>{sk.description || 'No description'}</div>
                <div style={s.footer}>
                  <span style={s.tag(skillType(sk))}>{skillType(sk)}</span>
                  <Toggle on={enabled[sk.name] !== false} onChange={v => setEnabled(prev => ({ ...prev, [sk.name]: v }))} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
