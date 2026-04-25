import { NavLink } from 'react-router-dom'
import styles from './Sidebar.module.scss'

const NAV = [
  { to: '/projects',   icon: '🏗️', label: 'Projects'    },
  { to: '/chat',       icon: '💬', label: 'AI Chat'     },
  { to: '/tasks',      icon: '✅', label: 'Tasks',  badge: true },
  { to: '/agents',     icon: '🤖', label: 'Agents'      },
  { to: '/store',      icon: '🛒', label: 'Skill Store' },
  { to: '/connectors', icon: '🔗', label: 'Connectors'  },
  { to: '/skills',     icon: '🔧', label: 'Registry'    },
  { to: '/dashboard',  icon: '📊', label: 'Dashboard'   },
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
    <aside className={styles.sidebar} aria-label="Sidebar">
      <div className={styles.section}>
        <span className={styles.label}>Workspace</span>
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={({ isActive }) =>
              `${styles.item}${isActive ? ` ${styles.itemActive}` : ''}`
            }
          >
            <span className={styles.itemIcon} aria-hidden="true">{n.icon}</span>
            {n.label}
            {n.badge && runningCount > 0 && (
              <span className={styles.itemBadge} aria-label={`${runningCount} running`}>
                {runningCount}
              </span>
            )}
          </NavLink>
        ))}
      </div>

      <div className={styles.section}>
        <span className={styles.label}>Quick Run</span>
        {QUICK.map((q) => (
          <button
            key={q.label}
            className={`${styles.item} ${styles.quickItem}`}
            onClick={() => onQuickRun(q.goal)}
          >
            <span className={styles.itemIcon} aria-hidden="true">⚡</span>
            {q.label}
          </button>
        ))}
      </div>

      <div className={styles.footer}>
        <div className={styles.userCard}>
          <div className={styles.userAvatar} aria-hidden="true">AL</div>
          <div className={styles.userInfo}>
            <div className={styles.userName}>Alice Lee</div>
            <div className={styles.userRole}>Lead · LEAD role</div>
          </div>
        </div>
      </div>
    </aside>
  )
}
