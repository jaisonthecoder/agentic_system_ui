/**
 * SkillBuilderWizard.jsx
 *
 * 4-path skill creation wizard:
 *   📄 From Document  → POST /api/v1/store/build/from-document  (LLM-agnostic extraction)
 *   🔗 From OpenAPI   → POST /api/v1/store/build/from-openapi   (deterministic, no LLM)
 *   ✨ AI Generate    → POST /api/v1/store/build/from-description (LLM-agnostic generation)
 *   🖱 Manual Form    → POST /api/v1/store/build/from-form       (no LLM)
 *
 * The backend uses get_llm_provider() for all LLM paths, so it works with
 * Anthropic, OpenAI, or Ollama — whatever is configured in .env.
 *
 * Flow:
 *   Choose method → Fill input → Preview extracted skills → (optional) pick connector → Install
 */
import { useState } from 'react'
import {
  buildFromDocument, buildFromOpenAPI, buildFromDescription, buildFromForm,
  buildFromPython, installPreview, fetchConnectors,
} from '../../api'

const METHODS = [
  { id: 'doc',    icon: '📄', label: 'From Document', desc: '.md · .txt · paste any text' },
  { id: 'openapi',icon: '🔗', label: 'From OpenAPI',  desc: 'YAML/JSON spec — no LLM needed' },
  { id: 'ai',     icon: '✨', label: 'AI Generate',   desc: 'Describe in plain English' },
  { id: 'form',   icon: '🖱', label: 'Manual Form',   desc: 'Fill every field yourself' },
  { id: 'python', icon: '🐍', label: 'Python Code',   desc: 'Write a real @skill function' },
]

const PARAM_TYPES = ['string', 'integer', 'boolean', 'array', 'object']
const IMPL_TYPES  = ['echo', 'prompt', 'http']
const CATEGORIES  = ['custom','developer-tools','communication','data','ai','cloud']

