/**
 * AgentsView.jsx  — Steps 4, 5, 6, 7, 8
 *
 * Full agent management:
 *  - Grid of live agents from /api/v1/agents
 *  - ▶ Run Agent → goal prompt → POST /api/v1/agents/{id}/run
 *  - ⚙ Config → AgentConfigModal (edit system_prompt, skills, limits)
 *  - + Create Agent → AgentBuilderWizard (4-step)
 *  - Click card → run history drawer
 */
import { useState, useEffect, useCallback } from 'react'
import { fetchAgents, runAgent, updateAgent, fetchAgentRuns, fetchStoreSkills } from '../../api'
import AgentBuilderWizard from './AgentBuilderWizard'

const ARCHETYPE_STYLE = {
  autonomous:  { label: 'Autonomous',   color: 'var(--accent)',  bg: 'rgba(110,231,183,.12)' },
  assistant:   { label: 'Assistant',    color: 'var(--amber)',   bg: 'rgba(251,191,36,.12)'  },
  pipeline:    { label: 'Pipeline',     color: 'var(--purple)',  bg: 'rgba(192,132,252,.12)' },
  event:       { label: 'Event-driven', color: 'var(--red)',     bg: 'rgba(248,113,113,.12)' },
}


const s = {
  wrap:    { display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' },
  hdr:     { padding:'18px 24px 14px', borderBottom:'1px solid var(--border)',
             display:'flex', alignItems:'center', gap:12, flexShrink:0 },
  title:   { fontSize:20, fontWeight:800, letterSpacing:-0.5, flex:1 },
  addBtn:  { padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700,
             background:'var(--accent)', color:'#000', border:'none', cursor:'pointer' },
  grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',
             gap:14, padding:'20px 24px', overflowY:'auto', flex:1 },
  card:    (sel) => ({
             background:'var(--panel)', border:`1px solid ${sel?'var(--accent)':'var(--border)'}`,
             borderRadius:14, padding:20, display:'flex', flexDirection:'column', gap:12,
             cursor:'pointer', transition:'border-color .15s',
           }),
  iconBox: (bg) => ({ width:46, height:46, borderRadius:12, display:'flex',
             alignItems:'center', justifyContent:'center', fontSize:22, background:bg }),
  name:    { fontSize:15, fontWeight:800, marginBottom:2 },
  archTag: (col) => ({ fontSize:9, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase', color:col }),
  desc:    { fontSize:12, color:'var(--muted2)', lineHeight:1.6,
             display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' },
  skills:  { display:'flex', flexWrap:'wrap', gap:4 },
  chip:    { fontSize:9, padding:'2px 6px', borderRadius:4, background:'var(--panel2)',
             color:'var(--muted2)', border:'1px solid var(--border2)' },
  footer:  { display:'flex', gap:8, marginTop:'auto' },
  runBtn:  (col, bg) => ({ flex:1, padding:'8px 0', borderRadius:8, fontSize:12, fontWeight:700,
             border:'none', background:bg, color:col, cursor:'pointer' }),
  cfgBtn:  { flex:1, padding:'8px 0', borderRadius:8, fontSize:12, fontWeight:700,
             background:'var(--panel2)', color:'var(--muted2)',
             border:'1px solid var(--border)', cursor:'pointer' },
  empty:   { display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
             height:200, gap:10, color:'var(--muted)', gridColumn:'1/-1' },
  overlay: { position:'fixed', inset:0, background:'#0009', zIndex:200,
             display:'flex', alignItems:'center', justifyContent:'center' },
  modal:   { background:'var(--panel)', borderRadius:14, padding:28, width:480,
             border:'1px solid var(--border)' },
  mTitle:  { fontSize:16, fontWeight:800, marginBottom:16 },
  input:   { width:'100%', padding:'10px 12px', borderRadius:8, fontSize:13,
             background:'var(--panel2)', border:'1px solid var(--border2)',
             color:'var(--text)', outline:'none', boxSizing:'border-box', resize:'vertical' },
  mBtns:   { display:'flex', gap:10, marginTop:16 },
  pBtn:    (primary) => ({
             flex:1, padding:'10px', borderRadius:8, fontSize:13, fontWeight:700,
             cursor:'pointer', border:'none',
             background: primary ? 'var(--accent)' : 'var(--panel2)',
             color:      primary ? '#000' : 'var(--text)',
           }),
  drawer:  { position:'fixed', right:0, top:0, bottom:0, width:420,
             background:'var(--panel)', borderLeft:'1px solid var(--border)',
             display:'flex', flexDirection:'column', zIndex:100 },
  dHdr:   { padding:'18px 20px 14px', borderBottom:'1px solid var(--border)',
             display:'flex', alignItems:'center', gap:12 },
  dTitle: { flex:1, fontSize:16, fontWeight:800 },
  dClose: { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)' },
  dBody:  { flex:1, overflowY:'auto', padding:20 },
  section:{ background:'var(--panel2)', borderRadius:8, padding:12, marginBottom:12 },
  sLabel: { fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase',
            color:'var(--muted)', marginBottom:6, display:'block' },
  runRow: { display:'flex', gap:8, alignItems:'center', padding:'7px 0',
            borderBottom:'1px solid var(--border2)' },
  runGoal:{ flex:1, fontSize:11, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text)' },
  runStat:(ok) => ({ fontSize:10, fontWeight:700, color: ok?'var(--accent)':'#f87171' }),
  runMeta:{ fontSize:10, color:'var(--muted2)' },
  danger: { padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700,
            background:'transparent', color:'#ef4444', border:'1px solid #ef444488', cursor:'pointer' },
}

// ── Run Prompt Modal ──────────────────────────────────────────────────────────
function RunPrompt({ agent, onClose, onRun }) {
  const [goal, setGoal] = useState('')
  const [running, setRunning] = useState(false)
  const at = ARCHETYPE_STYLE[agent.archetype] || ARCHETYPE_STYLE.autonomous
  const submit = async () => {
    if (!goal.trim()) return
    setRunning(true)
    await onRun(agent.id, goal.trim())
    setRunning(false)
    onClose()
  }
  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.mTitle}>{agent.icon} Run {agent.name}</div>
        <div style={{ fontSize:12, color:'var(--muted2)', marginBottom:12 }}>{agent.description}</div>
        <textarea style={s.input} rows={4}
          placeholder={`What should ${agent.name} do?\ne.g. "Review PR #42 in acme/api-service"`}
          value={goal} onChange={e => setGoal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && e.metaKey && submit()} autoFocus />
        <div style={{ fontSize:10, color:'var(--muted2)', marginTop:4 }}>⌘+Enter to submit</div>
        <div style={s.mBtns}>
          <button style={s.pBtn(false)} onClick={onClose}>Cancel</button>
          <button style={{ ...s.pBtn(true), background:at.bg, color:at.color }}
            onClick={submit} disabled={running || !goal.trim()}>
            {running ? 'Running…' : `▶ Run`}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Pipeline Step Editor (Step 7) ─────────────────────────────────────────────
function PipelineStepEditor({ steps, onChange, allSkills }) {
  const add = () => onChange([...steps, { name:`step${steps.length+1}`, skill:'', args:{}, depends_on:[] }])
  const set = (i, k, v) => onChange(steps.map((s, j) => j===i ? { ...s, [k]:v } : s))
  const remove = (i) => onChange(steps.filter((_, j) => j!==i))
  return (
    <>
      <div style={{ fontSize:12, color:'var(--muted2)', marginBottom:12 }}>
        Steps run in dependency order. Independent steps execute concurrently (fan-out).
      </div>
      {steps.map((step, i) => (
        <div key={i} style={{ background:'var(--panel2)', borderRadius:8, padding:12, marginBottom:8 }}>
          <div style={{ display:'flex', gap:8, marginBottom:8, alignItems:'center' }}>
            <span style={{ fontSize:11, color:'var(--muted2)', minWidth:24 }}>#{i+1}</span>
            <input style={{ ...s.input, flex:1, minHeight:'unset', resize:'none', fontSize:12 }}
              placeholder="step_name" value={step.name} onChange={e => set(i,'name',e.target.value)} />
            <select style={{ ...s.input, flex:2, minHeight:'unset', resize:'none', fontSize:12 }}
              value={step.skill} onChange={e => set(i,'skill',e.target.value)}>
              <option value="">— pick skill —</option>
              {allSkills.map(sk => <option key={sk.name} value={sk.name}>{sk.name}</option>)}
            </select>
            <button style={{ ...s.danger, padding:'4px 10px', fontSize:11 }} onClick={() => remove(i)}>✕</button>
          </div>
          <label style={{ fontSize:10, color:'var(--muted2)' }}>Depends on (comma-separated):</label>
          <input style={{ ...s.input, minHeight:'unset', resize:'none', fontSize:12, marginTop:4 }}
            placeholder="e.g. step1, step2"
            value={(step.depends_on||[]).join(', ')}
            onChange={e => set(i,'depends_on', e.target.value.split(',').map(x=>x.trim()).filter(Boolean))} />
        </div>
      ))}
      <button style={{ ...s.pBtn(true), padding:'8px 16px', fontSize:12 }} onClick={add}>+ Add Step</button>
    </>
  )
}

// ── Event Trigger Editor (Step 8) ─────────────────────────────────────────────
const KNOWN_EVENTS = [
  { id:'pr_opened',   label:'PR Opened',        desc:'GitHub pull request created' },
  { id:'pr_merged',   label:'PR Merged',         desc:'GitHub pull request merged' },
  { id:'alert_fired', label:'Alert Fired',       desc:'Monitoring alert triggered' },
  { id:'deploy_done', label:'Deploy Completed',  desc:'Deployment pipeline finished' },
  { id:'cron_daily',  label:'Daily Schedule',    desc:'Once per day at 00:00 UTC' },
  { id:'cron_hourly', label:'Hourly Schedule',   desc:'Once per hour' },
  { id:'webhook',     label:'Custom Webhook',    desc:'Any POST to /api/v1/webhook' },
]

function EventTriggerEditor({ triggers, onChange }) {
  const toggle = (id) => onChange(triggers.includes(id) ? triggers.filter(t=>t!==id) : [...triggers,id])
  return (
    <>
      <div style={{ fontSize:12, color:'var(--muted2)', marginBottom:12 }}>
        Agent wakes automatically when any selected event fires via <code>POST /api/v1/webhook</code>.
      </div>
      {KNOWN_EVENTS.map(ev => (
        <label key={ev.id} style={{
          display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
          borderRadius:8, cursor:'pointer', marginBottom:6,
          background: triggers.includes(ev.id) ? 'var(--accent-dim)' : 'var(--panel2)',
          border: `1px solid ${triggers.includes(ev.id) ? 'var(--accent)' : 'var(--border2)'}`,
        }}>
          <input type="checkbox" checked={triggers.includes(ev.id)} onChange={() => toggle(ev.id)} />
          <div style={{ flex:1 }}>
            <div style={{ fontSize:12, fontWeight:600 }}>{ev.label}</div>
            <div style={{ fontSize:10, color:'var(--muted2)' }}>{ev.desc}</div>
          </div>
          <code style={{ fontSize:9, color:'var(--muted2)', background:'var(--panel)', padding:'2px 6px', borderRadius:4 }}>{ev.id}</code>
        </label>
      ))}
    </>
  )
}

// ── Agent Config Modal (Step 4) ───────────────────────────────────────────────
function AgentConfigModal({ agent, allSkills, onClose, onSaved }) {
  const [form, setForm] = useState({
    name:           agent.name,
    icon:           agent.icon,
    description:    agent.description || '',
    system_prompt:  agent.system_prompt || '',
    allowed_skills: agent.allowed_skills || [],
    max_iterations: agent.max_iterations || 10,
    max_cost_usd:   agent.max_cost_usd || 0.50,
    pipeline_steps: agent.pipeline_steps || [],
    event_triggers: agent.event_triggers || [],
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab]       = useState('prompt')
  const set = (k, v) => setForm(p => ({ ...p, [k]:v }))
  const toggleSkill = (name) => set('allowed_skills',
    form.allowed_skills.includes(name)
      ? form.allowed_skills.filter(s => s!==name)
      : [...form.allowed_skills, name])
  const save = async () => {
    setSaving(true)
    await updateAgent(agent.id, form)
    setSaving(false)
    onSaved()
  }
  const tabs = [
    { id:'prompt',   label:'System Prompt' },
    { id:'skills',   label:`Skills${form.allowed_skills.length ? ` (${form.allowed_skills.length})` : ''}` },
    { id:'limits',   label:'Limits' },
    ...(agent.archetype==='pipeline' ? [{ id:'pipeline', label:'Steps' }] : []),
    ...(agent.archetype==='event'    ? [{ id:'events',   label:'Triggers' }] : []),
  ]
  return (
    <div style={s.overlay} onClick={e => e.target===e.currentTarget && onClose()}>
      <div style={{ ...s.modal, width:580, maxHeight:'90vh', display:'flex', flexDirection:'column', padding:0, overflow:'hidden' }}>
        {/* Header */}
        <div style={{ padding:'18px 22px 12px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:24 }}>{form.icon}</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:16, fontWeight:800 }}>{form.name}</div>
            <div style={{ fontSize:10, color:'var(--muted2)', textTransform:'uppercase', letterSpacing:1.5 }}>{agent.archetype}</div>
          </div>
          <button style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)' }} onClick={onClose}>✕</button>
        </div>
        {/* Tabs */}
        <div style={{ display:'flex', borderBottom:'1px solid var(--border)', padding:'0 22px' }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'8px 14px', background:'none', border:'none', cursor:'pointer',
              fontSize:12, fontWeight:tab===t.id?700:500,
              color: tab===t.id?'var(--accent)':'var(--muted2)',
              borderBottom: tab===t.id?'2px solid var(--accent)':'2px solid transparent',
            }}>{t.label}</button>
          ))}
        </div>
        {/* Body */}
        <div style={{ flex:1, overflowY:'auto', padding:22 }}>
          {tab==='prompt' && (<>
            <div style={{ display:'flex', gap:10, marginBottom:12 }}>
              <div style={{ flex:1 }}>
                <label style={s.sLabel}>Name</label>
                <input style={{ ...s.input, resize:'none', minHeight:'unset' }} value={form.name} onChange={e=>set('name',e.target.value)} />
              </div>
              <div>
                <label style={s.sLabel}>Icon</label>
                <input style={{ ...s.input, resize:'none', minHeight:'unset', width:60, textAlign:'center' }} value={form.icon} onChange={e=>set('icon',e.target.value)} />
              </div>
            </div>
            <label style={s.sLabel}>Description</label>
            <textarea style={{ ...s.input, marginBottom:12, minHeight:60 }} rows={2}
              value={form.description} onChange={e=>set('description',e.target.value)} />
            <label style={s.sLabel}>System Prompt — injected into every LLM call this agent makes</label>
            <textarea style={{ ...s.input, minHeight:160 }} rows={8}
              value={form.system_prompt} onChange={e=>set('system_prompt',e.target.value)} />
          </>)}
          {tab==='skills' && (<>
            <div style={{ fontSize:12, color:'var(--muted2)', marginBottom:12 }}>
              {form.allowed_skills.length===0
                ? '⚠ No restriction — agent can call ALL skills. Select specific skills to restrict.'
                : `Agent restricted to ${form.allowed_skills.length} skill(s).`}
            </div>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <button style={{ ...s.pBtn(false), flex:'unset', padding:'5px 12px', fontSize:11 }} onClick={()=>set('allowed_skills',[])}>Allow All</button>
              <button style={{ ...s.pBtn(false), flex:'unset', padding:'5px 12px', fontSize:11 }} onClick={()=>set('allowed_skills',allSkills.map(sk=>sk.name))}>Restrict All</button>
            </div>
            {allSkills.map(sk => (
              <label key={sk.name} style={{
                display:'flex', alignItems:'center', gap:10, padding:'8px 10px',
                borderRadius:8, cursor:'pointer', marginBottom:6,
                background: form.allowed_skills.includes(sk.name)?'var(--accent-dim)':'var(--panel2)',
                border:`1px solid ${form.allowed_skills.includes(sk.name)?'var(--accent)':'var(--border2)'}`,
              }}>
                <input type="checkbox" checked={form.allowed_skills.includes(sk.name)} onChange={()=>toggleSkill(sk.name)} />
                <span style={{ fontSize:14 }}>{sk.icon||'⚙️'}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:600 }}>{sk.name}</div>
                  <div style={{ fontSize:10, color:'var(--muted2)' }}>{sk.description?.slice(0,60) || sk.source_type}</div>
                </div>
              </label>
            ))}
          </>)}
          {tab==='limits' && (<>
            <label style={s.sLabel}>Max Iterations (ReAct loop depth)</label>
            <input type="number" style={{ ...s.input, resize:'none', minHeight:'unset', marginBottom:14 }} min={1} max={25}
              value={form.max_iterations} onChange={e=>set('max_iterations',parseInt(e.target.value)||10)} />
            <label style={s.sLabel}>Max Cost per Run (USD)</label>
            <input type="number" style={{ ...s.input, resize:'none', minHeight:'unset' }} min={0.01} step={0.05}
              value={form.max_cost_usd} onChange={e=>set('max_cost_usd',parseFloat(e.target.value)||0.50)} />
            <div style={{ fontSize:11, color:'var(--muted2)', marginTop:6 }}>Run is cancelled if estimated cost exceeds this limit.</div>
          </>)}
          {tab==='pipeline' && (
            <PipelineStepEditor steps={form.pipeline_steps} onChange={v=>set('pipeline_steps',v)} allSkills={allSkills} />
          )}
          {tab==='events' && (
            <EventTriggerEditor triggers={form.event_triggers} onChange={v=>set('event_triggers',v)} />
          )}
        </div>
        {/* Footer */}
        <div style={{ ...s.mBtns, padding:'12px 22px', borderTop:'1px solid var(--border)', margin:0 }}>
          <button style={s.pBtn(false)} onClick={onClose}>Cancel</button>
          <button style={s.pBtn(true)} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Run History Drawer (Step 6) ────────────────────────────────────────────────
function RunHistoryDrawer({ agent, onClose }) {
  const [runs, setRuns]       = useState([])
  const [loading, setLoading] = useState(true)
  const at = ARCHETYPE_STYLE[agent.archetype] || ARCHETYPE_STYLE.autonomous
  useEffect(() => {
    fetchAgentRuns(agent.id, 20).then(d => { setRuns(d.runs||[]); setLoading(false) })
  }, [agent.id])
  return (
    <div style={s.drawer}>
      <div style={s.dHdr}>
        <span style={{ fontSize:22 }}>{agent.icon}</span>
        <div style={s.dTitle}>
          <div>{agent.name}</div>
          <div style={{ fontSize:10, color:at.color, fontWeight:700, textTransform:'uppercase', letterSpacing:1.5 }}>{at.label}</div>
        </div>
        <button style={s.dClose} onClick={onClose}>✕</button>
      </div>
      <div style={s.dBody}>
        <div style={s.section}>
          <span style={s.sLabel}>System Prompt</span>
          <div style={{ fontSize:11, color:'var(--muted2)', lineHeight:1.6, maxHeight:80, overflow:'auto' }}>{agent.system_prompt||'—'}</div>
        </div>
        {agent.allowed_skills?.length > 0 && (
          <div style={s.section}>
            <span style={s.sLabel}>Allowed Skills ({agent.allowed_skills.length})</span>
            <div style={s.skills}>
              {agent.allowed_skills.map(sk => <span key={sk} style={s.chip}>{sk}</span>)}
            </div>
          </div>
        )}
        <div style={s.section}>
          <span style={s.sLabel}>Limits</span>
          <div style={{ fontSize:12, display:'flex', gap:16 }}>
            <span>Max iterations: <strong>{agent.max_iterations}</strong></span>
            <span>Max cost: <strong>${(agent.max_cost_usd||0).toFixed(2)}</strong>/run</span>
          </div>
        </div>
        {agent.archetype==='pipeline' && agent.pipeline_steps?.length > 0 && (
          <div style={s.section}>
            <span style={s.sLabel}>Pipeline Steps ({agent.pipeline_steps.length})</span>
            {agent.pipeline_steps.map((step,i) => (
              <div key={i} style={{ fontSize:11, padding:'4px 0', borderBottom:'1px solid var(--border2)', display:'flex', gap:8 }}>
                <span style={{ color:'var(--muted2)' }}>#{i+1}</span>
                <span style={{ fontWeight:600 }}>{step.name}</span>
                <span style={{ color:'var(--muted2)' }}>→</span>
                <span style={{ color:'var(--accent)' }}>{step.skill}</span>
              </div>
            ))}
          </div>
        )}
        {agent.archetype==='event' && agent.event_triggers?.length > 0 && (
          <div style={s.section}>
            <span style={s.sLabel}>Event Triggers</span>
            <div style={s.skills}>
              {agent.event_triggers.map(t => <span key={t} style={s.chip}>{t}</span>)}
            </div>
          </div>
        )}
        <div style={s.section}>
          <span style={s.sLabel}>Run History (last 20)</span>
          {loading ? (
            <div style={{ color:'var(--muted2)', fontSize:12 }}>Loading…</div>
          ) : runs.length===0 ? (
            <div style={{ color:'var(--muted2)', fontSize:12 }}>No runs yet — click ▶ Run to start.</div>
          ) : runs.map((run,i) => (
            <div key={i} style={s.runRow}>
              <div style={s.runGoal} title={run.goal}>{run.goal}</div>
              <span style={s.runStat(run.success!==false)}>{run.success!==false?'✓':'✗'}</span>
              {run.eval_score!=null && <span style={s.runMeta}>⭐{(run.eval_score*100).toFixed(0)}%</span>}
              {run.cost_usd>0 && <span style={s.runMeta}>${run.cost_usd?.toFixed(3)}</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Main AgentsView ───────────────────────────────────────────────────────────
export default function AgentsView({ onRunAgent }) {
  const [agents, setAgents]         = useState([])
  const [allSkills, setAllSkills]   = useState([])
  const [loading, setLoading]       = useState(true)
  const [runTarget, setRunTarget]   = useState(null)
  const [cfgTarget, setCfgTarget]   = useState(null)
  const [histTarget, setHistTarget] = useState(null)
  const [showBuilder, setShowBuilder] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [ad, sd] = await Promise.all([
      fetchAgents().catch(()=>[]),
      fetchStoreSkills().catch(()=>({ skills:[] })),
    ])
    setAgents(ad)
    setAllSkills(sd.skills || [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleRun = async (agentId, goal) => {
    const result = await runAgent(agentId, goal)
    if (onRunAgent) onRunAgent({ id: result.id, goal })
    load()
  }

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div style={s.title}>Agents <span style={{ fontSize:14, fontWeight:400, color:'var(--muted2)' }}>{agents.length} configured</span></div>
        <button style={s.addBtn} onClick={() => setShowBuilder(true)}>+ Create Agent</button>
      </div>

      <div style={s.grid}>
        {loading ? (
          <div style={s.empty}><div style={{ fontSize:40,opacity:.4 }}>⏳</div><div>Loading…</div></div>
        ) : agents.length===0 ? (
          <div style={s.empty}><div style={{ fontSize:40,opacity:.4 }}>🤖</div><div>No agents yet</div></div>
        ) : agents.map(a => {
          const at = ARCHETYPE_STYLE[a.archetype] || ARCHETYPE_STYLE.autonomous
          return (
            <div key={a.id} style={s.card(histTarget?.id===a.id)} onClick={() => setHistTarget(a)}>
              <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
                <div style={s.iconBox(at.bg)}>{a.icon}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={s.name}>{a.name}</div>
                  <div style={s.archTag(at.color)}>{at.label}</div>
                </div>
              </div>
              <div style={s.desc}>{a.description||'No description'}</div>
              {a.allowed_skills?.length > 0 && (
                <div style={s.skills}>
                  {a.allowed_skills.slice(0,3).map(sk => <span key={sk} style={s.chip}>{sk}</span>)}
                  {a.allowed_skills.length > 3 && <span style={s.chip}>+{a.allowed_skills.length-3}</span>}
                </div>
              )}
              {a.allowed_skills?.length === 0 && (
                <div style={{ ...s.chip, background:'rgba(110,231,183,.08)', color:'var(--accent)', border:'none', fontSize:9 }}>all skills</div>
              )}
              <div style={s.footer} onClick={e => e.stopPropagation()}>
                <button style={s.runBtn(at.color,at.bg)} onClick={() => setRunTarget(a)}>▶ Run Agent</button>
                <button style={s.cfgBtn} onClick={() => setCfgTarget(a)}>⚙ Config</button>
              </div>
            </div>
          )
        })}
      </div>

      {runTarget && <RunPrompt agent={runTarget} onClose={()=>setRunTarget(null)} onRun={handleRun} />}

      {cfgTarget && <AgentConfigModal agent={cfgTarget} allSkills={allSkills}
        onClose={()=>setCfgTarget(null)} onSaved={()=>{ setCfgTarget(null); load() }} />}

      {histTarget && !cfgTarget && !runTarget && (
        <RunHistoryDrawer agent={histTarget} onClose={()=>setHistTarget(null)} />
      )}

      {showBuilder && (
        <AgentBuilderWizard allSkills={allSkills}
          onClose={()=>setShowBuilder(false)}
          onCreated={()=>{ setShowBuilder(false); load() }} />
      )}
    </div>
  )
}
