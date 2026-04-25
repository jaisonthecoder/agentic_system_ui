import { useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { API_BASE } from '../../api'
import type { Connection } from '../../types'
import styles from './TopBar.module.scss'

// ── Per-route display metadata ─────────────────────────────────────────────────
const ROUTE_META: Record<string, { eyebrow: string; title: string; lede: string }> = {
  '/chat':       { eyebrow: 'AI WORKFORCE', title: 'Talk to your agents.', lede: 'Plain-English goals. Structured results. All 7 layers active.' },
  '/tasks':      { eyebrow: 'OPERATIONS',   title: 'Your work queue.',      lede: 'Every task the system is running, queued, or has completed.' },
  '/agents':     { eyebrow: 'WORKSHOP',     title: 'Your agents at work.',  lede: 'Live activity, runs, and configuration for every agent.' },
  '/skills':     { eyebrow: 'REGISTRY',     title: 'The skill registry.',   lede: 'Every callable function your agents can use.' },
  '/store':      { eyebrow: 'SKILL LIBRARY',title: 'The atomic units.',     lede: '55+ skills agents call to actually do things — connectors, code, comms.' },
  '/connectors': { eyebrow: 'INFRASTRUCTURE',title:'Connect everything.',   lede: 'OAuth connections and API credentials your agents reach through.' },
  '/dashboard':  { eyebrow: 'VOLUME IX',    title: 'The AgentOS Index.',    lede: 'Live metrics from the Python backend.' },
  '/projects':   { eyebrow: 'WORKSHOP',     title: 'Your projects.',        lede: 'From idea to deployed — every stage tracked.' },
}

interface TopBarProps {
  connection: Connection
}

export default function TopBar({ connection }: TopBarProps) {
  const { theme, toggle } = useTheme()
  const location = useLocation()

  const meta = ROUTE_META[location.pathname] ?? {
    eyebrow: 'AGENTOS',
    title: 'AI Workforce.',
    lede: 'Your agentic platform.',
  }

  const statusClass = {
    online:     styles.statusOnline,
    offline:    styles.statusOffline,
    connecting: styles.statusConnecting,
  }[connection.status] ?? styles.statusConnecting

  return (
    <header className={styles.topbar}>
      <div className={styles.inner}>
        <div className={styles.titleGroup}>
          <div className={styles.eyebrow}>{meta.eyebrow}</div>
          <h1 className={styles.title}>{meta.title}</h1>
          <p className={styles.lede}>{meta.lede}</p>
        </div>

        <div className={styles.right}>
          <span className={styles.urlBadge} title={API_BASE}>
            {API_BASE.replace(/^https?:\/\//, '')}
          </span>

          <div className={`${styles.statusPill} ${statusClass}`} role="status" aria-live="polite">
            <div className={styles.statusDot} />
            <span>{connection.label}</span>
          </div>

          <button
            className={styles.themeToggle}
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀' : '☽'}
          </button>

          <div className={styles.avatar} aria-label="User: Alice Lee">AL</div>
        </div>
      </div>
    </header>
  )
}

