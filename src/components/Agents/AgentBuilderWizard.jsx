/**
 * AgentBuilderWizard.jsx — Step 5
 *
 * 4-step modal wizard to create a new configured agent:
 *   Step 1 — Archetype picker  (autonomous | assistant | pipeline | event)
 *   Step 2 — Identity + System Prompt
 *   Step 3 — Skills (checkbox list) / Pipeline steps / Event triggers
 *   Step 4 — Limits + Review → POST /api/v1/agents
 */
import { useState } from 'react'
import { createAgent } from '../../api'

const ARCHETYPES = [
  {
    id: 'autonomous',
    icon: '🤖', label: 'Autonomous',
    desc: 'Long-horizon, unattended. Reasons step by step, calls skills, delivers a final result.',
    examples: 'Code review, document analysis, report generation',
  },
  {
    id: 'assistant',
    icon: '💬', label: 'Assistant',
    desc: 'Interactive Q&A with memory across turns. Best for exploratory conversations.',
    examples: 'Engineering Q&A, sprint planning, incident investigation',
  },
  {
    id: 'pipeline',
    icon: '⛓', label: 'Pipeline',
    desc: 'Fixed sequence of skill calls. Deterministic, predictable, no LLM between steps.',
    examples: 'Daily standup report, onboarding workflow, CI/CD summary',
  },
  {
    id: 'event',
    icon: '⚡', label: 'Event-driven',
    desc: 'Sleeps until a trigger fires. Reacts to webhooks, alerts, PR events, or schedules.',
    examples: 'Alert responder, PR auto-review, nightly batch job',
  },
]

const KNOWN_EVENTS = [
  { id:'pr_opened',   label:'PR Opened',       desc:'GitHub pull request created' },
  { id:'pr_merged',   label:'PR Merged',        desc:'GitHub pull request merged' },
  { id:'alert_fired', label:'Alert Fired',      desc:'Monitoring alert triggered' },
  { id:'deploy_done', label:'Deploy Completed', desc:'Deployment pipeline finished' },
  { id:'cron_daily',  label:'Daily Schedule',   desc:'Once per day at 00:00 UTC' },
  { id:'cron_hourly', label:'Hourly Schedule',  desc:'Once per hour' },
  { id:'webhook',     label:'Custom Webhook',   desc:'Any POST to /api/v1/webhook' },
]

