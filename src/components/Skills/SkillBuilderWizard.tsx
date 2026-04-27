/**
 * SkillBuilderWizard.tsx
 *
 * 5-path skill creation wizard (exact original functionality, Atelier styled):
 *   📄 From Document  → POST /api/v1/store/build/from-document
 *   🔗 From OpenAPI   → POST /api/v1/store/build/from-openapi
 *   ✨ AI Generate    → POST /api/v1/store/build/from-description
 *   🖱 Manual Form    → POST /api/v1/store/build/from-form
 *   🐍 Python Code    → POST /api/v1/store/build/from-python
 *
 * Flow: Choose method → Fill input → Preview extracted skills → Install → Done
 */
import { useState } from 'react'
import {
  buildFromDocument, buildFromOpenAPI, buildFromDescription,
  buildFromForm, buildFromPython, installPreview,
} from '../../api'
import type { SkillPreviewRecord } from '../../api'
import styles from './SkillBuilderWizard.module.scss'

const METHODS = [
  { id: 'doc',    icon: '📄', label: 'From Document', desc: '.md · .txt · paste any text' },
  { id: 'openapi',icon: '🔗', label: 'From OpenAPI',  desc: 'YAML/JSON spec — no LLM needed' },
  { id: 'ai',     icon: '✨', label: 'AI Generate',   desc: 'Describe in plain English' },
  { id: 'form',   icon: '🖱', label: 'Manual Form',   desc: 'Fill every field yourself' },
  { id: 'python', icon: '🐍', label: 'Python Code',   desc: 'Write a real @skill function' },
]

const PARAM_TYPES = ['string', 'integer', 'boolean', 'array', 'object']
const IMPL_TYPES  = ['echo', 'prompt', 'http']
const CATEGORIES  = ['custom', 'developer-tools', 'communication', 'data', 'ai', 'cloud']

const DEFAULT_PY = `import asyncio
from src.layer3_skills.registry import skill

@skill(
    name="my_skill",
    description="Describe what this skill does.",
    category="custom",
    icon="⚙️",
)
async def my_skill(input: str) -> str:
    """Replace this with your real logic."""
    return f"Result for: {input}"
`

interface Props {
  onClose: () => void
  onInstalled: () => void
}

// ── Method pick grid ──────────────────────────────────────────────────────────
function StepPick({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className={styles.methods}>
      {METHODS.map((m) => (
        <button key={m.id} className={styles.mCard} onClick={() => onPick(m.id)}>
          <div className={styles.mIcon}>{m.icon}</div>
          <div className={styles.mLabel}>{m.label}</div>
          <div className={styles.mDesc}>{m.desc}</div>
        </button>
      ))}
    </div>
  )
}

