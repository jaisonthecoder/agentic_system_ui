/**
 * ProjectDetail.jsx — Full project view: stage timeline + intent + artifacts.
 */
import { useState, useEffect } from 'react'
import { fetchProject, fetchProjectIntent, fetchProjectArtifacts } from '../../api'
import StageTimeline from './StageTimeline'
import IntentReviewPanel from './IntentReviewPanel'
import ArtifactViewer from './ArtifactViewer'

const TAB = ({ label, active, onClick }) => (
  <button onClick={onClick} style={{
    padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
    background: active ? 'var(--accent-dim)' : 'transparent',
    color: active ? 'var(--accent)' : 'var(--muted2)',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
  }}>{label}</button>
)

const PATTERN_LABELS = {
  'angular-mfe-dotnet-cqrs': 'Angular MFE + .NET CQRS',
  'angular-mfe-dotnet-camunda': 'Angular MFE + .NET CQRS + Camunda',
  'dotnet-microservices-rabbitmq': '.NET Microservices + RabbitMQ',
  'dotnet-api-only': '.NET REST API',
  'legacy-migration': 'Legacy Migration',
}

function Badge({ label, color = '#6366f1' }) {
  return (
    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: color + '22', color, border: `1px solid ${color}44` }}>
      {label}
    </span>
  )
}

export default function ProjectDetail({ projectId, onBack }) {
  const [data, setData]       = useState(null)
  const [intent, setIntent]   = useState(null)
  const [artifacts, setArtifacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState('timeline')

  const load = async () => {
    setLoading(true)
    try {
      const [proj, intentData, arts] = await Promise.all([
        fetchProject(projectId),
        fetchProjectIntent(projectId).catch(() => null),
        fetchProjectArtifacts(projectId).catch(() => []),
      ])
      setData(proj)
      setIntent(intentData?.intent || null)
      setArtifacts(arts)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [projectId])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--muted)', fontSize: 13 }}>
        Loading project…
      </div>
    )
  }

  if (!data) {
    return <div style={{ color: '#f87171', padding: 24 }}>Project not found.</div>
  }

  const { project, stages, pipeline_stages } = data
  const complianceScope = (() => { try { return JSON.parse(project.compliance_scope || '[]') } catch { return [] } })()
  const techStack       = (() => { try { return JSON.parse(project.tech_stack || '[]') } catch { return [] } })()

  return (
    <div>
      {/* Back button + header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--muted2)', borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 13 }}>
          ← Projects
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{project.name}</h2>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span>{PATTERN_LABELS[project.pattern] || project.pattern}</span>
            {project.team && <><span>·</span><span>{project.team}</span></>}
            {complianceScope.map(c => <Badge key={c} label={c} color="#ef4444" />)}
            {techStack.slice(0, 3).map(t => <Badge key={t} label={t} color="#22c55e" />)}
          </div>
        </div>
        <Badge
          label={project.status}
          color={project.status === 'active' ? '#22c55e' : project.status === 'failed' ? '#ef4444' : '#6366f1'}
        />
      </div>

      {/* Summary strip */}
      {project.description && (
        <div style={{ padding: '10px 16px', borderRadius: 10, background: 'var(--panel2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted2)', lineHeight: 1.6, marginBottom: 20 }}>
          {project.description}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <TAB label="📋 Timeline"    active={tab === 'timeline'}  onClick={() => setTab('timeline')} />
        <TAB label="🧠 Intent"      active={tab === 'intent'}    onClick={() => setTab('intent')} />
        <TAB label="📦 Artifacts"   active={tab === 'artifacts'} onClick={() => setTab('artifacts')} />
      </div>

      {/* Tab content */}
      {tab === 'timeline' && (
        <StageTimeline
          project={project}
          stages={stages}
          pipelineStages={pipeline_stages}
          onRefresh={load}
        />
      )}

      {tab === 'intent' && (
        <IntentReviewPanel
          projectId={projectId}
          intent={intent}
          onUpdated={setIntent}
        />
      )}

      {tab === 'artifacts' && (
        <ArtifactViewer
          projectId={projectId}
          artifacts={artifacts}
        />
      )}
    </div>
  )
}
