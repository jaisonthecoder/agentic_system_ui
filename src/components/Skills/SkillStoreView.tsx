import { useState, useEffect, useCallback } from 'react'
import { fetchStoreSkills, uninstallSkill, testSkill, fetchSkillAnalytics, fetchSkillGroups } from '../../api'
import type { StoreSkill, SkillGroup, AnalyticsData, SkillParam } from '../../types'
import styles from './SkillStoreView.module.scss'

const SOURCE_COLORS: Record<string, { bg: string; fg: string }> = {
  python:           { bg: 'var(--accentDim)',  fg: 'var(--accent)'  },
  'ui-built':       { bg: 'var(--blueDim)',    fg: 'var(--blue)'    },
  openapi:          { bg: 'var(--purpleDim)',  fg: 'var(--purple)'  },
  'doc-extracted':  { bg: '#2a1f0a',           fg: '#f59e0b'        },
  'ai-generated':   { bg: '#0a1f2a',           fg: '#06b6d4'        },
  mcp:              { bg: 'var(--panel2)',      fg: 'var(--muted2)'  },
}

const CAT_COLORS: Record<string, { bg: string; fg: string }> = {
  'developer-tools': { bg: 'var(--accentDim)', fg: 'var(--accent)'  },
  communication:     { bg: 'var(--blueDim)',   fg: 'var(--blue)'    },
  cloud:             { bg: 'var(--purpleDim)', fg: 'var(--purple)'  },
  builtin:           { bg: 'rgba(26,42,26,1)', fg: '#4ade80'        },
  custom:            { bg: 'var(--panel2)',    fg: 'var(--muted2)'  },
}

const CATS = [
  { id: '',                label: 'All'         },
  { id: 'developer-tools', label: '🛠 Dev Tools' },
  { id: 'communication',   label: '💬 Comms'    },
  { id: 'data',            label: '📊 Data'     },
  { id: 'ai',              label: '🤖 AI'       },
  { id: 'cloud',           label: '☁️ Cloud'    },
  { id: 'custom',          label: '⚙️ Custom'   },
]