// ── Preview step ──────────────────────────────────────────────────────────────
function PreviewStep({
  records, selected, onToggle, onInstall, installing, onBack,
}: {
  records: SkillPreviewRecord[]
  selected: Set<number>
  onToggle: (i: number) => void
  onInstall: () => void
  installing: boolean
  onBack: () => void
}) {
  return (
    <>
      <div className={styles.previewIntro}>
        Found <strong>{records.length}</strong> skill{records.length !== 1 ? 's' : ''}. Select which to install:
      </div>
      {records.map((r, i) => (
        <div
          key={r.name}
          className={`${styles.previewCard}${selected.has(i) ? ` ${styles.previewCardSel}` : ''}`}
          onClick={() => onToggle(i)}
        >
          <div className={styles.previewRow}>
            <input type="checkbox" className={styles.previewChk} checked={selected.has(i)} readOnly />
            <span className={styles.previewName}>{r.icon ?? '⚙️'} {r.name}</span>
            <span className={styles.previewSrc}>{r.source_type ?? 'python'}</span>
          </div>
          {r.description && <div className={styles.previewDesc}>{r.description}</div>}
          {(r.parameters ?? []).length > 0 && (
            <div className={styles.previewParams}>
              {(r.parameters ?? []).map((p) => (
                <span key={p.name} className={styles.paramChip}>{p.name}: {p.type ?? 'string'}</span>
              ))}
            </div>
          )}
        </div>
      ))}
      <div className={styles.previewFtr}>
        <button className={styles.btnSecondary} onClick={onBack}>← Back</button>
        <button className={styles.btnPrimary} onClick={onInstall} disabled={installing || selected.size === 0}>
          {installing ? 'Installing…' : `Install ${selected.size} skill${selected.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────
export default function SkillBuilderWizard({ onClose, onInstalled }: Props) {
  const [step,       setStep]       = useState<'pick' | 'input' | 'preview' | 'done'>('pick')
  const [method,     setMethod]     = useState<string | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [preview,    setPreview]    = useState<SkillPreviewRecord[]>([])
  const [selected,   setSelected]   = useState<Set<number>>(new Set())
  const [installing, setInstalling] = useState(false)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Per-method input state
  const [docContent,  setDocContent]  = useState('')
  const [docFiles,    setDocFiles]    = useState<Array<{ name: string; content: string }>>([])
  const [openApiSpec, setOpenApiSpec] = useState('')
  const [pyCode,      setPyCode]      = useState(DEFAULT_PY)
  const [aiDesc,      setAiDesc]      = useState('')
  const [formData,    setFormData]    = useState({
    name: '', description: '', category: 'custom', icon: '⚙️',
    implementation_type: 'echo', connector_id: '', system_prompt: '', method: 'POST', path: '',
  })
  const [formParams, setFormParams] = useState<Array<{ name: string; type: string; required: boolean; desc: string }>>([])

  const pickMethod = (m: string) => { setMethod(m); setStep('input'); setError(null) }
  const goBack = () => { setStep(step === 'preview' ? 'input' : 'pick'); setError(null) }

  const handleFileRead = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files ?? []).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => {
        setDocFiles((prev) => {
          if (prev.some((f) => f.name === file.name)) return prev
          return [...prev, { name: file.name, content: ev.target?.result as string ?? '' }]
        })
      }
      reader.readAsText(file)
    })
    e.target.value = ''
  }

  const toggleSelect = (i: number) => {
    setSelected((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n })
  }

  const analyse = async () => {
    setLoading(true); setError(null)
    try {
      if (method === 'doc') {
        const fileParts = docFiles.map((f) => `\n\n--- File: ${f.name} ---\n${f.content}`).join('')
        const combined = (fileParts + '\n\n' + docContent).trim()
        if (!combined) { setError('Upload at least one file or paste content.'); setLoading(false); return }
        const result = await buildFromDocument(combined, docFiles[0]?.name ?? 'document.md')
        const records = result.preview ?? []
        if (!records.length) { setError('No skills extracted. Try different input.'); setLoading(false); return }
        setPreview(records); setSelected(new Set(records.map((_, i) => i))); setStep('preview')

      } else if (method === 'openapi') {
        if (!openApiSpec.trim()) { setError('Paste the OpenAPI spec.'); setLoading(false); return }
        const result = await buildFromOpenAPI(openApiSpec.trim())
        const records = result.preview ?? []
        if (!records.length) { setError('No endpoints found.'); setLoading(false); return }
        setPreview(records); setSelected(new Set(records.map((_, i) => i))); setStep('preview')

      } else if (method === 'ai') {
        if (!aiDesc.trim()) { setError('Enter a description.'); setLoading(false); return }
        const result = await buildFromDescription(aiDesc.trim())
        const records = result.preview ?? []
        if (!records.length) { setError('Could not generate skills. Try a more specific description.'); setLoading(false); return }
        setPreview(records); setSelected(new Set(records.map((_, i) => i))); setStep('preview')

      } else if (method === 'form') {
        if (!formData.name.trim()) { setError('Skill name is required.'); setLoading(false); return }
        const params = formParams.map((p) => ({ name: p.name, type: p.type, required: p.required, description: p.desc }))
        const result = await buildFromForm({ ...formData, parameters: params })
        if (result.preview) { await installPreview(result.preview); setSuccessMsg(`✓ Installed: ${result.preview.map((s) => s.name).join(', ')}`) }
        setLoading(false); setStep('done'); return

      } else if (method === 'python') {
        if (!pyCode.trim()) { setError('Code is empty.'); setLoading(false); return }
        const result = await buildFromPython(pyCode)
        setSuccessMsg(`✓ ${result.message ?? 'Skill installed'}`); setLoading(false); setStep('done'); return
      }
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    setLoading(false)
  }

  const install = async () => {
    setInstalling(true)
    try {
      const toInstall = preview.filter((_, i) => selected.has(i))
      const result = await installPreview(toInstall)
      setSuccessMsg(`✓ Installed ${result.installed ?? toInstall.length} skill${(result.installed ?? toInstall.length) !== 1 ? 's' : ''}`)
      setStep('done')
    } catch (e) { setError(e instanceof Error ? e.message : String(e)) }
    setInstalling(false)
  }

  const addParam    = () => setFormParams((p) => [...p, { name: '', type: 'string', required: true, desc: '' }])
  const setParam    = (i: number, k: string, v: unknown) => setFormParams((p) => p.map((x, j) => j === i ? { ...x, [k]: v } : x))
  const removeParam = (i: number) => setFormParams((p) => p.filter((_, j) => j !== i))
  const setF        = (k: string, v: unknown) => setFormData((p) => ({ ...p, [k]: v }))

  const currentMethod = METHODS.find((m) => m.id === method)

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.hdr}>
          <div className={styles.hdrTitle}>
            {step === 'pick'    && '✨ Create Skill'}
            {step === 'input'   && `${currentMethod?.icon ?? ''} ${currentMethod?.label ?? ''}`}
            {step === 'preview' && '📋 Preview Extracted Skills'}
            {step === 'done'    && '🎉 Done'}
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Body */}
        <div className={styles.body}>
          {error      && <div className={styles.errorBox}>⚠ {error}</div>}
          {successMsg && <div className={styles.successBox}>{successMsg}</div>}

          {step === 'pick' && <StepPick onPick={pickMethod} />}

          {step === 'done' && (
            <div className={styles.doneCenter}>
              <div className={styles.doneEmoji}>🎉</div>
              <div className={styles.doneTitle}>{successMsg}</div>
              <div className={styles.doneSub}>Skills are now live — agents can use them immediately.</div>
            </div>
          )}

          {/* Document */}
          {step === 'input' && method === 'doc' && (<>
            <div className={styles.field}>
              <label className={styles.label}>Upload files (.md · .txt · .pdf · .rst) — multiple allowed</label>
              <input type="file" accept=".md,.txt,.pdf,.rst" multiple className={styles.fileInput} onChange={handleFileRead} />
              {docFiles.length > 0 && (
                <div className={styles.fileChips}>
                  {docFiles.map((f) => (
                    <span key={f.name} className={styles.fileChip}>
                      📄 {f.name}
                      <button onClick={() => setDocFiles((p) => p.filter((x) => x.name !== f.name))} className={styles.fileChipRemove}>✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.field}>
              <label className={styles.label}>— or paste content directly —</label>
              <textarea className={styles.textarea}
                placeholder={'# API Reference\n## Create User\nPOST /users\n...'}
                value={docContent} onChange={(e) => setDocContent(e.target.value)} rows={8} />
            </div>
            {docFiles.length > 0 && <div className={styles.hint}>✓ {docFiles.length} file(s) loaded — all combined and analysed.</div>}
            <div className={styles.muted}>Uses whichever LLM is configured in your .env (Anthropic / OpenAI / Ollama).</div>
          </>)}

          {/* OpenAPI */}
          {step === 'input' && method === 'openapi' && (<>
            <div className={styles.field}>
              <label className={styles.label}>OpenAPI 3.x spec (JSON or YAML)</label>
              <textarea className={styles.textarea}
                placeholder={'{\n  "openapi": "3.0.0",\n  "paths": { ... }\n}'}
                value={openApiSpec} onChange={(e) => setOpenApiSpec(e.target.value)} rows={12} />
            </div>
            <div className={styles.muted}>Fully deterministic — no LLM. One skill per endpoint generated automatically.</div>
          </>)}

          {/* AI Generate */}
          {step === 'input' && method === 'ai' && (<>
            <div className={styles.field}>
              <label className={styles.label}>Describe the skill in plain English</label>
              <textarea className={`${styles.textarea} ${styles.textareaLg}`}
                placeholder="e.g. 'A skill that takes a customer ID and returns their last 5 orders from our Postgres database'"
                value={aiDesc} onChange={(e) => setAiDesc(e.target.value)} rows={4} />
            </div>
            <div className={styles.muted}>Uses whichever LLM is configured in your .env — Anthropic Claude, OpenAI, or Ollama.</div>
          </>)}

          {/* Python Code */}
          {step === 'input' && method === 'python' && (<>
            <div className={styles.field}>
              <label className={styles.label}>Python skill code</label>
              <textarea
                className={`${styles.textarea} ${styles.codeArea}`}
                spellCheck={false}
                value={pyCode}
                onChange={(e) => setPyCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault()
                    const start = e.currentTarget.selectionStart
                    const val = e.currentTarget.value
                    setPyCode(val.slice(0, start) + '    ' + val.slice(e.currentTarget.selectionEnd))
                    requestAnimationFrame(() => { e.currentTarget.selectionStart = e.currentTarget.selectionEnd = start + 4 })
                  }
                }}
                rows={14}
              />
            </div>
            <div className={styles.muted}>
              Use <code className={styles.code}>@skill(name=..., description=...)</code> decorator.
              Saved to <code className={styles.code}>src/layer3_skills/user_skills/</code> — hot-loaded, no restart needed.
            </div>
          </>)}

          {/* Manual Form */}
          {step === 'input' && method === 'form' && (<>
            <div className={styles.field}>
              <label className={styles.label}>Skill Name (snake_case)</label>
              <input className={styles.input} placeholder="my_skill_name" value={formData.name}
                onChange={(e) => setF('name', e.target.value)} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Description</label>
              <input className={styles.input} placeholder="What does this skill do?" value={formData.description}
                onChange={(e) => setF('description', e.target.value)} />
            </div>
            <div className={styles.formRow}>
              <div className={`${styles.field} ${styles.iconField}`}>
                <label className={styles.label}>Icon</label>
                <input className={styles.input} value={formData.icon} onChange={(e) => setF('icon', e.target.value)} style={{ textAlign: 'center' }} />
              </div>
              <div className={`${styles.field} ${styles.fieldFlex}`}>
                <label className={styles.label}>Category</label>
                <select className={styles.input} value={formData.category} onChange={(e) => setF('category', e.target.value)}>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Implementation Type</label>
              <div className={styles.implRow}>
                {IMPL_TYPES.map((t) => (
                  <button key={t}
                    className={`${styles.implBtn}${formData.implementation_type === t ? ` ${styles.implBtnActive}` : ''}`}
                    onClick={() => setF('implementation_type', t)}>{t}</button>
                ))}
              </div>
            </div>
            {formData.implementation_type === 'http' && (<>
              <div className={styles.field}>
                <label className={styles.label}>Connector ID</label>
                <input className={styles.input} placeholder="connector_id from Connectors view"
                  value={formData.connector_id} onChange={(e) => setF('connector_id', e.target.value)} />
              </div>
              <div className={styles.formRow}>
                <div className={`${styles.field} ${styles.methodField}`}>
                  <label className={styles.label}>Method</label>
                  <select className={styles.input} value={formData.method} onChange={(e) => setF('method', e.target.value)}>
                    {['GET', 'POST', 'PUT', 'DELETE'].map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div className={`${styles.field} ${styles.fieldFlex}`}>
                  <label className={styles.label}>Path</label>
                  <input className={styles.input} placeholder="/api/v1/resource" value={formData.path}
                    onChange={(e) => setF('path', e.target.value)} />
                </div>
              </div>
            </>)}
            {formData.implementation_type === 'prompt' && (
              <div className={styles.field}>
                <label className={styles.label}>System Prompt</label>
                <textarea className={styles.textarea} rows={4}
                  placeholder="You are a helpful assistant that…"
                  value={formData.system_prompt} onChange={(e) => setF('system_prompt', e.target.value)} />
              </div>
            )}
            <div className={styles.field}>
              <div className={styles.paramsHdr}>
                <label className={styles.label} style={{ margin: 0 }}>Parameters</label>
                <button className={styles.addParamBtn} onClick={addParam}>+ Add</button>
              </div>
              {formParams.map((p, i) => (
                <div key={i} className={styles.paramRow}>
                  <input className={styles.paramInput} placeholder="name" value={p.name}
                    onChange={(e) => setParam(i, 'name', e.target.value)} />
                  <select className={styles.paramSelect} value={p.type} onChange={(e) => setParam(i, 'type', e.target.value)}>
                    {PARAM_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <input className={`${styles.paramInput} ${styles.paramInputWide}`} placeholder="description" value={p.desc}
                    onChange={(e) => setParam(i, 'desc', e.target.value)} />
                  <label className={styles.paramReqLabel}>
                    <input type="checkbox" checked={p.required}
                      onChange={(e) => setParam(i, 'required', e.target.checked)} />
                    req
                  </label>
                  <button className={styles.removeParamBtn} onClick={() => removeParam(i)}>✕</button>
                </div>
              ))}
            </div>
          </>)}

          {/* Preview */}
          {step === 'preview' && (
            <PreviewStep records={preview} selected={selected} onToggle={toggleSelect}
              onInstall={install} installing={installing} onBack={goBack} />
          )}
        </div>

        {/* Footer */}
        {step !== 'preview' && step !== 'done' && (
          <div className={styles.footer}>
            {step !== 'pick' && <button className={styles.btnSecondary} onClick={goBack}>← Back</button>}
            <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
            {step === 'input' && (
              <button className={styles.btnPrimary} onClick={analyse} disabled={loading}>
                {loading ? 'Analysing…' : method === 'form' ? 'Create Skill' : 'Analyse →'}
              </button>
            )}
          </div>
        )}
        {step === 'done' && (
          <div className={styles.footer}>
            <button className={styles.btnPrimary} onClick={onInstalled}>Done →</button>
          </div>
        )}
      </div>
    </div>
  )
}
