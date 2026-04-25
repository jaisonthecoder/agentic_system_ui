/**
 * NewProjectWizard.jsx — 3-step wizard for creating a new AI Portal project.
 * Step 1: Upload BRD/HLD/ICD files + select pattern
 * Step 2: Review extracted structured intent
 * Step 3: Confirm project created
 */
import { useState, useRef } from 'react'
import { analyzeDocuments, fetchPatterns } from '../../api'
import IntentReviewPanel from './IntentReviewPanel'

const s = {
  overlay: {
    position: 'fixed', inset: 0, background: '#000a', zIndex: 300,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
  },
  modal: {
    background: 'var(--panel)', borderRadius: 16, width: '100%', maxWidth: 680,
    border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
    maxHeight: '90vh', overflow: 'hidden',
  },
  hdr: { padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 },
  body: { flex: 1, overflowY: 'auto', padding: 24 },
  foot: { padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' },
  btn:  (primary) => ({
    padding: '9px 22px', borderRadius: 9, border: primary ? 'none' : '1px solid var(--border)',
    background: primary ? 'var(--accent)' : 'transparent',
    color: primary ? '#000' : 'var(--muted2)', fontWeight: 700, cursor: 'pointer', fontSize: 13,
  }),
  field: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: 700, color: 'var(--muted)', display: 'block', marginBottom: 5, letterSpacing: 1.5, textTransform: 'uppercase' },
  input: {
    width: '100%', padding: '9px 12px', borderRadius: 8, background: 'var(--panel2)',
    border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, boxSizing: 'border-box',
  },
  dropzone: (drag) => ({
    border: `2px dashed ${drag ? 'var(--accent)' : 'var(--border)'}`,
    borderRadius: 12, padding: '32px 24px', textAlign: 'center', cursor: 'pointer',
    background: drag ? 'var(--accent-dim)' : 'var(--panel2)', transition: 'all .2s',
  }),
}

const COMPLIANCE_OPTIONS = ['NESA', 'GDPR', 'ISO-27001', 'PCI-DSS', 'Angola Data Residency', 'UAE PDPL']