export default function SkillStoreView() {
  const [groups,    setGroups]    = useState<SkillGroup[]>([])
  const [skills,    setSkills]    = useState<StoreSkill[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData>({})
  const [category,  setCategory]  = useState('')
  const [search,    setSearch]    = useState('')
  const [viewMode,  setViewMode]  = useState<'grouped' | 'flat'>('grouped')
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState<StoreSkill | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<SkillGroup | null>(null)
  const [testArgs,  setTestArgs]  = useState<Record<string, string>>({})
  const [testResult,setTestResult]= useState<string | null>(null)
  const [testing,   setTesting]   = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [gd, sd, an] = await Promise.all([
        fetchSkillGroups(),
        fetchStoreSkills({ category, search }),
        fetchSkillAnalytics(),
      ])
      setGroups(gd.groups ?? [])
      setSkills(sd)
      setAnalytics(an)
    } catch { /* network error */ }
    setLoading(false)
  }, [category, search])

  useEffect(() => { load() }, [load])

  const handleUninstall = async (name: string) => {
    await uninstallSkill(name)
    setSelected(null)
    load()
  }

  const handleTest = async () => {
    if (!selected) return
    setTesting(true)
    setTestResult(null)
    try {
      const r = await testSkill(selected.name, Object.fromEntries(
        Object.entries(testArgs).map(([k, v]) => [k, v])
      ))
      setTestResult(JSON.stringify(r, null, 2))
    } catch (e) {
      setTestResult('Error: ' + (e instanceof Error ? e.message : String(e)))
    }
    setTesting(false)
  }

  const totalCalls = (g: SkillGroup) =>
    (g.skills ?? []).reduce((s, sk) => s + (analytics[sk.name] ?? 0), 0)

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.hdrRow}>
          <span className={styles.title}>Skill Store</span>
          <button className={`${styles.viewBtn}${viewMode === 'grouped' ? ` ${styles.active}` : ''}`} onClick={() => setViewMode('grouped')}>⊞ Groups</button>
          <button className={`${styles.viewBtn}${viewMode === 'flat' ? ` ${styles.active}` : ''}`} onClick={() => setViewMode('flat')}>≡ All</button>
        </div>
        <div className={styles.filters}>
          <input className={styles.search} placeholder="Search skills…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {CATS.map((c) => (
            <button key={c.id} className={`${styles.filterBtn}${category === c.id ? ` ${styles.active}` : ''}`} onClick={() => setCategory(c.id)}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        {loading ? (
          <div className={styles.empty}><div className={styles.emptyIcon}>🛒</div><div>Loading…</div></div>
        ) : viewMode === 'grouped' ? (
          <div className={styles.groupGrid}>
            {groups.map((g) => {
              const cc = CAT_COLORS[g.category] ?? CAT_COLORS.custom
              return (
                <div key={g.id} className={`${styles.gCard}${selectedGroup?.id === g.id ? ` ${styles.selected}` : ''}`} onClick={() => { setSelectedGroup(g); setSelected(null) }}>
                  <div className={styles.gIcon}>{g.icon}</div>
                  <div className={styles.gLabel}>{g.label}</div>
                  <div className={styles.gDesc}>{g.description ?? 'No description'}</div>
                  <div className={styles.gFooter}>
                    <span className={styles.catTag} style={{ background: cc.bg, color: cc.fg }}>{g.category}</span>
                    {g.connector_type && <span className={styles.connBadge}>🔗 {g.connector_type}</span>}
                    <span className={styles.countBadge}>{g.skill_count} skills</span>
                    {totalCalls(g) > 0 && <span className={styles.calls}>↗ {totalCalls(g)}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className={styles.grid}>
            {skills.map((sk) => {
              const sc = SOURCE_COLORS[sk.source_type ?? 'python'] ?? SOURCE_COLORS.python
              return (
                <div key={sk.name} className={`${styles.card}${selected?.name === sk.name ? ` ${styles.selected}` : ''}`} onClick={() => { setSelected(sk); setSelectedGroup(null); setTestResult(null); setTestArgs({}) }}>
                  <div className={styles.icon}>{sk.icon ?? '⚙️'}</div>
                  <div className={styles.name}>{sk.name}</div>
                  <div className={styles.desc}>{sk.description ?? 'No description'}</div>
                  <div className={styles.footer2}>
                    <span className={styles.srcTag} style={{ background: sc.bg, color: sc.fg }}>{sk.source_type ?? 'python'}</span>
                    {(analytics[sk.name] ?? 0) > 0 && <span className={styles.calls}>↗ {analytics[sk.name]}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail panel — selected skill */}
      {selected && (
        <div className={styles.panel} role="complementary">
          <div className={styles.pHdr}>
            <span className={styles.pIcon}>{selected.icon ?? '⚙️'}</span>
            <div>
              <div className={styles.pName}>{selected.name}</div>
              <div className={styles.pSub}>{selected.source_type ?? 'python'}</div>
            </div>
            <button className={styles.closeBtn} onClick={() => setSelected(null)} aria-label="Close">✕</button>
          </div>

          {selected.description && (
            <div className={styles.sSection}>
              <span className={styles.sLabel}>About</span>
              <div style={{ fontSize: '12px', lineHeight: 1.6 }}>{selected.description}</div>
            </div>
          )}

          {(selected.parameters?.length ?? 0) > 0 && (
            <div className={styles.sSection}>
              <span className={styles.sLabel}>Test</span>
              {(selected.parameters ?? []).map((p: SkillParam) => (
                <div key={p.name}>
                  <label style={{ fontSize: '11px', color: 'var(--muted2)' }}>
                    {p.name}{p.required ? ' *' : ''} ({p.type ?? 'string'})
                  </label>
                  <input
                    className={styles.argInput}
                    value={testArgs[p.name] ?? ''}
                    onChange={(e) => setTestArgs((prev) => ({ ...prev, [p.name]: e.target.value }))}
                    placeholder={`Enter ${p.name}…`}
                  />
                </div>
              ))}
              <button className={styles.testBtn} onClick={handleTest} disabled={testing}>
                {testing ? 'Testing…' : '▶ Test'}
              </button>
              {testResult && <pre className={styles.testResult}>{testResult}</pre>}
            </div>
          )}

          <button className={styles.dangerBtn} onClick={() => handleUninstall(selected.name)}>
            Uninstall
          </button>
        </div>
      )}

      {/* Detail panel — selected group */}
      {selectedGroup && !selected && (
        <div className={styles.panel} role="complementary">
          <div className={styles.pHdr}>
            <span className={styles.pIcon}>{selectedGroup.icon}</span>
            <div>
              <div className={styles.pName}>{selectedGroup.label}</div>
              <div className={styles.pSub}>{selectedGroup.skill_count} skills</div>
            </div>
            <button className={styles.closeBtn} onClick={() => setSelectedGroup(null)} aria-label="Close">✕</button>
          </div>
          <div className={styles.sSection}>
            <span className={styles.sLabel}>Skills ({selectedGroup.skill_count})</span>
            {(selectedGroup.skills ?? []).map((sk) => (
              <div key={sk.name} className={styles.skRow} onClick={() => { setSelected(sk); setTestArgs({}); setTestResult(null) }}>
                <span className={styles.skIcon}>{sk.icon ?? '⚙️'}</span>
                <div>
                  <div className={styles.skName}>{sk.name}</div>
                  <div className={styles.skDesc}>{sk.description?.slice(0, 80) ?? ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
