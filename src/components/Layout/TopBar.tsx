import { NavLink } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { API_BASE } from '../../api'
import type { Connection } from '../../types'
import styles from './TopBar.module.scss'

const TABS = [
  { to: '/projects',   label: 'Projects'    },
  { to: '/chat',       label: 'AI Chat'     },
  { to: '/tasks',      label: 'Tasks'       },
  { to: '/agents',     label: 'Agents'      },
  { to: '/skills',     label: 'Skills'      },
  { to: '/dashboard',  label: 'Dashboard'   },
]

interface TopBarProps {
  connection: Connection
}

export default function TopBar({ connection }: TopBarProps) {
  const { theme, toggle } = useTheme()

  const statusClass = {
    online:     styles.statusOnline,
    offline:    styles.statusOffline,
    connecting: styles.statusConnecting,
  }[connection.status] ?? styles.statusConnecting

  return (
    <header className={styles.topbar}>
      <NavLink to="/chat" className={styles.logo}>
        <div className={styles.logoDot}>A</div>
        AgentOS
      </NavLink>

      <div className={styles.divider} />

      <nav className={styles.nav} aria-label="Main navigation">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `${styles.navBtn}${isActive ? ` ${styles.navBtnActive}` : ''}`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>

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
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        <div className={styles.avatar} aria-label="User: Alice Lee">AL</div>
      </div>
    </header>
  )
}
