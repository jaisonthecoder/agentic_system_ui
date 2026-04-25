/**
 * ProjectsView.jsx — Main projects list + New Project wizard entry point.
 * Shows all projects with health indicators, current stage, and quick actions.
 */
import { useState, useEffect, useCallback } from 'react'
import { fetchProjects } from '../../api'
import NewProjectWizard from './NewProjectWizard'
import ProjectDetail from './ProjectDetail'

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

const STATUS_COLORS = {
  active:  '#22c55e',
  failed:  '#ef4444',
  done:    '#6366f1',
  paused:  '#f59e0b',
}

function fmtDate(ts) {
  if (!ts) return ''
  const d = new Date(ts * 1000)
  const now = Date.now()
  const diff = now - ts * 1000
  if (diff < 60_000) return 'just now'
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

const PATTERN_SHORT = {
  'angular-mfe-dotnet-cqrs': 'Angular + .NET',
  'angular-mfe-dotnet-camunda': 'Angular + Camunda',
  'dotnet-microservices-rabbitmq': '.NET Microservices',
  'dotnet-api-only': '.NET API',
  'legacy-migration': 'Migration',
}

export default function ProjectsView() {
  const [projects, setProjects]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [showWizard, setWizard]   = useState(false)
  const [selected, setSelected]   = useState(null)   // project_id to show detail
  const [search, setSearch]       = useState('')

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
    !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>AI Portal Projects</h2>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            {projects.length} project{projects.length !== 1 ? 's' : ''} · Upload BRD/HLD to create a new project
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search projects…"
          style={{
            padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'var(--panel2)', color: 'var(--text)', fontSize: 13, width: 200,
          }}
        />
        <button
          onClick={() => setWizard(true)}
          style={{
            padding: '9px 18px', borderRadius: 9, border: 'none',
            background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 13, cursor: 'pointer',
          }}
        >
          + New Project
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)', fontSize: 14 }}>Loading projects…</div>
      ) : filtered.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '60px 40px', borderRadius: 16,
          border: '2px dashed var(--border)', color: 'var(--muted)',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📂</div>
          <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
            {search ? 'No projects match your search' : 'No projects yet'}
          </div>
          <div style={{ fontSize: 13, marginBottom: 20 }}>
            {search ? 'Try a different search term.' : 'Upload a BRD or HLD document to get started.'}
          </div>
          {!search && (
            <button onClick={() => setWizard(true)} style={{
              padding: '10px 24px', borderRadius: 9, border: 'none',
              background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}>
              Create First Project
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map(p => {
            const statusColor = STATUS_COLORS[p.status] || '#6366f1'
            const complianceScope = (() => { try { return JSON.parse(p.compliance_scope || '[]') } catch { return [] } })()
            return (
              <div
                key={p.id}
                onClick={() => setSelected(p.id)}
                style={{
                  padding: 18, borderRadius: 14, border: '1px solid var(--border)',
                  background: 'var(--panel)', cursor: 'pointer', transition: 'border-color .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: 'linear-gradient(135deg, var(--blue), var(--purple))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                  }}>🏗️</div>
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
                      {PATTERN_SHORT[p.pattern] || p.pattern || 'No pattern'}
                      {p.team && ` · ${p.team}`}
                    </div>
                  </div>
                  <div style={{
                    padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700,
                    background: statusColor + '22', color: statusColor, border: `1px solid ${statusColor}44`,
                    flexShrink: 0,
                  }}>{p.status}</div>
                </div>

                {p.description && (
                  <div style={{ fontSize: 12, color: 'var(--muted2)', lineHeight: 1.5, marginBottom: 10, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {p.description}
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Stage badge */}
                  <div style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                    background: 'var(--accent-dim)', color: 'var(--accent)',
                  }}>
                    {STAGE_SHORT[p.current_stage] || p.current_stage}
                  </div>
                  {/* Compliance badges */}
                  {complianceScope.slice(0, 2).map(c => (
                    <span key={c} style={{ padding: '2px 7px', borderRadius: 20, fontSize: 10, fontWeight: 600, background: '#ef444422', color: '#f87171', border: '1px solid #ef444444' }}>{c}</span>
                  ))}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted)' }}>{fmtDate(p.updated_at)}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showWizard && <NewProjectWizard onClose={() => setWizard(false)} onCreated={handleCreated} />}
    </div>
  )
}
