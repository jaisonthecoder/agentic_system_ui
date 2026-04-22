import { useState, useEffect } from 'react'
import { fetchMetrics, fetchTasks, fetchSkills, fetchMcpServers } from '../../api'
import { fetchHealth, fetchLLMConfig, updateLLMConfig } from '../../api'

const STATUS_COLOR = { running: 'var(--blue)', done: 'var(--accent)', failed: 'var(--red)' }

const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
  hdr: {
    padding: '22px 28px 18px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0,
  },
  title: { fontSize: 22, fontWeight: 800, letterSpacing: -0.5 },
  desc: { fontSize: 12, color: 'var(--muted2)', marginTop: 2 },
  btnS: { padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'var(--panel2)', color: 'var(--text)', border: '1px solid var(--border2)', marginLeft: 'auto' },
  body: { padding: '22px 28px', overflowY: 'auto', flex: 1 },
  mrow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20 },
  mcard: { background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 18px' },
  mlabel: { fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'var(--muted2)', marginBottom: 6 },
  mval: (col) => ({ fontSize: 28, fontWeight: 800, letterSpacing: -1, lineHeight: 1, color: col }),
  msub: { fontSize: 11, color: 'var(--muted2)', marginTop: 3 },
  dgrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 },
  dcard: { background: 'var(--panel)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' },
  dchdr: { padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 13, fontWeight: 700 },
  dcbody: { padding: '14px 16px' },
  aitem: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid var(--border)' },
  adot: (col) => ({ width: 7, height: 7, borderRadius: '50%', marginTop: 5, flexShrink: 0, background: col }),
  atext: { fontSize: 12, lineHeight: 1.5 },
  atime: { fontSize: 10, color: 'var(--muted)', marginTop: 1 },
  sbarRow: { marginBottom: 10 },
  sbarTop: { display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 3 },
  sbarNm: { fontFamily: 'var(--mono)', color: 'var(--muted2)' },
  sbarBg: { height: 4, background: 'var(--border)', borderRadius: 2 },
  sbarFill: (w) => ({ height: 4, borderRadius: 2, background: 'linear-gradient(90deg, var(--accent), var(--blue))', width: `${w}%`, transition: 'width .8s ease' }),
  // MCP section
  mcpgrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 },
  mcpcard: (connected) => ({
    background: 'var(--panel)', borderRadius: 10, padding: 14,
    border: `1px solid ${connected ? 'rgba(110,231,183,.3)' : 'var(--border)'}`,
  }),
  mcpname: { fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', marginBottom: 4 },
  mcptools: { fontSize: 11, color: 'var(--muted2)' },
  mcpbadge: (connected) => ({
    display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
    background: connected ? 'rgba(110,231,183,.15)' : 'rgba(91,107,128,.15)',
    color: connected ? 'var(--accent)' : 'var(--muted)',
    border: `1px solid ${connected ? 'rgba(110,231,183,.3)' : 'var(--border2)'}`,
    marginBottom: 6,
  }),
}

