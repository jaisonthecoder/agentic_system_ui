/**
 * ProjectsView.jsx — Main projects list + New Project wizard entry point.
 * Shows all projects with health indicators, current stage, and quick actions.
 */
import { useState, useEffect, useCallback } from 'react'
import { fetchProjects } from '../../api'
import NewProjectWizard from './NewProjectWizard'
import ProjectDetail from './ProjectDetail'
import styles from './ProjectsView.module.scss'

const STAGE_SHORT = {
  intent_extraction:   'Intent',
  standards_retrieval: 'Standards',
  proposal_generation: 'Proposal',
  human_review:        'Review',
  delegation:          'Delegation',
  parallel_execution:  'Executing',
  consolidation:       'Consolidating',
  handover:            'Handover',
}

const STATUS_CLASS = {
  active: styles.statusActive,
  failed: styles.statusFailed,
  done:   styles.statusDone,
  paused: styles.statusPaused,
}

function fmtDate(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const now = Date.now()
  const diff = now - ts * 1000
  if (diff < 60_000)     return 'just now'
  if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

const PATTERN_SHORT = {
  'angular-mfe-dotnet-cqrs':       'Angular + .NET',
  'angular-mfe-dotnet-camunda':    'Angular + Camunda',
  'dotnet-microservices-rabbitmq': '.NET Microservices',
  'dotnet-api-only':               '.NET API',
  'legacy-migration':              'Migration',
}

export default function ProjectsView() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showWizard, setWizard] = useState(false)
  const [selected, setSelected] = useState(null)
  const [search, setSearch]     = useState('')

  const load = useCallback(async () => {
    try {
      const data = await fetchProjects()
      setProjects(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreated = (result) => {
    setWizard(false)
    load()
    if (result?.project_id) setSelected(result.project_id)
  }

  if (selected) {
    return (
      <ProjectDetail
        projectId={selected}
        onBack={() => { setSelected(null); load() }}
      />
    )
  }

  const filtered = projects.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.wrap}>

      {/* ── Header ── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.title}>AI Portal Projects</h2>
          <div className={styles.subtitle}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} · Upload BRD/HLD to create a new project
          </div>
        </div>
        <input
          className={styles.search}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects…"
        />
        <button className={styles.newBtn} onClick={() => setWizard(true)}>
          + New Project
        </button>
      </div>

      {/* ── Content ── */}
      <div className={styles.body}>
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🏗️</div>
            <div>Loading projects…</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyDash}>
            <div className={styles.emptyIcon}>📂</div>
            <div className={styles.emptyTitle}>
              {search ? 'No projects match your search' : 'No projects yet'}
            </div>
            <div className={styles.emptySub}>
              {search ? 'Try a different search term.' : 'Upload a BRD or HLD document to get started.'}
            </div>
            {!search && (
              <button className={styles.newBtn} onClick={() => setWizard(true)}>
                Create First Project
              </button>
            )}
          </div>
        ) : (
          <div className={styles.grid}>
            {filtered.map(p => {
              const statusCls = STATUS_CLASS[p.status] ?? styles.statusDone
              const complianceScope = (() => {
                try { return JSON.parse(p.compliance_scope || '[]') } catch { return [] }
              })()
              return (
                <div
                  key={p.id}
                  className={styles.card}
                  onClick={() => setSelected(p.id)}
                >
                  {/* Card top row: icon + name + status */}
                  <div className={styles.cardTop}>
                    <div className={styles.cardIcon}>🏗️</div>
                    <div className={styles.cardMeta}>
                      <div className={styles.cardName}>{p.name}</div>
                      <div className={styles.cardPattern}>
                        {PATTERN_SHORT[p.pattern] || p.pattern || 'No pattern'}
                        {p.team && ` · ${p.team}`}
                      </div>
                    </div>
                    <div className={`${styles.statusBadge} ${statusCls}`}>{p.status}</div>
                  </div>

                  {/* Description */}
                  {p.description && (
                    <div className={styles.cardDesc}>{p.description}</div>
                  )}

                  {/* Footer: stage + compliance + date */}
                  <div className={styles.cardFooter}>
                    <span className={styles.stageBadge}>
                      {STAGE_SHORT[p.current_stage] || p.current_stage}
                    </span>
                    {complianceScope.slice(0, 2).map(c => (
                      <span key={c} className={styles.complianceBadge}>{c}</span>
                    ))}
                    <span className={styles.cardDate}>{fmtDate(p.updated_at)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Wizard ── */}
      {showWizard && (
        <NewProjectWizard onClose={() => setWizard(false)} onCreated={handleCreated} />
      )}
    </div>
  )
}
