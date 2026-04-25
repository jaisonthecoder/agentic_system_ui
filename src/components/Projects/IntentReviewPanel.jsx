/**
 * IntentReviewPanel.jsx — Display and edit the structured intent extracted from BRD/HLD.
 */
import { useState } from 'react'
import { updateProjectIntent } from '../../api'

const TAG = ({ label, color = 'var(--accent)' }) => (
  <span style={{
    display: 'inline-block', padding: '2px 10px', borderRadius: 20, fontSize: 11,
    fontWeight: 600, background: color + '22', color, border: `1px solid ${color}55`,
    margin: '2px 3px 2px 0',
  }}>{label}</span>
)

const Section = ({ title, icon, children }) => (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 6 }}>
      {icon} {title}
    </div>
    {children}
  </div>
)

export default function IntentReviewPanel({ projectId, intent, onUpdated }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm]       = useState(null)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  if (!intent) return <div style={{ color: 'var(--muted)', fontSize: 13 }}>No intent extracted yet.</div>

  const startEdit = () => {
    setForm({
      project_name: intent.project_name || '',
      bounded_contexts: (intent.bounded_contexts || []).join(', '),
      user_roles: (intent.user_roles || []).join(', '),
      compliance_scope: (intent.compliance_scope || []).join(', '),
      tech_stack_hints: (intent.tech_stack_hints || []).join(', '),
    })
    setEditing(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        project_name: form.project_name,
        bounded_contexts: form.bounded_contexts.split(',').map(s => s.trim()).filter(Boolean),
        user_roles: form.user_roles.split(',').map(s => s.trim()).filter(Boolean),
        compliance_scope: form.compliance_scope.split(',').map(s => s.trim()).filter(Boolean),
        tech_stack_hints: form.tech_stack_hints.split(',').map(s => s.trim()).filter(Boolean),
      }
      const result = await updateProjectIntent(projectId, payload)
      setMsg('✓ Intent updated')
      setEditing(false)
      onUpdated && onUpdated(result.intent)
      setTimeout(() => setMsg(''), 2500)
    } catch (e) {
      setMsg(`Error: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const confidence = intent.confidence ?? 1.0
  const confColor = confidence > 0.7 ? '#22c55e' : confidence > 0.4 ? '#f59e0b' : '#ef4444'

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{intent.project_name || 'Untitled Project'}</div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>
            Confidence:&nbsp;
            <span style={{ color: confColor, fontWeight: 700 }}>{Math.round(confidence * 100)}%</span>
            {intent.source_files?.length > 0 && ` · ${intent.source_files.join(', ')}`}
          </div>
        </div>
        {!editing && (
          <button onClick={startEdit} style={{
            padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
          }}>✏️ Edit</button>
        )}
      </div>

      {intent.raw_summary && (
        <div style={{ padding: 12, borderRadius: 10, background: 'var(--panel2)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--muted2)', marginBottom: 16, lineHeight: 1.6 }}>
          {intent.raw_summary}
        </div>
      )}

      {!editing ? (
        <>
          <Section title="Bounded Contexts" icon="🏛️">
            {(intent.bounded_contexts || []).map(bc => <TAG key={bc} label={bc} color="#6366f1" />)}
            {!intent.bounded_contexts?.length && <span style={{ fontSize: 12, color: 'var(--muted)' }}>None identified</span>}
          </Section>

          <Section title="System Integrations" icon="🔌">
            {(intent.integrations || []).map((int, i) => (
              <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, margin: '2px 4px 2px 0', padding: '3px 10px', borderRadius: 20, background: '#0e3a5e', border: '1px solid #3b82f6', fontSize: 11 }}>
                <span style={{ fontWeight: 700, color: '#93c5fd' }}>{int.name || int}</span>
                {int.type && <span style={{ color: '#60a5fa' }}>· {int.type}</span>}
                {int.protocol && <span style={{ color: '#93c5fd77' }}>· {int.protocol}</span>}
              </div>
            ))}
            {!intent.integrations?.length && <span style={{ fontSize: 12, color: 'var(--muted)' }}>None identified</span>}
          </Section>

          <Section title="User Roles" icon="👥">
            {(intent.user_roles || []).map(r => <TAG key={r} label={r} color="#8b5cf6" />)}
            {!intent.user_roles?.length && <span style={{ fontSize: 12, color: 'var(--muted)' }}>None identified</span>}
          </Section>

          <Section title="Non-Functional Requirements" icon="⚡">
            {(intent.nfrs || []).map((nfr, i) => (
              <div key={i} style={{ fontSize: 12, padding: '4px 0', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                <span style={{ color: '#f59e0b', fontWeight: 600, minWidth: 100 }}>{nfr.category || 'NFR'}</span>
                <span style={{ color: 'var(--muted2)' }}>{nfr.description || nfr.value || String(nfr)}</span>
              </div>
            ))}
            {!intent.nfrs?.length && <span style={{ fontSize: 12, color: 'var(--muted)' }}>None identified</span>}
          </Section>

          <div style={{ display: 'flex', gap: 20 }}>
            <div style={{ flex: 1 }}>
              <Section title="Compliance Scope" icon="🛡️">
                {(intent.compliance_scope || []).map(c => <TAG key={c} label={c} color="#ef4444" />)}
                {!intent.compliance_scope?.length && <span style={{ fontSize: 12, color: 'var(--muted)' }}>None declared</span>}
              </Section>
            </div>
            <div style={{ flex: 1 }}>
              <Section title="Tech Stack Hints" icon="🔧">
                {(intent.tech_stack_hints || []).map(t => <TAG key={t} label={t} color="#22c55e" />)}
                {!intent.tech_stack_hints?.length && <span style={{ fontSize: 12, color: 'var(--muted)' }}>None identified</span>}
              </Section>
            </div>
          </div>
        </>
      ) : (
        /* Edit form */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { key: 'project_name', label: 'Project Name', placeholder: 'Dangerous Goods Declaration' },
            { key: 'bounded_contexts', label: 'Bounded Contexts (comma-separated)', placeholder: 'Declaration, Classification, Settlement' },
            { key: 'user_roles', label: 'User Roles (comma-separated)', placeholder: 'cargo_operator, authority_officer, auditor' },
            { key: 'compliance_scope', label: 'Compliance Scope (comma-separated)', placeholder: 'NESA, GDPR' },
            { key: 'tech_stack_hints', label: 'Tech Stack (comma-separated)', placeholder: '.NET 9, Angular, PostgreSQL, Camunda' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>{label}</label>
              <input
                value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8, fontSize: 12,
                  background: 'var(--panel)', border: '1px solid var(--border)', color: 'var(--text)',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          ))}
          {msg && <div style={{ fontSize: 12, color: msg.startsWith('Error') ? '#f87171' : '#86efac' }}>{msg}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleSave} disabled={saving} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: 'var(--accent)', color: '#000', fontWeight: 700, fontSize: 13,
            }}>{saving ? 'Saving…' : 'Save Changes'}</button>
            <button onClick={() => setEditing(false)} style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--muted2)', cursor: 'pointer', fontSize: 13,
            }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}
