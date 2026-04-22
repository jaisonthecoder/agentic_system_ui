const s = {
  sidebar: {
    width: 220, background: 'var(--panel)', borderRight: '1px solid var(--border)',
    display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto',
  },
  section: { padding: '16px 12px 8px' },
  label: {
    fontSize: 10, fontWeight: 700, letterSpacing: 2.5, textTransform: 'uppercase',
    color: 'var(--muted)', padding: '0 8px', marginBottom: 6, display: 'block',
  },
  item: (active) => ({
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '9px 12px', borderRadius: 8, cursor: 'pointer',
    fontSize: 13, fontWeight: 500, marginBottom: 2, border: 'none',
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--muted2)',
    width: '100%', textAlign: 'left', transition: 'all .15s',
  }),
  icon: { fontSize: 16, width: 20, textAlign: 'center' },
  badge: {
    marginLeft: 'auto', background: 'var(--accent)', color: '#000',
    fontSize: 10, fontWeight: 800, padding: '1px 6px', borderRadius: 20,
  },
  footer: { marginTop: 'auto', padding: 12, borderTop: '1px solid var(--border)' },
  userCard: {
    display: 'flex', alignItems: 'center', gap: 10, padding: 10,
    borderRadius: 8, background: 'var(--panel2)',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 800,
  },
}

const NAV = [
  { id: 'chat',      icon: '💬', label: 'AI Chat' },
  { id: 'tasks',     icon: '✅', label: 'Tasks', badge: true },
  { id: 'agents',    icon: '🤖', label: 'Agents' },
  { id: 'skills',    icon: '🔧', label: 'Skills' },
  { id: 'dashboard', icon: '📊', label: 'Dashboard' },
]

const QUICK = [
  { label: 'Review PR',      goal: "Review PR #42 in acme/api-service and tell me if it's safe to merge" },
  { label: 'Jira Summary',   goal: 'Summarise all open Jira tickets assigned to me' },
  { label: 'Standup Report', goal: 'Generate a standup report for today' },
]

export default function Sidebar({ activeView, onViewChange, runningCount, onQuickRun }) {
  return (
    <div style={s.sidebar}>
      <div style={s.section}>
        <span style={s.label}>Workspace</span>
        {NAV.map(n => (
          <button key={n.id} style={s.item(activeView === n.id)} onClick={() => onViewChange(n.id)}>
            <span style={s.icon}>{n.icon}</span>
            {n.label}
            {n.badge && runningCount > 0 && <span style={s.badge}>{runningCount}</span>}
          </button>
        ))}
      </div>

      <div style={s.section}>
        <span style={s.label}>Quick Run</span>
        {QUICK.map(q => (
          <button key={q.label} style={{ ...s.item(false), fontSize: 12 }} onClick={() => onQuickRun(q.goal)}>
            <span style={s.icon}>⚡</span>
            {q.label}
          </button>
        ))}
      </div>

      <div style={s.footer}>
        <div style={s.userCard}>
          <div style={s.avatar}>AL</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Alice Lee</div>
            <div style={{ fontSize: 11, color: 'var(--muted2)' }}>Lead · LEAD role</div>
          </div>
        </div>
      </div>
    </div>
  )
}