const s = {
  overlay: { position:'fixed', inset:0, background:'#0009', zIndex:300,
             display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal:   { background:'var(--panel)', borderRadius:14, width:'100%', maxWidth:600,
             border:'1px solid var(--border)', display:'flex', flexDirection:'column',
             maxHeight:'92vh', overflow:'hidden' },
  hdr:     { padding:'18px 22px 14px', borderBottom:'1px solid var(--border)',
             display:'flex', alignItems:'center', gap:10 },
  title:   { flex:1, fontSize:17, fontWeight:800 },
  close:   { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)' },
  body:    { flex:1, overflowY:'auto', padding:22 },
  footer:  { padding:'14px 22px', borderTop:'1px solid var(--border)',
             display:'flex', gap:10, justifyContent:'flex-end' },
  // Method picker
  methods: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  mCard:   (a) => ({
             padding:16, borderRadius:10, cursor:'pointer', textAlign:'left',
             background: a ? 'var(--accent-dim)' : 'var(--panel2)',
             border:     `1px solid ${a ? 'var(--accent)' : 'var(--border2)'}`,
             transition:'all .15s',
           }),
  mIcon:   { fontSize:28, marginBottom:6 },
  mLabel:  { fontSize:14, fontWeight:700, marginBottom:2 },
  mDesc:   { fontSize:11, color:'var(--muted2)' },
  // Form fields
  field:   { marginBottom:14 },
  label:   { fontSize:11, fontWeight:600, color:'var(--muted2)', marginBottom:4, display:'block' },
  input:   { padding:'8px 12px', borderRadius:8, fontSize:13, background:'var(--panel2)',
             border:'1px solid var(--border2)', color:'var(--text)', width:'100%',
             outline:'none', boxSizing:'border-box' },
  textarea:{ padding:'10px 12px', borderRadius:8, fontSize:12, background:'var(--panel2)',
             border:'1px solid var(--border2)', color:'var(--text)', width:'100%',
             outline:'none', boxSizing:'border-box', fontFamily:'monospace',
             resize:'vertical', minHeight:140 },
  // Preview
  previewCard: (sel) => ({
             background: sel ? 'var(--accent-dim)' : 'var(--panel2)',
             border:`1px solid ${sel ? 'var(--accent)' : 'var(--border2)'}`,
             borderRadius:10, padding:'12px 14px', marginBottom:8, cursor:'pointer',
           }),
  previewRow:{ display:'flex', alignItems:'center', gap:10 },
  previewChk:{ width:16, height:16, flexShrink:0 },
  previewName:{ fontSize:13, fontWeight:700, flex:1 },
  previewSrc:{ fontSize:10, color:'var(--muted2)', padding:'2px 7px', borderRadius:4,
              background:'var(--panel)', border:'1px solid var(--border2)' },
  previewDesc:{ fontSize:11, color:'var(--muted2)', marginTop:4, marginLeft:26 },
  params:  { marginLeft:26, marginTop:6 },
  paramChip:{ display:'inline-block', fontSize:10, padding:'2px 6px', borderRadius:4,
              background:'var(--panel)', border:'1px solid var(--border2)',
              color:'var(--muted2)', marginRight:4, marginBottom:2 },
  // Buttons
  btn:     (primary) => ({
             padding:'9px 20px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
             background:  primary ? 'var(--accent)' : 'var(--panel2)',
             color:       primary ? '#000' : 'var(--text)',
             border:      primary ? 'none' : '1px solid var(--border2)',
           }),
  spinner: { opacity:.5, fontStyle:'italic', fontSize:13 },
  error:   { background:'#2a0a0a', border:'1px solid #ef444488', borderRadius:8,
             padding:'10px 14px', fontSize:12, color:'#f87171', marginBottom:10 },
  success: { background:'#0a2a0a', border:'1px solid #4ade8088', borderRadius:8,
             padding:'10px 14px', fontSize:12, color:'#4ade80', marginBottom:10 },
  // Param editor row
  paramRow:{ display:'flex', gap:8, alignItems:'center', marginBottom:6 },
  paramInput:{ flex:2, padding:'6px 8px', borderRadius:6, fontSize:12,
               background:'var(--panel2)', border:'1px solid var(--border2)',
               color:'var(--text)', outline:'none' },
  paramSel:{ flex:1, padding:'6px 8px', borderRadius:6, fontSize:12,
             background:'var(--panel2)', border:'1px solid var(--border2)',
             color:'var(--text)', outline:'none' },
  removeBtn:{ padding:'4px 8px', borderRadius:6, fontSize:11, cursor:'pointer',
              background:'none', color:'#f87171', border:'1px solid #ef444488' },
}

// ── Shared step renderer ──────────────────────────────────────────────────────

function StepPick({ onPick }) {
  const [hover, setHover] = useState(null)
  return (
    <div style={s.methods}>
      {METHODS.map(m => (
        <button key={m.id} style={s.mCard(hover === m.id)}
          onMouseEnter={() => setHover(m.id)} onMouseLeave={() => setHover(null)}
          onClick={() => onPick(m.id)}>
          <div style={s.mIcon}>{m.icon}</div>
          <div style={s.mLabel}>{m.label}</div>
          <div style={s.mDesc}>{m.desc}</div>
        </button>
      ))}
    </div>
  )
}

function PreviewStep({ records, selected, onToggle, onInstall, installing, onBack }) {
  return (
    <>
      <div style={{fontSize:13, color:'var(--muted2)', marginBottom:14}}>
        Found <strong>{records.length}</strong> skill{records.length !== 1 ? 's' : ''}.
        Select which to install:
      </div>
      {records.map((r, i) => (
        <div key={r.name} style={s.previewCard(selected.has(i))} onClick={() => onToggle(i)}>
          <div style={s.previewRow}>
            <input type="checkbox" style={s.previewChk} checked={selected.has(i)} readOnly />
            <span style={s.previewName}>{r.icon || '⚙️'} {r.name}</span>
            <span style={s.previewSrc}>{r.source_type}</span>
          </div>
          {r.description && <div style={s.previewDesc}>{r.description}</div>}
          {r.parameters?.length > 0 && (
            <div style={s.params}>
              {r.parameters.map(p => (
                <span key={p.name} style={s.paramChip}>{p.name}: {p.type}</span>
              ))}
            </div>
          )}
        </div>
      ))}
      <div style={{ ...s.footer, padding:0, marginTop:16 }}>
        <button style={s.btn(false)} onClick={onBack}>← Back</button>
        <button style={s.btn(true)} onClick={onInstall} disabled={installing || selected.size === 0}>
          {installing ? 'Installing…' : `Install ${selected.size} skill${selected.size !== 1 ? 's' : ''}`}
        </button>
      </div>
    </>
  )
}

// ── Main Wizard ───────────────────────────────────────────────────────────────

export default function SkillBuilderWizard({ onClose, onInstalled }) {
  const [step, setStep]           = useState('pick')   // pick | input | preview | done
  const [method, setMethod]       = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)
  const [preview, setPreview]     = useState([])
  const [selected, setSelected]   = useState(new Set())
  const [installing, setInstalling] = useState(false)
  const [successMsg, setSuccessMsg] = useState(null)

  // Input state per method
  const [docContent, setDocContent] = useState('')
  const [docFiles, setDocFiles]     = useState([])   // [{ name, content }]
  const [openApiSpec, setOpenApiSpec] = useState('')
  const [pyCode, setPyCode] = useState(
`import asyncio
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
`)
  const [aiDesc, setAiDesc]         = useState('')
  const [formData, setFormData]     = useState({
    name:'', description:'', category:'custom', icon:'⚙️', tags:[],
    parameters:[], implementation_type:'echo',
    connector_id:'', system_prompt:'', user_template:'{input}',
    max_tokens:2048, method:'POST', path:'', body_template:{},
  })
  const [formParams, setFormParams] = useState([])

  const pickMethod = (m) => { setMethod(m); setStep('input'); setError(null) }
  const goBack = () => { setStep(step === 'preview' ? 'input' : 'pick'); setError(null) }

  const handleFileRead = (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    // Read all files, append each to docFiles state
    files.forEach(file => {
      const reader = new FileReader()
      reader.onload = ev => {
        setDocFiles(prev => {
          // Avoid duplicate filenames
          if (prev.some(f => f.name === file.name)) return prev
          return [...prev, { name: file.name, content: ev.target.result }]
        })
      }
      reader.readAsText(file)
    })
    // Reset input so same file can be re-added after removal
    e.target.value = ''
  }

  const removeDocFile = (name) =>
    setDocFiles(prev => prev.filter(f => f.name !== name))

  const toggleSelect = (i) => {
    setSelected(prev => {
      const n = new Set(prev)
      n.has(i) ? n.delete(i) : n.add(i)
      return n
    })
  }

  const analyse = async () => {
    setLoading(true)
    setError(null)
    try {
      let result
      if (method === 'doc') {
        // Merge all uploaded files + manual paste into one document
        const fileParts = docFiles.map(f =>
          `\n\n--- File: ${f.name} ---\n${f.content}`
        ).join('')
        const combined = (fileParts + '\n\n' + docContent).trim()
        if (!combined) { setError('Upload at least one file or paste content.'); setLoading(false); return }
        const firstName = docFiles[0]?.name || 'document.md'
        result = await buildFromDocument(combined, firstName)
      } else if (method === 'openapi') {
        if (!openApiSpec.trim()) { setError('Paste the OpenAPI spec.'); setLoading(false); return }
        result = await buildFromOpenAPI(openApiSpec.trim())
      } else if (method === 'ai') {
        if (!aiDesc.trim()) { setError('Enter a description.'); setLoading(false); return }
        result = await buildFromDescription(aiDesc.trim())
      } else if (method === 'form') {
        const params = formParams.map(p => ({
          name: p.name, type: p.type, required: p.required, description: p.desc,
        }))
        result = await buildFromForm({ ...formData, parameters: params })
        // form: auto-install directly
        setLoading(false)
        if (result.preview) {
          const installResult = await installPreview(result.preview)
          setSuccessMsg(`✓ Installed: ${result.preview.map(s => s.name).join(', ')}`)
          setStep('done')
        }
        return
      } else if (method === 'python') {
        if (!pyCode.trim()) { setError('Code is empty.'); setLoading(false); return }
        // Direct install — no preview step
        const res = await buildFromPython(pyCode)
        setLoading(false)
        setSuccessMsg(`✓ ${res.message}`)
        setStep('done')
        return
      }

      const records = result?.preview || []
      if (records.length === 0) {
        setError('No skills could be extracted. Try a different input.')
        setLoading(false)
        return
      }
      setPreview(records)
      setSelected(new Set(records.map((_, i) => i)))
      setStep('preview')
    } catch (e) {
      setError(String(e))
    }
    setLoading(false)
  }

  const install = async () => {
    setInstalling(true)
    const toInstall = preview.filter((_, i) => selected.has(i))
    const result = await installPreview(toInstall)
    setInstalling(false)
    setSuccessMsg(`✓ Installed ${result.installed} skill${result.installed !== 1 ? 's' : ''}`)
    setStep('done')
  }

  // ── Form param editor helpers ─────────────────────────────────────────────
  const addParam = () => setFormParams(p => [...p, { name:'', type:'string', required:true, desc:'' }])
  const setParam = (i, k, v) => setFormParams(p => p.map((x, j) => j === i ? { ...x, [k]: v } : x))
  const removeParam = (i) => setFormParams(p => p.filter((_, j) => j !== i))
  const setF = (k, v) => setFormData(p => ({ ...p, [k]: v }))

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.hdr}>
          <div style={s.title}>
            {step === 'pick'    && '✨ Create Skill'}
            {step === 'input'   && `${METHODS.find(m => m.id === method)?.icon} ${METHODS.find(m => m.id === method)?.label}`}
            {step === 'preview' && '📋 Preview Extracted Skills'}
            {step === 'done'    && '🎉 Done'}
          </div>
          <button style={s.close} onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div style={s.body}>
          {error && <div style={s.error}>⚠ {error}</div>}
          {successMsg && <div style={s.success}>{successMsg}</div>}

          {/* ── Step: Pick method ── */}
          {step === 'pick' && <StepPick onPick={pickMethod} />}

          {/* ── Step: Done ── */}
          {step === 'done' && (
            <div style={{textAlign:'center', padding:'20px 0'}}>
              <div style={{fontSize:48, marginBottom:12}}>🎉</div>
              <div style={{fontSize:15, fontWeight:700, marginBottom:6}}>{successMsg}</div>
              <div style={{fontSize:12, color:'var(--muted2)'}}>Skills are now live in the registry — agents can use them immediately.</div>
            </div>
          )}

          {/* ── Step: Document Input ── */}
          {step === 'input' && method === 'doc' && (
            <>
              <div style={s.field}>
                <label style={s.label}>Upload files (.md · .txt) — select multiple at once</label>
                <input type="file" accept=".md,.txt,.pdf,.rst" multiple
                  style={{...s.input, padding:'6px'}} onChange={handleFileRead} />
                {/* File chips */}
                {docFiles.length > 0 && (
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:8 }}>
                    {docFiles.map(f => (
                      <span key={f.name} style={{
                        display:'inline-flex', alignItems:'center', gap:5,
                        fontSize:11, padding:'3px 8px', borderRadius:20,
                        background:'var(--accent-dim)', border:'1px solid var(--accent)',
                        color:'var(--accent)',
                      }}>
                        📄 {f.name}
                        <button onClick={() => removeDocFile(f.name)} style={{
                          background:'none', border:'none', cursor:'pointer',
                          color:'var(--accent)', fontSize:12, lineHeight:1, padding:0,
                        }}>✕</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div style={s.field}>
                <label style={s.label}>— or paste additional content directly —</label>
                <textarea style={s.textarea} placeholder={`# API Reference\n## Create User\nPOST /users\n...\n\nYou can paste extra text here even if you uploaded files above.`}
                  value={docContent} onChange={e => setDocContent(e.target.value)} rows={8} />
              </div>
              {docFiles.length > 0 && (
                <div style={{ fontSize:11, color:'var(--accent)', marginBottom:6 }}>
                  ✓ {docFiles.length} file(s) loaded — all will be combined and analysed together.
                </div>
              )}
              <div style={{fontSize:11, color:'var(--muted2)'}}>
                The skill extraction uses whichever LLM is configured in your .env (Anthropic / OpenAI / Ollama).
              </div>
            </>
          )}

          {/* ── Step: OpenAPI Input ── */}
          {step === 'input' && method === 'openapi' && (
            <>
              <div style={s.field}>
                <label style={s.label}>OpenAPI 3.x spec (JSON or YAML)</label>
                <textarea style={s.textarea}
                  placeholder={'{\n  "openapi": "3.0.0",\n  "paths": { ... }\n}'}
                  value={openApiSpec} onChange={e => setOpenApiSpec(e.target.value)} rows={12} />
              </div>
              <div style={{fontSize:11, color:'var(--muted2)'}}>
                Fully deterministic — no LLM involved. One skill per endpoint is generated automatically.
              </div>
            </>
          )}

          {/* ── Step: AI Description Input ── */}
          {step === 'input' && method === 'ai' && (
            <>
              <div style={s.field}>
                <label style={s.label}>Describe the skill in plain English</label>
                <textarea style={{...s.textarea, minHeight:100, fontFamily:'sans-serif', fontSize:14}}
                  placeholder="e.g. 'A skill that takes a customer ID and returns their last 5 orders from our Postgres database'"
                  value={aiDesc} onChange={e => setAiDesc(e.target.value)} rows={4} />
              </div>
              <div style={{fontSize:11, color:'var(--muted2)'}}>
                Uses whichever LLM is configured in your .env — Anthropic Claude, OpenAI, or Ollama.
                The same prompt works on all models.
              </div>
            </>
          )}

          {/* ── Step: Python Code ── */}
          {step === 'input' && method === 'python' && (
            <>
              <div style={s.field}>
                <label style={s.label}>Python skill code</label>
                <textarea
                  spellCheck={false}
                  style={{
                    ...s.textarea,
                    fontFamily: 'var(--mono, monospace)',
                    fontSize: 12,
                    minHeight: 320,
                    lineHeight: 1.6,
                    tabSize: 4,
                    whiteSpace: 'pre',
                  }}
                  value={pyCode}
                  onChange={e => setPyCode(e.target.value)}
                  onKeyDown={e => {
                    // Tab inserts 4 spaces instead of focusing next element
                    if (e.key === 'Tab') {
                      e.preventDefault()
                      const s = e.target.selectionStart
                      const v = e.target.value
                      setPyCode(v.slice(0, s) + '    ' + v.slice(e.target.selectionEnd))
                      requestAnimationFrame(() => { e.target.selectionStart = e.target.selectionEnd = s + 4 })
                    }
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted2)', lineHeight: 1.6 }}>
                Rules: use <code style={{color:'var(--accent)'}}>@skill(name=..., description=...)</code> decorator on every function.
                The file is written to <code style={{color:'var(--accent)'}}>src/layer3_skills/user_skills/</code> and
                hot-loaded — no restart needed. Syntax errors are caught before saving.
              </div>
            </>
          )}

          {/* ── Step: Manual Form ── */}
          {step === 'input' && method === 'form' && (<>
            <div style={s.field}>
              <label style={s.label}>Skill Name (snake_case)</label>
              <input style={s.input} placeholder="my_skill_name" value={formData.name}
                onChange={e => setF('name', e.target.value)} />
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <input style={s.input} placeholder="What does this skill do?" value={formData.description}
                onChange={e => setF('description', e.target.value)} />
            </div>
            <div style={{display:'flex', gap:10}}>
              <div style={{...s.field, flex:1}}>
                <label style={s.label}>Icon (emoji)</label>
                <input style={s.input} value={formData.icon} onChange={e => setF('icon', e.target.value)} />
              </div>
              <div style={{...s.field, flex:2}}>
                <label style={s.label}>Category</label>
                <select style={s.input} value={formData.category} onChange={e => setF('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={s.field}>
              <label style={s.label}>Implementation Type</label>
              <div style={{display:'flex', gap:8}}>
                {IMPL_TYPES.map(t => (
                  <button key={t}
                    style={{...s.btn(formData.implementation_type === t), padding:'6px 14px', fontSize:12}}
                    onClick={() => setF('implementation_type', t)}>{t}</button>
                ))}
              </div>
            </div>

            {formData.implementation_type === 'http' && (<>
              <div style={s.field}>
                <label style={s.label}>Connector ID</label>
                <input style={s.input} placeholder="connector_id from Connectors view"
                  value={formData.connector_id} onChange={e => setF('connector_id', e.target.value)} />
              </div>
              <div style={{display:'flex', gap:10}}>
                <div style={{...s.field, flex:1}}>
                  <label style={s.label}>Method</label>
                  <select style={s.input} value={formData.method} onChange={e => setF('method', e.target.value)}>
                    {['GET','POST','PUT','DELETE'].map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div style={{...s.field, flex:3}}>
                  <label style={s.label}>Path</label>
                  <input style={s.input} placeholder="/api/v1/resource" value={formData.path}
                    onChange={e => setF('path', e.target.value)} />
                </div>
              </div>
            </>)}

            {formData.implementation_type === 'prompt' && (
              <div style={s.field}>
                <label style={s.label}>System Prompt</label>
                <textarea style={s.textarea} rows={4}
                  placeholder="You are a helpful assistant that..."
                  value={formData.system_prompt} onChange={e => setF('system_prompt', e.target.value)} />
              </div>
            )}

            <div style={{...s.field, marginBottom:6}}>
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6}}>
                <label style={{...s.label, margin:0}}>Parameters</label>
                <button style={{...s.btn(true), padding:'4px 12px', fontSize:11}} onClick={addParam}>+ Add</button>
              </div>
              {formParams.map((p, i) => (
                <div key={i} style={s.paramRow}>
                  <input style={s.paramInput} placeholder="name" value={p.name}
                    onChange={e => setParam(i, 'name', e.target.value)} />
                  <select style={s.paramSel} value={p.type} onChange={e => setParam(i, 'type', e.target.value)}>
                    {PARAM_TYPES.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <input style={{...s.paramInput, flex:3}} placeholder="description" value={p.desc}
                    onChange={e => setParam(i, 'desc', e.target.value)} />
                  <label style={{fontSize:11, color:'var(--muted2)', cursor:'pointer', display:'flex', alignItems:'center', gap:4}}>
                    <input type="checkbox" checked={p.required}
                      onChange={e => setParam(i, 'required', e.target.checked)} />
                    req
                  </label>
                  <button style={s.removeBtn} onClick={() => removeParam(i)}>✕</button>
                </div>
              ))}
            </div>
          </>)}

          {/* ── Step: Preview ── */}
          {step === 'preview' && (
            <PreviewStep
              records={preview} selected={selected} onToggle={toggleSelect}
              onInstall={install} installing={installing} onBack={goBack}
            />
          )}
        </div>

        {/* Footer — only for non-preview steps */}
        {step !== 'preview' && step !== 'done' && (
          <div style={s.footer}>
            {step !== 'pick' && <button style={s.btn(false)} onClick={goBack}>← Back</button>}
            <button style={s.btn(false)} onClick={onClose}>Cancel</button>
            {step === 'done' && <button style={s.btn(true)} onClick={onInstalled}>Done</button>}
            {step === 'input' && (
              <button style={s.btn(true)} onClick={analyse} disabled={loading}>
                {loading
                  ? <span style={s.spinner}>Analysing…</span>
                  : method === 'form' ? 'Create Skill' : 'Analyse →'}
              </button>
            )}
          </div>
        )}

        {step === 'done' && (
          <div style={s.footer}>
            <button style={s.btn(true)} onClick={onInstalled}>Done →</button>
          </div>
        )}
      </div>
    </div>
  )
}
