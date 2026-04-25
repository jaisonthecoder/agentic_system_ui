import { useState, useEffect } from 'react'
import { fetchSkills, fetchSkillGroups } from '../../api'
import type { Skill, SkillGroup } from '../../types'
import styles from './SkillsView.module.scss'

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  'developer-tools': { bg: 'var(--accentDim)', fg: 'var(--accent)'  },
  communication:     { bg: 'var(--blueDim)',    fg: 'var(--blue)'    },
  cloud:             { bg: 'var(--purpleDim)',  fg: 'var(--purple)'  },
  builtin:           { bg: 'rgba(26,42,26,1)',  fg: '#4ade80'        },
  custom:            { bg: 'var(--panel2)',     fg: 'var(--muted2)'  },
}

function catStyle(cat: string) {
  return CAT_COLORS[cat] ?? CAT_COLORS.custom
}

function SkillRow({ sk }: { sk: Skill }) {
  const params = (sk.params ?? []).slice(0, 4)
  return (
    <div className={styles.skillRow}>
      <div className={styles.skIcon}>{sk.icon ?? '⚙️'}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className={styles.skName}>{sk.name}</div>
        <div className={styles.skDesc}>{sk.description ?? 'No description'}</div>
        <div className={styles.skMeta}>
          <span className={styles.srcTag}>{sk.source_type ?? 'python'}</span>
          {params.map((p) => <span key={p} className={styles.paramTag}>{p}</span>)}
          {(sk.params?.length ?? 0) > 4 && (
            <span className={styles.srcTag}>+{(sk.params?.length ?? 0) - 4}</span>
          )}
        </div>
      </div>
    </div>
  )
}

function GroupAccordion({ group, defaultOpen = false }: { group: SkillGroup; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  const cs = catStyle(group.category)
  return (
    <div className={styles.groupWrap}>
      <div
        className={`${styles.groupHeader} ${open ? styles.open : ''}`}
        onClick={() => setOpen((o) => !o)}
        role="button"
        aria-expanded={open}
      >
        <span className={styles.groupIcon}>{group.icon}</span>
        <span className={styles.groupLabel}>{group.label}</span>
        <div className={styles.groupMeta}>
          {group.connector_type && (
            <span className={styles.connBadge}>🔗 {group.connector_type}</span>
          )}
          <span
            className={styles.catTag}
            style={{ background: cs.bg, color: cs.fg }}
          >
            {group.category}
          </span>
          <span className={styles.groupCount}>
            {group.skill_count} skill{group.skill_count !== 1 ? 's' : ''}
          </span>
          <span className={`${styles.chevron} ${open ? styles.open : ''}`}>▶</span>
        </div>
      </div>
      {open && (
        <div className={styles.groupBody}>
          {(group.skills ?? []).map((sk) => <SkillRow key={sk.name} sk={sk} />)}
        </div>
      )}
    </div>
  )
}

export default function SkillsView() {
  const [groups,  setGroups]  = useState<SkillGroup[]>([])
  const [skills,  setSkills]  = useState<Skill[]>([])
  const [view,    setView]    = useState<'grouped' | 'flat'>('grouped')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const [gd, sd] = await Promise.all([fetchSkillGroups(), fetchSkills()])
      setGroups(gd.groups ?? [])
      setSkills(sd)
    } catch { /* network fail */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const namedGroups = groups.filter((g) => g.id !== '__ungrouped__')

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.title}>Skills Registry</div>
          <div className={styles.desc}>
            {skills.length} skills across {namedGroups.length} groups — live from backend
          </div>
        </div>
        <div className={styles.headerBtns}>
          <button
            className={`${styles.viewBtn}${view === 'grouped' ? ` ${styles.active}` : ''}`}
            onClick={() => setView('grouped')}
          >
            ⊞ Grouped
          </button>
          <button
            className={`${styles.viewBtn}${view === 'flat' ? ` ${styles.active}` : ''}`}
            onClick={() => setView('flat')}
          >
            ≡ All
          </button>
          <button className={styles.viewBtn} onClick={load}>↻ Refresh</button>
        </div>
      </div>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔧</div>
            <div>Loading skills…</div>
          </div>
        ) : view === 'grouped' ? (
          groups.map((g, i) => (
            <GroupAccordion key={g.id} group={g} defaultOpen={i === 0} />
          ))
        ) : (
          <div className={styles.grid}>
            {skills.map((sk) => (
              <div key={sk.name} className={styles.flatCard}>
                <div className={styles.flatIcon}>{sk.icon ?? '⚙️'}</div>
                <div className={styles.flatName}>{sk.name}</div>
                <div className={styles.flatDesc}>{sk.description ?? 'No description'}</div>
                <div className={styles.flatMeta}>
                  <span className={styles.srcTag}>{sk.source_type ?? 'python'}</span>
                  {sk.group_id && (
                    <span className={styles.connBadge}>{sk.group_id}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