const s = {
  overlay: { position:'fixed', inset:0, background:'#000a', zIndex:400,
             display:'flex', alignItems:'center', justifyContent:'center', padding:20 },
  modal:   { background:'var(--panel)', borderRadius:14, width:'100%', maxWidth:620,
             border:'1px solid var(--border)', display:'flex', flexDirection:'column',
             maxHeight:'94vh', overflow:'hidden' },
  hdr:     { padding:'18px 22px 0', display:'flex', alignItems:'center', gap:10, flexShrink:0 },
  progress:{ display:'flex', gap:6, alignItems:'center', flex:1 },
  dot:     (active, done) => ({
             width: done?20:active?20:10, height:10, borderRadius:5, transition:'all .2s',
             background: done?'var(--accent)':active?'var(--accent)':'var(--border2)',
             opacity: done?1:active?1:0.5,
           }),
  stepLabel:{ fontSize:12, fontWeight:700, color:'var(--muted2)' },
  close:   { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)' },
  body:    { flex:1, overflowY:'auto', padding:'20px 22px' },
  footer:  { padding:'14px 22px', borderTop:'1px solid var(--border)',
             display:'flex', gap:10, justifyContent:'flex-end', flexShrink:0 },
  // Archetype picker
  archGrid:{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 },
  archCard:(sel) => ({
             padding:16, borderRadius:10, cursor:'pointer', border:`1px solid ${sel?'var(--accent)':'var(--border2)'}`,
             background: sel?'var(--accent-dim)':'var(--panel2)', transition:'all .15s',
           }),
  archIcon:{ fontSize:28, marginBottom:8 },
  archLabel:{ fontSize:14, fontWeight:800, marginBottom:4 },
  archDesc:{ fontSize:11, color:'var(--muted2)', lineHeight:1.5, marginBottom:6 },
  archEx:  { fontSize:10, color:'var(--muted)', fontStyle:'italic' },
  // Fields
  field:   { marginBottom:14 },
  label:   { fontSize:11, fontWeight:600, color:'var(--muted2)', marginBottom:4, display:'block' },
  input:   { padding:'9px 12px', borderRadius:8, fontSize:13, background:'var(--panel2)',
             border:'1px solid var(--border2)', color:'var(--text)', width:'100%',
             outline:'none', boxSizing:'border-box' },
  textarea:{ padding:'10px 12px', borderRadius:8, fontSize:13, background:'var(--panel2)',
             border:'1px solid var(--border2)', color:'var(--text)', width:'100%',
             outline:'none', boxSizing:'border-box', resize:'vertical', fontFamily:'inherit' },
  // Skill picker
  skillRow:(sel) => ({
             display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
             borderRadius:8, cursor:'pointer', marginBottom:6,
             background: sel?'var(--accent-dim)':'var(--panel2)',
             border:`1px solid ${sel?'var(--accent)':'var(--border2)'}`,
           }),
  // Pipeline step
  stepBox: { background:'var(--panel2)', borderRadius:8, padding:12, marginBottom:8 },
  // Review card
  reviewSection:{ background:'var(--panel2)', borderRadius:8, padding:14, marginBottom:10 },
  reviewLabel:{ fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase',
                color:'var(--muted)', marginBottom:6, display:'block' },
  chip:    { display:'inline-block', fontSize:9, padding:'2px 7px', borderRadius:4,
             background:'var(--panel)', border:'1px solid var(--border2)',
             color:'var(--muted2)', marginRight:4, marginBottom:2 },
  // Buttons
  btn:     (primary) => ({
             padding:'10px 22px', borderRadius:8, fontSize:13, fontWeight:700, cursor:'pointer',
             background:  primary ? 'var(--accent)' : 'var(--panel2)',
             color:       primary ? '#000' : 'var(--text)',
             border:      primary ? 'none' : '1px solid var(--border2)',
           }),
  error:   { background:'#2a0a0a', border:'1px solid #ef444488', borderRadius:8,
             padding:'10px 14px', fontSize:12, color:'#f87171', marginBottom:12 },
  success: { background:'#0a2a0a', border:'1px solid #4ade8088', borderRadius:8,
             padding:'14px', fontSize:14, color:'#4ade80', textAlign:'center' },
}

const STEP_LABELS = ['Archetype', 'Identity', 'Skills & Config', 'Review']

