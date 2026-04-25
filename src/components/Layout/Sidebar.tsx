import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.scss'

// ── Atelier Wordmark ───────────────────────────────────────────────────────────
function Wordmark() {
  return (
    <div className={styles.wordmark}>
      <span className={styles.wordmarkIcon} aria-hidden="true">
        <span className={styles.wordmarkRing} />
        <span className={styles.wordmarkDot} />
      </span>
      <span className={styles.wordmarkText}>AgentOS</span>
    </div>
  )
}

// ── Nav items with numbered index ──────────────────────────────────────────────
const NAV = [
  { to: '/projects',   label: 'Projects',    eyebrow: 'BROWSE' },
  { to: '/chat',       label: 'AI Dispatch'  },
  { to: '/tasks',      label: 'Work Queue',  badge: true },
  { to: '/agents',     label: 'Agents'       },
  { to: '/store',      label: 'Skill Store'  },
  { to: '/connectors', label: 'Connectors'   },
  { to: '/skills',     label: 'Registry'     },
  { to: '/dashboard',  label: 'Dashboard'    },
]

const QUICK = [
  { label: 'Review PR',      goal: "Review PR #42 in acme/api-service and tell me if it's safe to merge" },
  { label: 'Jira Summary',   goal: 'Summarise all open Jira tickets assigned to me'                       },
  { label: 'Standup Report', goal: 'Generate a standup report for today'                                  },
]

interface SidebarProps {
  runningCount: number
  onQuickRun: (goal: string) => void
}

export default function Sidebar({ runningCount, onQuickRun }: SidebarProps) {
  return (
    <aside className={styles.sidebar} aria-label="Sidebar navigation">
      {/* Wordmark */}
      <div className={styles.wordmarkWrap}>
        <Wordmark />
      </div>

      {/* Browse section */}
      <div className={styles.sectionLabel}>Browse</div>
      <nav aria-label="Main navigation">
        {NAV.map((n, i) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `${styles.navItem}${isActive ? ` ${styles.navItemActive}` : ''}`
            }
          >
            <span className={styles.navNum} aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className={styles.navLabel}>{n.label}</span>
            {n.badge && runningCount > 0 && (
              <span className={styles.navBadge} aria-label={`${runningCount} running`}>
                {String(runningCount).padStart(2, '0')}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className={styles.divider} />

      {/* Build section */}
      <div className={styles.sectionLabel}>Build</div>
      <button
        className={styles.buildCta}
        onClick={() => onQuickRun('Help me compose a new agent from scratch')}
        aria-label="Compose a new agent"
      >
        Compose your<br />own agent →
      </button>
      <div className={styles.buildDesc}>
        Quick-run a goal, stitch skills, ship in minutes.
      </div>

      {/* Quick run shortcuts */}
      <div className={styles.quickSection}>
        {QUICK.map((q) => (
          <button
            key={q.label}
            className={styles.quickItem}
            onClick={() => onQuickRun(q.goal)}
          >
            <span className={styles.quickDot} aria-hidden="true" />
            {q.label}
          </button>
        ))}
      </div>

      {/* Footer user card */}
      <div className={styles.footer}>
        <div className={styles.userMark} aria-hidden="true">AL</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>Alice Lee</div>
          <div className={styles.userRole}>Lead Engineer</div>
        </div>
      </div>
    </aside>
  )
}

