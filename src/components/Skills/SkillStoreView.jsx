import { useState, useEffect, useCallback } from 'react'
import { fetchStoreSkills, uninstallSkill, testSkill, fetchSkillAnalytics } from '../../api'
import SkillBuilderWizard from './SkillBuilderWizard'

const SOURCE_COLORS = {
  python:         { bg: 'var(--accent-dim)',  fg: 'var(--accent)' },
  'ui-built':     { bg: 'var(--blue-dim)',    fg: 'var(--blue)' },
  openapi:        { bg: 'var(--purple-dim)',  fg: 'var(--purple)' },
  'doc-extracted':{ bg: '#2a1f0a',            fg: '#f59e0b' },
  'ai-generated': { bg: '#0a1f2a',            fg: '#06b6d4' },
  mcp:            { bg: 'var(--panel2)',       fg: 'var(--muted2)' },
}

const CATS = [
  { id: '',                label: 'All' },
  { id: 'developer-tools', label: '🛠 Dev Tools' },
  { id: 'communication',   label: '💬 Comms' },
  { id: 'data',            label: '📊 Data' },
  { id: 'ai',              label: '🤖 AI' },
  { id: 'cloud',           label: '☁️ Cloud' },
  { id: 'custom',          label: '⚙️ Custom' },
]

const SOURCES = [
  { id: '',              label: 'All sources' },
  { id: 'python',        label: '🐍 Python' },
  { id: 'doc-extracted', label: '📄 From Doc' },
  { id: 'openapi',       label: '🔗 OpenAPI' },
  { id: 'ai-generated',  label: '✨ AI Gen' },
  { id: 'ui-built',      label: '🖱 UI Built' },
  { id: 'mcp',           label: '🔌 MCP' },
]

