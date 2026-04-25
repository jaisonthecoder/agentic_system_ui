/**
 * StageTimeline.jsx — Visual project pipeline stage tracker
 * Shows all PIPELINE_STAGES with status indicators and timestamps.
 */
import { useState } from 'react'
import { approveProjectStage, rejectProjectStage } from '../../api'

const STAGE_LABELS = {
  intent_extraction:   { label: 'Intent Extraction',   icon: '📄', desc: 'BRD/HLD documents analysed' },
  standards_retrieval: { label: 'Standards Retrieval', icon: '📚', desc: 'AD Ports skills & specs consulted' },
  proposal_generation: { label: 'Architecture Proposal',icon: '🏛️', desc: 'Architecture proposal drafted' },
  human_review:        { label: 'Human Review',         icon: '👤', desc: 'Tech lead approval required' },
  delegation:          { label: 'Delegation',           icon: '🔀', desc: 'Work packages dispatched to agents' },
  parallel_execution:  { label: 'Parallel Execution',   icon: '⚡', desc: 'Specialist agents running concurrently' },
  consolidation:       { label: 'Consolidation',        icon: '🔗', desc: 'Results collected & validated' },
  handover:            { label: 'Handover',             icon: '🎁', desc: 'Artifact bundle published to team' },
}

const STATUS_COLORS = {
  approved:        { bg: '#1a3a1a', border: '#22c55e', dot: '#22c55e', text: '#86efac' },
  running:         { bg: '#1a2a3a', border: '#3b82f6', dot: '#60a5fa', text: '#93c5fd' },
  awaiting_review: { bg: '#2a2a1a', border: '#f59e0b', dot: '#fbbf24', text: '#fde68a' },
  pending:         { bg: 'var(--panel2)', border: 'var(--border)', dot: 'var(--muted)', text: 'var(--muted)' },
  failed:          { bg: '#3a1a1a', border: '#ef4444', dot: '#f87171', text: '#fca5a5' },
}

function fmtDate(ts) {
  if (!ts) return ''
  return new Date(ts * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function StageTimeline({ project, stages, pipelineStages, onRefresh }) {
  const [approving, setApproving] = useState(false)
  const [comment, setComment]   = useState('')
  const [msg, setMsg]           = useState('')

  const currentStage = project?.current_stage || 'intent_extraction'
  const currentIdx   = (pipelineStages || []).indexOf(currentStage)

  // Build a map from stage_name → stage record
  const stageMap = {}
  ;(stages || []).forEach(s => { stageMap[s.stage_name] = s })

  const handleApprove = async () => {
    setApproving(true)
    try {
      await approveProjectStage(project.id, comment)
      setMsg('✓ Stage approved — advancing to next stage')
      setComment('')
      setTimeout(() => { setMsg(''); onRefresh && onRefresh() }, 2000)
    } catch (e) {
      setMsg(`Error: ${e.message}`)
    } finally {
      setApproving(false)
    }
  }

  const handleReject = async () => {
    if (!comment.trim()) { setMsg('Please add a comment before rejecting'); return }
    setApproving(true)
    try {
      await rejectProjectStage(project.id, comment)
      setMsg('↩ Stage rejected — returned to previous stage')
      setComment('')
      setTimeout(() => { setMsg(''); onRefresh && onRefresh() }, 2000)
    } catch (e) {
      setMsg(`Error: ${e.message}`)
    } finally {
      setApproving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {(pipelineStages || []).map((stageName, idx) => {
        const meta   = STAGE_LABELS[stageName] || { label: stageName, icon: '○', desc: '' }
        const record = stageMap[stageName]
        const isCurrent = stageName === currentStage
        const isPast    = idx < currentIdx
        const isFuture  = idx > currentIdx

        let status = 'pending'
        if (isPast) status = 'approved'
        else if (isCurrent) status = project?.status === 'active' ? 'running' : (project?.status || 'running')
        if (record) status = record.status

        const colors = STATUS_COLORS[status] || STATUS_COLORS.pending

        return (
          <div key={stageName} style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
            {/* Connector line + dot */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 32, flexShrink: 0 }}>
              <div style={{ width: 2, height: 12, background: idx === 0 ? 'transparent' : (isPast ? '#22c55e' : 'var(--border)') }} />
              <div style={{
                width: 14, height: 14, borderRadius: '50%',
                background: colors.dot,
                border: `2px solid ${isCurrent ? colors.border : 'transparent'}`,
                boxShadow: isCurrent ? `0 0 0 3px ${colors.border}33` : 'none',
                flexShrink: 0,
              }} />
              <div style={{ width: 2, flex: 1, minHeight: 12, background: isPast ? '#22c55e' : 'var(--border)', opacity: idx === (pipelineStages?.length || 0) - 1 ? 0 : 1 }} />
            </div>

            {/* Stage card */}
            <div style={{
              flex: 1, marginLeft: 12, marginBottom: 4,
              padding: '12px 14px', borderRadius: 10,
              background: colors.bg,
              border: `1px solid ${isCurrent ? colors.border : 'var(--border)'}`,
              opacity: isFuture ? 0.55 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{meta.icon}</span>
                <span style={{ fontWeight: 700, fontSize: 13 }}>{meta.label}</span>
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px',
                  borderRadius: 20, background: colors.border + '33', color: colors.text,
                  textTransform: 'uppercase', letterSpacing: 1,
                }}>{status.replace(/_/g, ' ')}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>{meta.desc}</div>
              {record?.created_at && (
                <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 4 }}>
                  {fmtDate(record.created_at)}
                  {record.entered_by && ` · ${record.entered_by}`}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Approval panel for human_review or pending stages */}
      {project && currentStage === 'intent_extraction' && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: '#1a2a3a', border: '1px solid #3b82f6' }}>
          <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 8, color: '#93c5fd' }}>
            👤 Review & Approve Intent
          </div>
          <textarea
            value={comment} onChange={e => setComment(e.target.value)}
            placeholder="Optional: add a comment or note before approving…"
            style={{
              width: '100%', minHeight: 60, padding: 8, borderRadius: 8, fontSize: 12,
              background: 'var(--panel)', border: '1px solid var(--border)',
              color: 'var(--text)', resize: 'vertical', boxSizing: 'border-box',
            }}
          />
          {msg && <div style={{ fontSize: 12, color: '#86efac', marginTop: 6 }}>{msg}</div>}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={handleApprove} disabled={approving} style={{
              flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: '#22c55e', color: '#000', fontWeight: 700, fontSize: 13,
            }}>
              {approving ? 'Processing…' : '✓ Approve & Advance'}
            </button>
            <button onClick={handleReject} disabled={approving} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid #ef4444',
              background: 'transparent', color: '#f87171', fontWeight: 700, cursor: 'pointer', fontSize: 13,
            }}>
              ↩ Reject
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