export default function NewProjectWizard({ onClose, onCreated }) {
  const [step, setStep]           = useState(1)
  const [files, setFiles]         = useState([])
  const [projectName, setName]    = useState('')
  const [pattern, setPattern]     = useState('angular-mfe-dotnet-cqrs')
  const [team, setTeam]           = useState('')
  const [compliance, setCompliance] = useState([])
  const [patterns, setPatterns]   = useState([])
  const [drag, setDrag]           = useState(false)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [result, setResult]       = useState(null)
  const fileInputRef = useRef(null)

  // Load patterns once
  useState(() => {
    fetchPatterns().then(d => setPatterns(d.patterns || [])).catch(() => {})
  }, [])

  const addFiles = (newFiles) => {
    const valid = Array.from(newFiles).filter(f =>
      f.name.match(/\.(pdf|docx|doc|md|txt|rst)$/i)
    )
    setFiles(prev => {
      const existing = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !existing.has(f.name))]
    })
  }

  const handleDrop = (e) => {
    e.preventDefault(); setDrag(false)
    addFiles(e.dataTransfer.files)
  }

  const toggleCompliance = (opt) =>
    setCompliance(prev => prev.includes(opt) ? prev.filter(o => o !== opt) : [...prev, opt])

  const handleAnalyse = async () => {
    if (!files.length) { setError('Please upload at least one document.'); return }
    setLoading(true); setError('')
    try {
      const res = await analyzeDocuments(files, projectName, pattern, team, compliance)
      setResult(res)
      setStep(2)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = () => {
    setStep(3)
    onCreated && onCreated(result)
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.hdr}>
          <div style={{ fontSize: 20 }}>🏗️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>New AI Portal Project</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Step {step} of 3</div>
          </div>
          {/* Step indicators */}
          <div style={{ display: 'flex', gap: 6 }}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{
                width: 8, height: 8, borderRadius: '50%',
                background: n <= step ? 'var(--accent)' : 'var(--border)',
              }} />
            ))}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 22, cursor: 'pointer', padding: 0, marginLeft: 4 }}>×</button>
        </div>

        <div style={s.body}>
          {/* Step 1 — Upload */}
          {step === 1 && (
            <div>
              <div style={s.field}>
                <label style={s.label}>Project Name</label>
                <input
                  style={s.input} value={projectName}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Dangerous Goods Declaration"
                />
              </div>

              <div style={s.field}>
                <label style={s.label}>Upload Documents (BRD, HLD, ICD)</label>
                <div
                  style={s.dropzone(drag)}
                  onDragOver={e => { e.preventDefault(); setDrag(true) }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div style={{ fontSize: 28, marginBottom: 8 }}>📎</div>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>Drag & drop or click to browse</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>Supports PDF · Word (.docx) · Markdown · Text</div>
                  <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.doc,.md,.txt,.rst"
                    style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
                </div>
                {files.length > 0 && (
                  <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {files.map(f => (
                      <div key={f.name} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
                        borderRadius: 8, background: 'var(--panel2)', border: '1px solid var(--border)',
                      }}>
                        <span style={{ fontSize: 14 }}>📄</span>
                        <span style={{ flex: 1, fontSize: 12 }}>{f.name}</span>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>{(f.size / 1024).toFixed(0)} KB</span>
                        <button onClick={(e) => { e.stopPropagation(); setFiles(prev => prev.filter(ff => ff.name !== f.name)) }}
                          style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 16 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={s.field}>
                <label style={s.label}>Architecture Pattern</label>
                <select
                  style={{ ...s.input, cursor: 'pointer' }}
                  value={pattern} onChange={e => setPattern(e.target.value)}
                >
                  {patterns.length > 0
                    ? patterns.map(p => <option key={p.id} value={p.id}>{p.label}</option>)
                    : (
                      <>
                        <option value="angular-mfe-dotnet-cqrs">Angular MFE + .NET CQRS + PostgreSQL</option>
                        <option value="angular-mfe-dotnet-camunda">Angular MFE + .NET CQRS + Camunda BPM</option>
                        <option value="dotnet-microservices-rabbitmq">.NET Microservices + RabbitMQ</option>
                        <option value="dotnet-api-only">.NET REST API (no frontend)</option>
                        <option value="legacy-migration">Legacy System Migration</option>
                      </>
                    )
                  }
                </select>
              </div>

              <div style={s.field}>
                <label style={s.label}>Team</label>
                <input style={s.input} value={team} onChange={e => setTeam(e.target.value)} placeholder="e.g. Platform Engineering" />
              </div>

              <div style={s.field}>
                <label style={s.label}>Compliance Scope</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {COMPLIANCE_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => toggleCompliance(opt)}
                      style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer',
                        border: `1px solid ${compliance.includes(opt) ? '#ef4444' : 'var(--border)'}`,
                        background: compliance.includes(opt) ? '#ef444422' : 'transparent',
                        color: compliance.includes(opt) ? '#f87171' : 'var(--muted2)',
                        fontWeight: compliance.includes(opt) ? 700 : 400,
                      }}
                    >{opt}</button>
                  ))}
                </div>
              </div>

              {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{error}</div>}
            </div>
          )}

          {/* Step 2 — Review Intent */}
          {step === 2 && result && (
            <div>
              <div style={{ padding: '8px 14px', borderRadius: 8, background: '#1a3a1a', border: '1px solid #22c55e', marginBottom: 18, fontSize: 12, color: '#86efac' }}>
                ✓ Intent extracted from {result.files_processed?.length || 0} file(s) in {result.confidence ? `${Math.round(result.confidence * 100)}% confidence` : 'high confidence'}. Review and edit below, then approve to create the project.
              </div>
              <IntentReviewPanel
                projectId={result.project_id}
                intent={result.intent}
                onUpdated={(updated) => setResult(r => ({ ...r, intent: updated }))}
              />
            </div>
          )}

          {/* Step 3 — Done */}
          {step === 3 && result && (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Project Created</div>
              <div style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 24 }}>
                "{result.intent?.project_name || 'New Project'}" is ready.<br />
                Stage 1 (Intent Extraction) is awaiting your approval.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320, margin: '0 auto' }}>
                <div style={{ padding: 10, borderRadius: 8, background: 'var(--panel2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted2)' }}>
                  Project ID: <span style={{ fontFamily: 'monospace', color: 'var(--text)' }}>{result.project_id}</span>
                </div>
                <div style={{ padding: 10, borderRadius: 8, background: 'var(--panel2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted2)' }}>
                  Pattern: <span style={{ color: 'var(--text)' }}>{pattern}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={s.foot}>
          {step === 1 && (
            <>
              <button style={s.btn(false)} onClick={onClose}>Cancel</button>
              <button style={s.btn(true)} onClick={handleAnalyse} disabled={loading || !files.length}>
                {loading ? '⏳ Analysing…' : '🔍 Analyse Documents →'}
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <button style={s.btn(false)} onClick={() => setStep(1)}>← Back</button>
              <button style={s.btn(true)} onClick={handleConfirm}>✓ Approve & Create Project →</button>
            </>
          )}
          {step === 3 && (
            <button style={s.btn(true)} onClick={onClose}>View Projects →</button>
          )}
        </div>
      </div>
    </div>
  )
}