const s = {
  wrap:    { display:'flex', flexDirection:'column', height:'100%', overflow:'hidden' },
  hdr:     { padding:'18px 24px 14px', borderBottom:'1px solid var(--border)', flexShrink:0 },
  hdrRow:  { display:'flex', alignItems:'center', gap:12, marginBottom:10 },
  title:   { fontSize:20, fontWeight:800, letterSpacing:-0.5, flex:1 },
  addBtn:  { padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700,
             background:'var(--accent)', color:'#000', border:'none', cursor:'pointer' },
  filters: { display:'flex', gap:6, flexWrap:'wrap', alignItems:'center' },
  search:  { padding:'6px 12px', borderRadius:8, fontSize:13, background:'var(--panel2)',
             border:'1px solid var(--border2)', color:'var(--text)', width:180, outline:'none' },
  fBtn:    (a) => ({ padding:'5px 12px', borderRadius:20, fontSize:11, fontWeight:600,
             border:'none', cursor:'pointer',
             background: a ? 'var(--accent-dim)' : 'transparent',
             color: a ? 'var(--accent)' : 'var(--muted2)' }),
  body:    { flex:1, overflowY:'auto', padding:'16px 24px' },
  grid:    { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:10 },
  card:    (selected) => ({
             background:'var(--panel)', border:`1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
             borderRadius:12, padding:14, cursor:'pointer', transition:'border-color .15s',
           }),
  icon:    { fontSize:24, marginBottom:6 },
  name:    { fontSize:13, fontWeight:700, marginBottom:3, wordBreak:'break-all' },
  desc:    { fontSize:11, color:'var(--muted2)', lineHeight:1.5, marginBottom:8,
             display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' },
  footer:  { display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 },
  tag:     (src) => ({
             fontSize:9, fontWeight:700, letterSpacing:1.2, textTransform:'uppercase',
             padding:'2px 7px', borderRadius:4,
             background: (SOURCE_COLORS[src]||SOURCE_COLORS.python).bg,
             color:       (SOURCE_COLORS[src]||SOURCE_COLORS.python).fg,
           }),
  calls:   { fontSize:10, color:'var(--muted2)' },
  // Detail panel
  panel:   { position:'fixed', right:0, top:0, bottom:0, width:400, background:'var(--panel)',
             borderLeft:'1px solid var(--border)', padding:24, overflowY:'auto', zIndex:100,
             display:'flex', flexDirection:'column', gap:16 },
  pHdr:    { display:'flex', alignItems:'flex-start', gap:12 },
  pIcon:   { fontSize:36 },
  pTitle:  { flex:1 },
  pName:   { fontSize:18, fontWeight:800, wordBreak:'break-all' },
  pSrc:    { fontSize:11, color:'var(--muted2)', marginTop:2 },
  close:   { background:'none', border:'none', fontSize:20, cursor:'pointer', color:'var(--muted)' },
  section: { background:'var(--panel2)', borderRadius:8, padding:12 },
  sLabel:  { fontSize:10, fontWeight:700, letterSpacing:1.5, textTransform:'uppercase',
             color:'var(--muted)', marginBottom:8 },
  param:   { display:'flex', gap:8, alignItems:'baseline', marginBottom:4 },
  pName2:  { fontSize:12, fontWeight:600, minWidth:100 },
  pType:   { fontSize:10, color:'var(--muted2)', background:'var(--panel)', padding:'1px 6px',
             borderRadius:4 },
  pReq:    { fontSize:10, color:'var(--accent)' },
  argInput:{ padding:'6px 10px', borderRadius:6, background:'var(--panel2)',
             border:'1px solid var(--border2)', color:'var(--text)', fontSize:12,
             width:'100%', outline:'none', marginTop:4 },
  testBtn: { padding:'9px 18px', borderRadius:8, fontSize:13, fontWeight:700,
             background:'var(--accent)', color:'#000', border:'none', cursor:'pointer', width:'100%' },
  testRes: { background:'#0a1a0a', borderRadius:8, padding:12, fontSize:11,
             color:'#4ade80', fontFamily:'monospace', whiteSpace:'pre-wrap', maxHeight:200, overflow:'auto' },
  dangerBtn:{ padding:'8px 16px', borderRadius:8, fontSize:12, fontWeight:700,
              background:'transparent', color:'#ef4444', border:'1px solid #ef4444', cursor:'pointer' },
  empty:   { display:'flex', flexDirection:'column', alignItems:'center',
             justifyContent:'center', height:200, gap:10, color:'var(--muted)' },
}

export default function SkillStoreView() {
  const [skills, setSkills]         = useState([])
  const [analytics, setAnalytics]   = useState({})
  const [loading, setLoading]       = useState(true)
  const [cat, setCat]               = useState('')
  const [src, setSrc]               = useState('')
  const [search, setSearch]         = useState('')
  const [selected, setSelected]     = useState(null)
  const [testArgs, setTestArgs]     = useState({})
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting]       = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [sd, ad] = await Promise.all([
        fetchStoreSkills({ category: cat || undefined, source_type: src || undefined, search: search || undefined }),
        fetchSkillAnalytics(),
      ])
      setSkills(sd.skills || [])
      setAnalytics(ad.analytics || {})
    } catch {}
    setLoading(false)
  }, [cat, src, search])

  useEffect(() => { load() }, [load])

  const handleTest = async () => {
    if (!selected) return
    setTesting(true)
    setTestResult(null)
    const res = await testSkill(selected.name, testArgs)
    setTestResult(res)
    setTesting(false)
  }

  const handleUninstall = async (name) => {
    if (!window.confirm(`Uninstall '${name}'? This cannot be undone.`)) return
    await uninstallSkill(name)
    setSelected(null)
    load()
  }

  const selectSkill = (sk) => {
    setSelected(sk)
    setTestArgs({})
    setTestResult(null)
  }

  return (
    <div style={s.wrap}>
      {/* ── Header ── */}
      <div style={s.hdr}>
        <div style={s.hdrRow}>
          <div style={s.title}>🛒 Skill Store <span style={{fontSize:14,fontWeight:400,color:'var(--muted2)'}}>{skills.length} skills</span></div>
          <button style={s.addBtn} onClick={() => setShowWizard(true)}>+ Create Skill</button>
        </div>
        <div style={s.filters}>
          <input style={s.search} placeholder="Search skills…" value={search}
            onChange={e => setSearch(e.target.value)} />
          {CATS.map(c => <button key={c.id} style={s.fBtn(cat===c.id)} onClick={() => setCat(c.id)}>{c.label}</button>)}
          <select style={{...s.search, width:'auto'}} value={src} onChange={e => setSrc(e.target.value)}>
            {SOURCES.map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
          </select>
        </div>
      </div>

      {/* ── Grid ── */}
      <div style={s.body}>
        {loading ? (
          <div style={s.empty}><div style={{fontSize:40,opacity:.4}}>🛒</div><div>Loading skills…</div></div>
        ) : skills.length === 0 ? (
          <div style={s.empty}><div style={{fontSize:40,opacity:.4}}>🔍</div><div>No skills found</div></div>
        ) : (
          <div style={s.grid}>
            {skills.map(sk => (
              <div key={sk.name} style={s.card(selected?.name === sk.name)} onClick={() => selectSkill(sk)}>
                <div style={s.icon}>{sk.icon || '⚙️'}</div>
                <div style={s.name}>{sk.name}</div>
                <div style={s.desc}>{sk.description || 'No description'}</div>
                <div style={s.footer}>
                  <span style={s.tag(sk.source_type)}>{sk.source_type || 'python'}</span>
                  {analytics[sk.name] > 0 && (
                    <span style={s.calls}>↗ {analytics[sk.name]} calls</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Detail Panel ── */}
      {selected && (
        <div style={s.panel}>
          <div style={s.pHdr}>
            <div style={s.pIcon}>{selected.icon || '⚙️'}</div>
            <div style={s.pTitle}>
              <div style={s.pName}>{selected.name}</div>
              <div style={s.pSrc}>
                <span style={s.tag(selected.source_type)}>{selected.source_type}</span>
                {' '}{selected.version || '1.0.0'} · {selected.category || 'custom'}
              </div>
            </div>
            <button style={s.close} onClick={() => setSelected(null)}>✕</button>
          </div>

          <div style={s.section}>
            <div style={s.sLabel}>Description</div>
            <div style={{fontSize:13, lineHeight:1.6}}>{selected.description || '—'}</div>
          </div>

          {(selected.parameters || selected.params || []).length > 0 && (
            <div style={s.section}>
              <div style={s.sLabel}>Parameters</div>
              {(selected.parameters || []).map(p => (
                <div key={p.name}>
                  <div style={s.param}>
                    <span style={s.pName2}>{p.name}</span>
                    <span style={s.pType}>{p.type || 'string'}</span>
                    {p.required && <span style={s.pReq}>required</span>}
                  </div>
                  <input
                    style={s.argInput}
                    placeholder={p.description || p.name}
                    value={testArgs[p.name] || ''}
                    onChange={e => setTestArgs(prev => ({ ...prev, [p.name]: e.target.value }))}
                  />
                </div>
              ))}
            </div>
          )}

          {/* Test sandbox */}
          <div style={s.section}>
            <div style={s.sLabel}>Test Sandbox</div>
            <button style={s.testBtn} onClick={handleTest} disabled={testing}>
              {testing ? 'Running…' : '▶ Run Skill'}
            </button>
            {testResult && (
              <div style={{...s.testRes, marginTop:8, color: testResult.success ? '#4ade80' : '#f87171'}}>
                {testResult.success
                  ? `✓ ${testResult.latency_ms}ms\n${testResult.result}`
                  : `✗ ${testResult.error}`}
              </div>
            )}
          </div>

          {analytics[selected.name] !== undefined && (
            <div style={s.section}>
              <div style={s.sLabel}>Analytics</div>
              <div style={{fontSize:13}}>Total calls: <strong>{analytics[selected.name] || 0}</strong></div>
            </div>
          )}

          {selected.source_type !== 'python' && (
            <button style={s.dangerBtn} onClick={() => handleUninstall(selected.name)}>
              Uninstall skill
            </button>
          )}
        </div>
      )}

      {/* ── Builder Wizard ── */}
      {showWizard && (
        <SkillBuilderWizard
          onClose={() => setShowWizard(false)}
          onInstalled={() => { setShowWizard(false); load() }}
        />
      )}
    </div>
  )
}