export default function DashboardView() {
  const [metrics, setMetrics] = useState({})
  const [tasks, setTasks] = useState([])
  const [skills, setSkills] = useState([])
  const [mcp, setMcp] = useState({})
  const [health, setHealth] = useState(null)
  const [llmConfig, setLLMConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  // Switcher state
  const [switching, setSwitching] = useState(false)
  const [switchMsg, setSwitchMsg] = useState(null)
  const [selProvider, setSelProvider] = useState(null)
  const [selModel, setSelModel] = useState(null)

  const load = async () => {
    try {
      const [m, t, sk, mc, h, lc] = await Promise.allSettled([
        fetchMetrics(), fetchTasks(), fetchSkills(), fetchMcpServers(),
        fetchHealth(), fetchLLMConfig()
      ])
      if (m.status === 'fulfilled') setMetrics(m.value)
      if (t.status === 'fulfilled') setTasks(t.value)
      if (sk.status === 'fulfilled') setSkills(sk.value)
      if (mc.status === 'fulfilled') setMcp(mc.value)
      if (h.status === 'fulfilled') setHealth(h.value)
      if (lc.status === 'fulfilled') {
        setLLMConfig(lc.value)
        setSelProvider(lc.value.provider)
        setSelModel(lc.value.model)
      }
    } catch {}
    setLoading(false)
  }

  const handleSwitch = async () => {
    if (!selProvider || !selModel) return
    setSwitching(true)
    setSwitchMsg(null)
    try {
      const res = await updateLLMConfig(selProvider, selModel)
      setSwitchMsg({ ok: true, text: `Switched to ${res.provider} / ${res.model}` })
      // Refresh health + config to reflect change
      const [h, lc] = await Promise.allSettled([fetchHealth(), fetchLLMConfig()])
      if (h.status === 'fulfilled') setHealth(h.value)
      if (lc.status === 'fulfilled') setLLMConfig(lc.value)
    } catch (e) {
      setSwitchMsg({ ok: false, text: `Error: ${e.message}` })
    }
    setSwitching(false)
    setTimeout(() => setSwitchMsg(null), 4000)
  }

  useEffect(() => { load() }, [])

  const recent = tasks.slice(0, 5)
  const totalTasks = metrics.total_tasks ?? tasks.length
  const running = tasks.filter(t => t.status === 'running').length
  const latency = metrics.avg_latency_ms ? Math.round(metrics.avg_latency_ms) + 'ms' : '—'
  const cost = metrics.total_cost_usd != null ? '$' + Number(metrics.total_cost_usd).toFixed(4) : '$0.00'

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div><div style={s.title}>Dashboard</div><div style={s.desc}>Live metrics from Python backend</div></div>
        <button style={s.btnS} onClick={load}>↻ Refresh</button>
      </div>

      <div style={s.body}>
        {/* Metric cards */}
        <div style={s.mrow}>
          {[
            { label: 'Total Tasks',  val: totalTasks, col: 'var(--accent)', sub: 'all time' },
            { label: 'Running Now',  val: running,    col: 'var(--blue)',   sub: 'active agents' },
            { label: 'Avg Latency',  val: latency,    col: 'var(--purple)', sub: 'milliseconds' },
            { label: 'Total Cost',   val: cost,       col: 'var(--amber)',  sub: 'USD this session' },
          ].map(m => (
            <div key={m.label} style={s.mcard}>
              <div style={s.mlabel}>{m.label}</div>
              <div style={s.mval(m.col)}>{m.val}</div>
              <div style={s.msub}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* LLM Provider Switcher */}
        {llmConfig && (() => {
          const PROVIDER_ICON  = { gemini: '✦', anthropic: '◆', openai: '⬡', ollama: '🦙' }
          const PROVIDER_COLOR = { gemini: '#4285F4', anthropic: '#d97706', openai: '#10b981', ollama: '#8b5cf6' }
          const activeColor = PROVIDER_COLOR[health?.llm_provider] || 'var(--accent)'
          const models = llmConfig.models_by_provider?.[selProvider] || []
          const apiKeys = llmConfig.api_keys_set || {}

          return (
            <div style={{ ...s.dcard, marginBottom: 20, overflow: 'visible' }}>
              <div style={{ ...s.dchdr, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: activeColor }}>{PROVIDER_ICON[health?.llm_provider] || '🤖'}</span>
                LLM Provider
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 9px',
                  borderRadius: 20, background: 'rgba(110,231,183,.15)', color: 'var(--accent)',
                  border: '1px solid rgba(110,231,183,.3)',
                }}>● {health?.llm_provider?.toUpperCase() || '—'} · {health?.llm_model || '—'}</span>
              </div>

              <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

                {/* Provider tiles */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
                                color: 'var(--muted2)', marginBottom: 10 }}>Select Provider</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                    {(llmConfig.available_providers || []).map(p => {
                      const col   = PROVIDER_COLOR[p] || 'var(--accent)'
                      const isAct = p === selProvider
                      const hasKey = apiKeys[p]
                      return (
                        <button key={p} onClick={() => {
                          setSelProvider(p)
                          setSelModel((llmConfig.models_by_provider?.[p] || [])[0] || '')
                          setSwitchMsg(null)
                        }} style={{
                          padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                          border: `2px solid ${isAct ? col : 'var(--border)'}`,
                          background: isAct ? `${col}18` : 'var(--panel2)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                          transition: 'all .15s',
                        }}>
                          <span style={{ fontSize: 22, color: col }}>{PROVIDER_ICON[p] || '🤖'}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: isAct ? col : 'var(--text)',
                                         textTransform: 'capitalize' }}>{p}</span>
                          <span style={{
                            fontSize: 9, padding: '1px 6px', borderRadius: 8,
                            background: hasKey ? 'rgba(110,231,183,.15)' : 'rgba(239,68,68,.1)',
                            color: hasKey ? 'var(--accent)' : '#ef4444',
                          }}>{p === 'ollama' ? 'local' : hasKey ? 'key set' : 'no key'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Model dropdown */}
                {selProvider && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
                                  color: 'var(--muted2)', marginBottom: 8 }}>Select Model</div>
                    <select value={selModel || ''} onChange={e => setSelModel(e.target.value)}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: 8, fontSize: 13,
                               background: 'var(--panel2)', border: '1px solid var(--border2)',
                               color: 'var(--text)', outline: 'none' }}>
                      {models.map(m => <option key={m} value={m}>{m}</option>)}
                      {/* allow typing a custom model */}
                    </select>
                    <input placeholder="or type a custom model name…"
                      style={{ width: '100%', marginTop: 6, padding: '7px 12px', borderRadius: 8,
                               fontSize: 12, background: 'var(--panel2)', border: '1px solid var(--border)',
                               color: 'var(--muted2)', outline: 'none', boxSizing: 'border-box' }}
                      onChange={e => e.target.value && setSelModel(e.target.value)} />
                  </div>
                )}

                {/* Switch button + feedback */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button onClick={handleSwitch} disabled={switching ||
                      (selProvider === health?.llm_provider && selModel === health?.llm_model)}
                    style={{
                      padding: '10px 22px', borderRadius: 8, fontWeight: 700, fontSize: 13,
                      background: 'var(--accent)', color: '#000', border: 'none', cursor: 'pointer',
                      opacity: (switching || (selProvider === health?.llm_provider && selModel === health?.llm_model)) ? 0.5 : 1,
                    }}>
                    {switching ? 'Switching…' : 'Apply'}
                  </button>
                  {switchMsg && (
                    <span style={{ fontSize: 12, color: switchMsg.ok ? 'var(--accent)' : '#ef4444' }}>
                      {switchMsg.ok ? '✓' : '✗'} {switchMsg.text}
                    </span>
                  )}
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted2)' }}>
                    Session only — edit config/.env to persist
                  </span>
                </div>
              </div>
            </div>
          )
        })()}

        {/* Recent Tasks + Skills */}
        <div style={s.dgrid}>
          <div style={s.dcard}>
            <div style={s.dchdr}>⚡ Recent Tasks</div>
            <div style={s.dcbody}>
              {recent.length === 0 ? (
                <div style={{ color: 'var(--muted)', fontSize: 12, padding: '8px 0' }}>No tasks yet. Create one in the Tasks tab.</div>
              ) : recent.map((t, i) => (
                <div key={i} style={{ ...s.aitem, borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={s.adot(STATUS_COLOR[t.status] || 'var(--muted)')} />
                  <div>
                    <div style={s.atext}><strong>{(t.goal || '').slice(0, 50)}{t.goal?.length > 50 ? '…' : ''}</strong></div>
                    <div style={s.atime}>{t.status} · {t.created_at || '—'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={s.dcard}>
            <div style={s.dchdr}>🔧 Registered Skills ({skills.length})</div>
            <div style={s.dcbody}>
              {skills.slice(0, 8).map((sk, i) => (
                <div key={sk.name} style={s.sbarRow}>
                  <div style={s.sbarTop}>
                    <span style={s.sbarNm}>{sk.name}</span>
                    <span style={{ fontSize: 11, color: 'var(--muted2)' }}>{sk.name?.startsWith('mcp__') ? 'mcp' : sk.type || 'builtin'}</span>
                  </div>
                  <div style={s.sbarBg}><div style={s.sbarFill(Math.max(20, 100 - i * 11))} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MCP Servers */}
        {Object.keys(mcp).length > 0 && (
          <div style={s.dcard}>
            <div style={s.dchdr}>🔌 MCP Servers</div>
            <div style={{ padding: '14px 16px' }}>
              <div style={s.mcpgrid}>
                {Object.entries(mcp).map(([name, info]) => (
                  <div key={name} style={s.mcpcard(info.connected)}>
                    <div style={s.mcpbadge(info.connected)}>{info.connected ? 'CONNECTED' : 'OFFLINE'}</div>
                    <div style={s.mcpname}>{name}</div>
                    <div style={s.mcptools}>{info.tools} tools available</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
