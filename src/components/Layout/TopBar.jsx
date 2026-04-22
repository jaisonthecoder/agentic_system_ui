import { API_BASE } from '../../api'

const s = {
  topbar: {
    height: 52, background: 'var(--panel)', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0, zIndex: 100,
  },
  logo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 800, letterSpacing: -0.5 },
  logoDot: {
    width: 20, height: 20, borderRadius: 6,
    background: 'linear-gradient(135deg, var(--accent), var(--blue))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 10, color: '#000', fontWeight: 900,
  },
  sep: { width: 1, height: 24, background: 'var(--border)' },
  tabBtn: (active) => ({
    padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
    border: 'none', background: active ? 'var(--panel2)' : 'none',
    color: active ? 'var(--text)' : 'var(--muted2)', transition: 'all .15s',
  }),
  right: { marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 },
  urlBadge: {
    padding: '4px 10px', background: 'var(--panel2)', border: '1px solid var(--border2)',
    borderRadius: 6, fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--muted2)',
  },
  pill: (status) => {
    const map = {
      online:  { bg: 'var(--accent-dim)', border: 'rgba(110,231,183,.25)', color: 'var(--accent)' },
      offline: { bg: 'var(--red-dim)',    border: 'rgba(248,113,113,.25)', color: 'var(--red)' },
      connecting: { bg: 'var(--amber-dim)', border: 'rgba(251,191,36,.25)', color: 'var(--amber)' },
    }
    const c = map[status] || map.connecting
    return {
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color,
    }
  },
  pulse: {
    width: 6, height: 6, borderRadius: '50%', background: 'currentColor',
    animation: 'blink 2s infinite',
  },
  avatar: {
    width: 32, height: 32, borderRadius: '50%',
    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 800,
  },
}

const TABS = ['Chat', 'Tasks', 'Agents', 'Skills', 'Dashboard']

export default function TopBar({ activeView, onViewChange, connection }) {
  return (
    <div style={s.topbar}>
      <div style={s.logo}>
        <div style={s.logoDot}>A</div>
        AgentOS
      </div>
      <div style={s.sep} />
      {TABS.map(t => (
        <button
          key={t}
          style={s.tabBtn(activeView === t.toLowerCase())}
          onClick={() => onViewChange(t.toLowerCase())}
        >
          {t}
        </button>
      ))}
      <div style={s.right}>
        <span style={s.urlBadge}>{API_BASE.replace('http://', '')}</span>
        <div style={s.pill(connection.status)}>
          <div style={s.pulse} />
          <span>{connection.label}</span>
        </div>
        <div style={s.avatar}>AL</div>
      </div>
    </div>
  )
}
