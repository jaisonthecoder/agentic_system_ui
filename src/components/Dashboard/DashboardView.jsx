import { useState, useEffect } from 'react'
import { fetchMetrics, fetchTasks, fetchSkills, fetchMcpServers } from '../../api'

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
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const [m, t, sk, mc] = await Promise.allSettled([fetchMetrics(), fetchTasks(), fetchSkills(), fetchMcpServers()])
      if (m.status === 'fulfilled') setMetrics(m.value)
      if (t.status === 'fulfilled') setTasks(t.value)
      if (sk.status === 'fulfilled') setSkills(sk.value)
      if (mc.status === 'fulfilled') setMcp(mc.value)
    } catch {}
    setLoading(false)
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