export default function AgentBuilderWizard({ allSkills, onClose, onCreated }) {
  const [step, setStep]     = useState(0)
  const [error, setError]   = useState(null)
  const [saving, setSaving] = useState(false)
  const [done, setDone]     = useState(false)

  const [form, setForm] = useState({
    archetype:      'autonomous',
    name:           '',
    icon:           '🤖',
    description:    '',
    system_prompt:  '',
    allowed_skills: [],
    max_iterations: 10,
    max_cost_usd:   0.50,
    pipeline_steps: [],
    event_triggers: [],
  })

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  const toggleSkill = (name) => set('allowed_skills',
    form.allowed_skills.includes(name)
      ? form.allowed_skills.filter(s => s !== name)
      : [...form.allowed_skills, name])

  // Pipeline step helpers
  const addStep = () => set('pipeline_steps', [...form.pipeline_steps,
    { name:`step${form.pipeline_steps.length+1}`, skill:'', args:{}, depends_on:[] }])
  const setStep2 = (i, k, v) => set('pipeline_steps',
    form.pipeline_steps.map((s, j) => j===i ? { ...s, [k]:v } : s))
  const removeStep = (i) => set('pipeline_steps', form.pipeline_steps.filter((_,j) => j!==i))

  const toggleEvent = (id) => set('event_triggers',
    form.event_triggers.includes(id)
      ? form.event_triggers.filter(t => t!==id)
      : [...form.event_triggers, id])

  const canNext = () => {
    if (step===0) return !!form.archetype
    if (step===1) return !!form.name.trim() && !!form.system_prompt.trim()
    if (step===2) {
      if (form.archetype==='pipeline') return form.pipeline_steps.every(s => s.name && s.skill)
      if (form.archetype==='event')    return form.event_triggers.length > 0
      return true
    }
    return true
  }

  const next = () => { setError(null); setStep(s => s+1) }
  const back = () => { setError(null); setStep(s => s-1) }

  const submit = async () => {
    setSaving(true)
    setError(null)
    try {
      await createAgent(form)
      setDone(true)
    } catch (e) {
      setError(String(e))
    }
    setSaving(false)
  }

  const at = ARCHETYPES.find(a => a.id===form.archetype) || ARCHETYPES[0]

  // ── Step 0: Archetype ──────────────────────────────────────────────────────
  const StepArchetype = () => (
    <div style={s.archGrid}>
      {ARCHETYPES.map(a => (
        <div key={a.id} style={s.archCard(form.archetype===a.id)} onClick={() => set('archetype', a.id)}>
          <div style={s.archIcon}>{a.icon}</div>
          <div style={s.archLabel}>{a.label}</div>
          <div style={s.archDesc}>{a.desc}</div>
          <div style={s.archEx}>{a.examples}</div>
        </div>
      ))}
    </div>
  )

  // ── Step 1: Identity + System Prompt ──────────────────────────────────────
  const StepIdentity = () => (
    <>
      <div style={{ display:'flex', gap:10 }}>
        <div style={{ flex:1 }}>
          <div style={s.field}>
            <label style={s.label}>Agent Name *</label>
            <input style={s.input} placeholder="e.g. Code Reviewer" value={form.name}
              onChange={e => set('name', e.target.value)} autoFocus />
          </div>
        </div>
        <div>
          <div style={s.field}>
            <label style={s.label}>Icon</label>
            <input style={{ ...s.input, width:60, textAlign:'center', fontSize:20 }}
              value={form.icon} onChange={e => set('icon', e.target.value)} />
          </div>
        </div>
      </div>
      <div style={s.field}>
        <label style={s.label}>Description (shown on agent card)</label>
        <input style={s.input} placeholder="What does this agent do?" value={form.description}
          onChange={e => set('description', e.target.value)} />
      </div>
      <div style={s.field}>
        <label style={s.label}>
          System Prompt * — the agent's core instruction, injected into every LLM call
        </label>
        <textarea style={{ ...s.textarea, minHeight:180 }} rows={8}
          placeholder={`You are a ${at.label.toLowerCase()} AI agent that...\n\nBe specific about:\n- What the agent should focus on\n- What it should NOT do\n- Which tools to use in what order\n- How to format its output`}
          value={form.system_prompt}
          onChange={e => set('system_prompt', e.target.value)} />
        <div style={{ fontSize:11, color:'var(--muted2)', marginTop:4 }}>
          This is the most important field. Be specific and detailed.
        </div>
      </div>
    </>
  )

  // ── Step 2: Skills / Pipeline Steps / Event Triggers ──────────────────────
  const StepConfig = () => {
    if (form.archetype === 'pipeline') return (
      <>
        <div style={{ fontSize:12, color:'var(--muted2)', marginBottom:14 }}>
          Define the fixed sequence of skill calls. Independent steps run concurrently.
        </div>
        {form.pipeline_steps.map((step, i) => (
          <div key={i} style={s.stepBox}>
            <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
              <span style={{ fontSize:11, color:'var(--muted2)', minWidth:20 }}>#{i+1}</span>
              <input style={{ ...s.input, flex:1, fontSize:12 }} placeholder="step_name"
                value={step.name} onChange={e => setStep2(i,'name',e.target.value)} />
              <select style={{ ...s.input, flex:2, fontSize:12 }} value={step.skill}
                onChange={e => setStep2(i,'skill',e.target.value)}>
                <option value="">— pick skill —</option>
                {allSkills.map(sk => <option key={sk.name} value={sk.name}>{sk.name}</option>)}
              </select>
              <button style={{ fontSize:11, padding:'4px 10px', borderRadius:6, cursor:'pointer',
                background:'none', color:'#ef4444', border:'1px solid #ef444488' }} onClick={() => removeStep(i)}>✕</button>
            </div>
            <label style={{ fontSize:10, color:'var(--muted2)' }}>Depends on (comma-separated):</label>
            <input style={{ ...s.input, fontSize:12, marginTop:4 }} placeholder="e.g. step1, step2"
              value={(step.depends_on||[]).join(', ')}
              onChange={e => setStep2(i,'depends_on', e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} />
          </div>
        ))}
        <button style={{ ...s.btn(true), padding:'8px 16px', fontSize:12 }} onClick={addStep}>+ Add Step</button>
      </>
    )

    if (form.archetype === 'event') return (
      <>
        <div style={{ fontSize:12, color:'var(--muted2)', marginBottom:14 }}>
          Select which events wake this agent. At least one required.
        </div>
        {KNOWN_EVENTS.map(ev => (
          <label key={ev.id} style={s.skillRow(form.event_triggers.includes(ev.id))}>
            <input type="checkbox" checked={form.event_triggers.includes(ev.id)} onChange={()=>toggleEvent(ev.id)} />
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600 }}>{ev.label}</div>
              <div style={{ fontSize:10, color:'var(--muted2)' }}>{ev.desc}</div>
            </div>
            <code style={{ fontSize:9, color:'var(--muted2)', background:'var(--panel)', padding:'2px 6px', borderRadius:4 }}>{ev.id}</code>
          </label>
        ))}
      </>
    )

    // autonomous / assistant — skill picker
    return (
      <>
        <div style={{ fontSize:12, color:'var(--muted2)', marginBottom:8 }}>
          {form.allowed_skills.length === 0
            ? '⚠ No skills selected — agent can use ALL skills (no restriction).'
            : `${form.allowed_skills.length} skill(s) selected. Agent cannot call others.`}
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          <button style={{ ...s.btn(false), padding:'5px 12px', fontSize:11 }}
            onClick={() => set('allowed_skills', [])}>Allow All (no restriction)</button>
          <button style={{ ...s.btn(false), padding:'5px 12px', fontSize:11 }}
            onClick={() => set('allowed_skills', allSkills.map(sk=>sk.name))}>Select All</button>
        </div>
        {allSkills.map(sk => (
          <label key={sk.name} style={s.skillRow(form.allowed_skills.includes(sk.name))}>
            <input type="checkbox" checked={form.allowed_skills.includes(sk.name)} onChange={()=>toggleSkill(sk.name)} />
            <span style={{ fontSize:14 }}>{sk.icon||'⚙️'}</span>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:12, fontWeight:600 }}>{sk.name}</div>
              <div style={{ fontSize:10, color:'var(--muted2)' }}>{sk.description?.slice(0,60)||sk.source_type}</div>
            </div>
          </label>
        ))}
      </>
    )
  }

  // ── Step 3: Limits + Review ───────────────────────────────────────────────
  const StepReview = () => (
    <>
      <div style={{ display:'flex', gap:10, marginBottom:14 }}>
        <div style={{ flex:1 }}>
          <label style={s.label}>Max Iterations</label>
          <input type="number" style={s.input} min={1} max={25}
            value={form.max_iterations} onChange={e => set('max_iterations', parseInt(e.target.value)||10)} />
        </div>
        <div style={{ flex:1 }}>
          <label style={s.label}>Max Cost / Run (USD)</label>
          <input type="number" style={s.input} min={0.01} step={0.05}
            value={form.max_cost_usd} onChange={e => set('max_cost_usd', parseFloat(e.target.value)||0.50)} />
        </div>
      </div>

      <div style={s.reviewSection}>
        <span style={s.reviewLabel}>Preview</span>
        <div style={{ display:'flex', gap:12, alignItems:'flex-start', marginBottom:10 }}>
          <span style={{ fontSize:32 }}>{form.icon}</span>
          <div>
            <div style={{ fontSize:16, fontWeight:800 }}>{form.name||'Unnamed Agent'}</div>
            <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:1.5, color:'var(--muted2)' }}>{form.archetype}</div>
          </div>
        </div>
        <div style={{ fontSize:12, color:'var(--muted2)', marginBottom:10 }}>{form.description||'—'}</div>

        <span style={s.reviewLabel}>System Prompt</span>
        <div style={{ fontSize:11, color:'var(--muted2)', background:'var(--panel)',
          padding:'8px 10px', borderRadius:6, maxHeight:80, overflow:'auto', lineHeight:1.6 }}>
          {form.system_prompt||'—'}
        </div>

        {form.allowed_skills.length > 0 && (<>
          <span style={{ ...s.reviewLabel, marginTop:10 }}>Allowed Skills ({form.allowed_skills.length})</span>
          <div>{form.allowed_skills.map(sk => <span key={sk} style={s.chip}>{sk}</span>)}</div>
        </>)}
        {form.allowed_skills.length === 0 && (
          <div style={{ marginTop:8, fontSize:11, color:'var(--accent)' }}>✓ Can use all skills</div>
        )}

        {form.archetype==='pipeline' && form.pipeline_steps.length > 0 && (<>
          <span style={{ ...s.reviewLabel, marginTop:10 }}>Pipeline Steps</span>
          {form.pipeline_steps.map((st,i) => (
            <div key={i} style={{ fontSize:11, color:'var(--muted2)', marginBottom:2 }}>
              #{i+1} <strong>{st.name}</strong> → <span style={{ color:'var(--accent)' }}>{st.skill}</span>
              {st.depends_on?.length>0 && <span> (after: {st.depends_on.join(', ')})</span>}
            </div>
          ))}
        </>)}

        {form.archetype==='event' && form.event_triggers.length > 0 && (<>
          <span style={{ ...s.reviewLabel, marginTop:10 }}>Event Triggers</span>
          <div>{form.event_triggers.map(t => <span key={t} style={s.chip}>{t}</span>)}</div>
        </>)}

        <div style={{ marginTop:10, fontSize:11, color:'var(--muted2)', display:'flex', gap:16 }}>
          <span>Max iterations: <strong>{form.max_iterations}</strong></span>
          <span>Max cost: <strong>${form.max_cost_usd.toFixed(2)}/run</strong></span>
        </div>
      </div>
    </>
  )

  const STEPS = [<StepArchetype key={0}/>, <StepIdentity key={1}/>, <StepConfig key={2}/>, <StepReview key={3}/>]

  return (
    <div style={s.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={s.modal}>
        {/* Header */}
        <div style={s.hdr}>
          <div style={s.progress}>
            {STEP_LABELS.map((label, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <div style={s.dot(i===step, i<step)} />
                {i===step && <span style={{ fontSize:12, fontWeight:700, color:'var(--text)' }}>{label}</span>}
              </div>
            ))}
          </div>
          <span style={{ fontSize:11, color:'var(--muted2)', marginRight:8 }}>Step {step+1} / {STEP_LABELS.length}</span>
          <button style={s.close} onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div style={s.body}>
          {done ? (
            <div style={s.success}>
              <div style={{ fontSize:36, marginBottom:10 }}>🎉</div>
              <div style={{ fontWeight:800, marginBottom:6 }}>{form.icon} {form.name} is ready!</div>
              <div style={{ fontSize:12, color:'rgba(74,222,128,.7)' }}>
                Agent is live in the registry — you can run it immediately.
              </div>
            </div>
          ) : (
            <>
              {error && <div style={s.error}>⚠ {error}</div>}
              {STEPS[step]}
            </>
          )}
        </div>

        {/* Footer */}
        <div style={s.footer}>
          {!done && step > 0 && <button style={s.btn(false)} onClick={back}>← Back</button>}
          <button style={s.btn(false)} onClick={onClose}>Cancel</button>
          {done ? (
            <button style={s.btn(true)} onClick={onCreated}>Done →</button>
          ) : step < STEP_LABELS.length - 1 ? (
            <button style={s.btn(true)} onClick={next} disabled={!canNext()}>
              Next →
            </button>
          ) : (
            <button style={s.btn(true)} onClick={submit} disabled={saving || !canNext()}>
              {saving ? 'Creating…' : '🤖 Create Agent'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
