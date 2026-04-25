/**
 * ArtifactViewer.jsx — Display versioned artifact content for a project stage.
 */
import { useState } from 'react'
import { fetchArtifact } from '../../api'

function fmtDate(ts) {
  return ts ? new Date(ts * 1000).toLocaleString('en-GB') : ''
}

export default function ArtifactViewer({ projectId, artifacts }) {
  const [selected, setSelected] = useState(null)
  const [detail, setDetail]     = useState(null)
  const [loading, setLoading]   = useState(false)

  const ARTIFACT_ICONS = {
    structured_intent: '🧠',
    raw_text:          '📄',
    proposal:          '🏛️',
    agent_output:      '🤖',
    pipeline_yaml:     '🚀',
    helm_chart:        '⛵',
    playwright:        '🎭',
    default:           '📦',
  }

  const handleSelect = async (art) => {
    setSelected(art.id)
    setLoading(true)
    try {
      const result = await fetchArtifact(projectId, art.id)
      setDetail(result.artifact)
    } catch (e) {
      setDetail({ error: e.message })
    } finally {
      setLoading(false)
    }
  }

  if (!artifacts?.length) {
    return <div style={{ fontSize: 13, color: 'var(--muted)', padding: 16 }}>No artifacts yet.</div>
  }

  const displayArtifacts = artifacts.filter(a => a.artifact_type !== 'raw_text')

  return (
    <div style={{ display: 'flex', gap: 16, height: 360 }}>
      {/* List */}
      <div style={{ width: 200, flexShrink: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {displayArtifacts.map(art => (
          <button
            key={art.id}
            onClick={() => handleSelect(art)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
              borderRadius: 8, border: `1px solid ${selected === art.id ? 'var(--accent)' : 'var(--border)'}`,
              background: selected === art.id ? 'var(--accent-dim)' : 'transparent',
              cursor: 'pointer', textAlign: 'left', width: '100%',
            }}
          >
            <span style={{ fontSize: 14 }}>{ARTIFACT_ICONS[art.artifact_type] || ARTIFACT_ICONS.default}</span>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: selected === art.id ? 'var(--accent)' : 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {art.artifact_type.replace(/_/g, ' ')}
              </div>
              <div style={{ fontSize: 10, color: 'var(--muted)' }}>v{art.version}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Detail pane */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, borderRadius: 10, background: 'var(--panel2)', border: '1px solid var(--border)' }}>
        {loading && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Loading…</div>}
        {!loading && !detail && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Select an artifact to view its content.</div>}
        {!loading && detail && !detail.error && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 12 }}>
              {detail.artifact_type} · v{detail.version} · {fmtDate(detail.created_at)}
              {detail.created_by && ` · by ${detail.created_by}`}
            </div>
            {detail.content_text && (
              <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--muted2)', marginBottom: 12, background: 'var(--panel)', padding: 10, borderRadius: 8 }}>
                {detail.content_text.slice(0, 2000)}{detail.content_text.length > 2000 ? '\n…(truncated)' : ''}
              </pre>
            )}
            {detail.content && Object.keys(detail.content).length > 0 && (
              <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: 'var(--accent)', background: 'var(--panel)', padding: 10, borderRadius: 8 }}>
                {JSON.stringify(detail.content, null, 2).slice(0, 4000)}
              </pre>
            )}
          </div>
        )}
        {!loading && detail?.error && (
          <div style={{ color: '#f87171', fontSize: 12 }}>Error: {detail.error}</div>
        )}
      </div>
    </div>
  )
}
