import { useState, useEffect, useCallback } from 'react'
import { fetchStoreSkills, uninstallSkill, testSkill, fetchSkillAnalytics, fetchSkillGroups } from '../../api'
import type { StoreSkill, SkillGroup, AnalyticsData, SkillParam } from '../../types'
import SkillBuilderWizard from './SkillBuilderWizard'
import styles from './SkillStoreView.module.scss'

const SOURCES = [
  { id: '',              label: 'All sources'  },
  { id: 'python',        label: '🐍 Python'     },
  { id: 'doc-extracted', label: '📄 From Doc'   },
  { id: 'openapi',       label: '🔗 OpenAPI'    },
  { id: 'ai-generated',  label: '✨ AI Gen'     },
  { id: 'ui-built',      label: '🖱 UI Built'   },
  { id: 'mcp',           label: '🔌 MCP'        },
]

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
  const [showWizard, setShowWizard] = useState(false)
  const [sourceFilter, setSourceFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [gd, sd, an] = await Promise.all([
        fetchSkillGroups(),
        fetchStoreSkills({ category, search, source_type: sourceFilter || undefined }),
        fetchSkillAnalytics(),
      ])
      setGroups(gd.groups ?? [])
      setSkills(sd)
      setAnalytics(an)
    } catch { /* network error */ }
    setLoading(false)
  }, [category, search, sourceFilter])

  useEffect(() => { load() }, [load])

  const handleUninstall = async (name: string) => {
    if (!window.confirm(`Uninstall '${name}'? This cannot be undone.`)) return
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
          <span className={styles.title}>Skill Store <span className={styles.skillCount}>{skills.length} skills</span></span>
          <button className={`${styles.viewBtn}${viewMode === 'grouped' ? ` ${styles.active}` : ''}`} onClick={() => setViewMode('grouped')}>⊞ Groups</button>
          <button className={`${styles.viewBtn}${viewMode === 'flat' ? ` ${styles.active}` : ''}`} onClick={() => setViewMode('flat')}>≡ All</button>
          <button className={styles.createBtn} onClick={() => setShowWizard(true)}>+ Create Skill</button>
        </div>
        <div className={styles.filters}>
          <input className={styles.search} placeholder="Search skills…" value={search} onChange={(e) => setSearch(e.target.value)} />
          {CATS.map((c) => (
            <button key={c.id} className={`${styles.filterBtn}${category === c.id ? ` ${styles.active}` : ''}`} onClick={() => setCategory(c.id)}>
              {c.label}
            </button>
          ))}
          <select className={styles.sourceSelect} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            {SOURCES.map((x) => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </div>
      </div>

      {/* Two-pane body: main (scrollable) + panel (fixed width) */}
      <div className={styles.body}>

        {/* ── Left: scrollable main area ── */}
        <div className={styles.main}>
          {loading ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🛒</div>
              <div>Loading…</div>
            </div>
          ) : viewMode === 'grouped' ? (
            <div className={styles.groupGrid}>
              {groups.map((g) => {
                const cc = CAT_COLORS[g.category] ?? CAT_COLORS.custom
                return (
                  <div
                    key={g.id}
                    className={`${styles.gCard}${selectedGroup?.id === g.id ? ` ${styles.selected}` : ''}`}
                    onClick={() => { setSelectedGroup(g); setSelected(null) }}
                  >
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
                  <div
                    key={sk.name}
                    className={`${styles.card}${selected?.name === sk.name ? ` ${styles.selected}` : ''}`}
                    onClick={() => { setSelected(sk); setSelectedGroup(null); setTestResult(null); setTestArgs({}) }}
                  >
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

        {/* ── Right: selected skill detail + test panel ── */}
        {selected && (
          <div className={styles.panel} role="complementary">
            <div className={styles.pHdr}>
              <span className={styles.pIcon}>{selected.icon ?? '⚙️'}</span>
              <div style={{ flex: 1 }}>
                <div className={styles.pName}>{selected.name}</div>
                <div className={styles.pSub}>
                  <span>{selected.source_type ?? 'python'}</span>
                  {' · '}{selected.category ?? 'custom'}
                </div>
              </div>
              <button className={styles.closeBtn} onClick={() => setSelected(null)} aria-label="Close">✕</button>
            </div>

            {/* Description */}
            <div className={styles.sSection}>
              <div className={styles.sLabel}>Description</div>
              <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--text-2)' }}>
                {selected.description ?? '—'}
              </div>
            </div>

            {/* Parameters + test inputs */}
            {(selected.parameters?.length ?? 0) > 0 && (
              <div className={styles.sSection}>
                <div className={styles.sLabel}>Parameters</div>
                {(selected.parameters ?? []).map((p: SkillParam) => (
                  <div key={p.name} style={{ marginBottom: 10 }}>
                    <div className={styles.paramMeta}>
                      <span className={styles.paramName}>{p.name}</span>
                      <span className={styles.paramType}>{p.type ?? 'string'}</span>
                      {p.required && <span className={styles.paramReq}>required</span>}
                    </div>
                    <input
                      className={styles.argInput}
                      placeholder={p.description ?? p.name}
                      value={testArgs[p.name] ?? ''}
                      onChange={(e) => setTestArgs((prev) => ({ ...prev, [p.name]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Test Sandbox — always visible */}
            <div className={styles.sSection}>
              <div className={styles.sLabel}>Test Sandbox</div>
              <button className={styles.testBtn} onClick={handleTest} disabled={testing}>
                {testing ? 'Running…' : '▶ Run Skill'}
              </button>
              {testResult && (
                <pre className={styles.testResult}>{testResult}</pre>
              )}
            </div>

            {/* Analytics */}
            {(analytics[selected.name] ?? 0) >= 0 && (
              <div className={styles.sSection}>
                <div className={styles.sLabel}>Analytics</div>
                <div style={{ fontSize: '13px', color: 'var(--text-2)' }}>
                  Total calls: <strong>{analytics[selected.name] ?? 0}</strong>
                </div>
              </div>
            )}

            <button className={styles.dangerBtn} onClick={() => handleUninstall(selected.name)}>
              Uninstall skill
            </button>
          </div>
        )}

        {/* ── Right: selected group — lists all sub-skills, click one to test ── */}
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
                <div
                  key={sk.name}
                  className={styles.skRow}
                  onClick={() => { setSelected(sk); setTestArgs({}); setTestResult(null) }}
                >
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

      </div>{/* end .body */}

      {/* ── Skill Builder Wizard ── */}
      {showWizard && (
        <SkillBuilderWizard
          onClose={() => setShowWizard(false)}
          onInstalled={() => { setShowWizard(false); load() }}
        />
      )}

    </div>
  )
}
const SOURCE_TYPES = ['python', 'openapi', 'ui-built', 'doc-extracted', 'ai-generated', 'mcp']
const CATEGORIES   = ['developer-tools', 'communication', 'data', 'ai', 'cloud', 'custom', 'builtin']

interface CreateSkillModalProps {
  onClose: () => void
  onCreated: () => void
}

function CreateSkillModal({ onClose, onCreated }: CreateSkillModalProps) {
  const [form, setForm] = useState({
    name:        '',
    icon:        '⚙️',
    description: '',
    source_type: 'python',
    category:    'custom',
    group_id:    '',
    code:        '# Python skill\ndef run(args):\n    return {"result": "hello"}',
  })
  const [params, setParams] = useState<Array<{ name: string; type: string; required: boolean; description: string }>>([])
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const addParam = () =>
    setParams((p) => [...p, { name: '', type: 'string', required: false, description: '' }])

  const removeParam = (i: number) =>
    setParams((p) => p.filter((_, idx) => idx !== i))

  const setParam = (i: number, k: string, v: unknown) =>
    setParams((p) => p.map((row, idx) => idx === i ? { ...row, [k]: v } : row))

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    try {
      await createSkillFromDefinition({ ...form, parameters: params })
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create skill')
      setSaving(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Create Skill"
    >
      <div className={styles.createModal}>

        {/* Header */}
        <div className={styles.createModalHdr}>
          <span style={{ fontSize: 22 }}>{form.icon}</span>
          <div style={{ flex: 1 }}>
            <div className={styles.createModalTitle}>Create Skill</div>
            <div className={styles.createModalSub}>Define a new custom skill for your agents</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Scrollable body */}
        <div className={styles.createModalBody}>

          {/* Row: icon + name */}
          <div className={styles.cmRow}>
            <div style={{ flex: '0 0 72px' }}>
              <label className={styles.cmLabel}>Icon</label>
              <input
                className={styles.cmInput}
                value={form.icon}
                onChange={(e) => set('icon', e.target.value)}
                maxLength={2}
                style={{ textAlign: 'center', fontSize: 18 }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className={styles.cmLabel}>Name *</label>
              <input
                className={styles.cmInput}
                placeholder="e.g. fetch_github_pr"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                autoFocus
              />
            </div>
          </div>

          <label className={styles.cmLabel}>Description</label>
          <input
            className={styles.cmInput}
            placeholder="What does this skill do?"
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />

          {/* Row: source type + category */}
          <div className={styles.cmRow}>
            <div style={{ flex: 1 }}>
              <label className={styles.cmLabel}>Source Type</label>
              <select className={styles.cmInput} value={form.source_type} onChange={(e) => set('source_type', e.target.value)}>
                {SOURCE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className={styles.cmLabel}>Category</label>
              <select className={styles.cmInput} value={form.category} onChange={(e) => set('category', e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <label className={styles.cmLabel}>Group ID <span className={styles.cmOptional}>(optional)</span></label>
          <input
            className={styles.cmInput}
            placeholder="e.g. github-tools"
            value={form.group_id}
            onChange={(e) => set('group_id', e.target.value)}
          />

          {/* Code */}
          {form.source_type === 'python' && (
            <>
              <label className={styles.cmLabel}>Python Code</label>
              <textarea
                className={styles.cmCode}
                rows={8}
                value={form.code}
                onChange={(e) => set('code', e.target.value)}
                spellCheck={false}
              />
            </>
          )}

          {/* Parameters */}
          <div className={styles.cmParamsHdr}>
            <label className={styles.cmLabel} style={{ margin: 0 }}>Parameters</label>
            <button className={styles.addParamBtn} onClick={addParam}>+ Add</button>
          </div>
          {params.length === 0 && (
            <div className={styles.cmEmpty}>No parameters — click "+ Add" to define inputs</div>
          )}
          {params.map((p, i) => (
            <div key={i} className={styles.cmParamRow}>
              <div className={styles.cmParamFields}>
                <div style={{ flex: 2 }}>
                  <label className={styles.cmLabel}>Name</label>
                  <input
                    className={styles.cmInput}
                    placeholder="param_name"
                    value={p.name}
                    onChange={(e) => setParam(i, 'name', e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label className={styles.cmLabel}>Type</label>
                  <select className={styles.cmInput} value={p.type} onChange={(e) => setParam(i, 'type', e.target.value)}>
                    {['string', 'number', 'boolean', 'object', 'array'].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div style={{ flex: '0 0 72px' }}>
                  <label className={styles.cmLabel}>Required</label>
                  <div style={{ paddingTop: 8 }}>
                    <input
                      type="checkbox"
                      checked={p.required}
                      onChange={(e) => setParam(i, 'required', e.target.checked)}
                      style={{ accentColor: 'var(--accent)', width: 16, height: 16 }}
                    />
                  </div>
                </div>
              </div>
              <div className={styles.cmParamDescRow}>
                <div style={{ flex: 1 }}>
                  <label className={styles.cmLabel}>Description</label>
                  <input
                    className={styles.cmInput}
                    placeholder="Describe this parameter…"
                    value={p.description}
                    onChange={(e) => setParam(i, 'description', e.target.value)}
                  />
                </div>
                <button
                  className={styles.removeParamBtn}
                  onClick={() => removeParam(i)}
                  aria-label="Remove parameter"
                >✕</button>
              </div>
            </div>
          ))}

          {error && <div className={styles.cmError}>{error}</div>}
        </div>

        {/* Footer */}
        <div className={styles.createModalFtr}>
          <button className={styles.cmCancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.cmSaveBtn} onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? 'Creating…' : '+ Create Skill'}
          </button>
        </div>
      </div>
    </div>
  )
}
