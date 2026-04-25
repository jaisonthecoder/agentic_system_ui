import { useState, useEffect, useCallback } from 'react'
import {
  fetchMetrics, fetchTasks, fetchSkills, fetchMcpServers,
  fetchHealth, fetchLLMConfig, updateLLMConfig,
} from '../../api'
import type { Metrics, Task, Skill, McpServers, HealthData, LLMConfig } from '../../types'
import styles from './DashboardView.module.scss'

const PROVIDER_ICON:  Record<string, string> = { gemini: '✦', anthropic: '◆', openai: '⬡', ollama: '🦙' }
const PROVIDER_COLOR: Record<string, string> = { gemini: '#4285F4', anthropic: '#d97706', openai: '#10b981', ollama: '#8b5cf6' }
const STATUS_COLOR:   Record<string, string> = { running: 'var(--blue)', done: 'var(--accent)', failed: 'var(--danger)' }

export default function DashboardView() {
  const [metrics,  setMetrics]  = useState<Metrics>({})
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [skills,   setSkills]   = useState<Skill[]>([])
  const [mcp,      setMcp]      = useState<McpServers>({})
  const [health,   setHealth]   = useState<HealthData | null>(null)
  const [llmConfig,setLLMConfig]= useState<LLMConfig | null>(null)
  const [loading,  setLoading]  = useState(true)
  const [switching,setSwitching]= useState(false)
  const [switchMsg,setSwitchMsg]= useState<{ ok: boolean; text: string } | null>(null)
  const [selProvider, setSelProvider] = useState<string | null>(null)
  const [selModel,    setSelModel]    = useState<string | null>(null)

  const load = useCallback(async () => {
    const [m, t, sk, mc, h, lc] = await Promise.allSettled([
      fetchMetrics(), fetchTasks(), fetchSkills(), fetchMcpServers(), fetchHealth(), fetchLLMConfig(),
    ])
    if (m.status  === 'fulfilled') setMetrics(m.value)
    if (t.status  === 'fulfilled') setTasks(t.value)
    if (sk.status === 'fulfilled') setSkills(sk.value)
    if (mc.status === 'fulfilled') setMcp(mc.value)
    if (h.status  === 'fulfilled') setHealth(h.value)
    if (lc.status === 'fulfilled') {
      setLLMConfig(lc.value)
      setSelProvider(lc.value.provider)
      setSelModel(lc.value.model)
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const handleSwitch = async () => {
    if (!selProvider || !selModel) return
    setSwitching(true)
    try {
      const res = await updateLLMConfig(selProvider, selModel)
      setSwitchMsg({ ok: true, text: `Switched to ${res.provider} / ${res.model}` })
      const [h, lc] = await Promise.allSettled([fetchHealth(), fetchLLMConfig()])
      if (h.status  === 'fulfilled') setHealth(h.value)
      if (lc.status === 'fulfilled') setLLMConfig(lc.value)
    } catch (e) {
      setSwitchMsg({ ok: false, text: `Error: ${e instanceof Error ? e.message : String(e)}` })
    }
    setSwitching(false)
    setTimeout(() => setSwitchMsg(null), 4_000)
  }

  const running    = tasks.filter((t) => t.status === 'running').length
  const totalTasks = (metrics.total_tasks ?? tasks.length) as number
  const latency    = metrics.avg_latency_ms ? `${Math.round(metrics.avg_latency_ms as number)}ms` : '—'
  const cost       = metrics.total_cost_usd != null ? `$${Number(metrics.total_cost_usd).toFixed(4)}` : '$0.00'

  const METRIC_CARDS = [
    { label: 'Total Tasks',  val: totalTasks, color: 'var(--accent)', sub: 'all time'         },
    { label: 'Running Now',  val: running,    color: 'var(--blue)',   sub: 'active agents'    },
    { label: 'Avg Latency',  val: latency,    color: 'var(--purple)', sub: 'milliseconds'     },
    { label: 'Total Cost',   val: cost,       color: 'var(--amber)',  sub: 'USD this session' },
  ]

  const topSkills = skills.slice(0, 5)
  const maxCalls  = Math.max(...topSkills.map((s) => s.call_count ?? 1), 1)

  const mcpServers = Object.entries(mcp.servers ?? {})

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <div className={styles.title}>Dashboard</div>
          <div className={styles.desc}>Live metrics from Python backend</div>
        </div>
        <button className={styles.btnSecondary} onClick={load}>↻ Refresh</button>
      </div>

      <div className={styles.body}>
        {/* Metric cards */}
        <div className={styles.metricsRow}>
          {METRIC_CARDS.map((m) => (
            <div key={m.label} className={styles.metricCard}>
              <div className={styles.metricLabel}>{m.label}</div>
              <div className={styles.metricValue} style={{ color: m.color }}>{loading ? '—' : m.val}</div>
              <div className={styles.metricSub}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* LLM switcher */}
        {llmConfig && (
          <div className={styles.llmCard}>
            <div className={styles.llmHeader}>
              <span style={{ color: PROVIDER_COLOR[health?.llm_provider ?? ''] ?? 'var(--accent)' }}>
                {PROVIDER_ICON[health?.llm_provider ?? ''] ?? '🤖'}
              </span>
              LLM Provider
              <span className={styles.llmBadge}>
                ● {health?.llm_provider?.toUpperCase() ?? '—'} · {health?.llm_model ?? '—'}
              </span>
            </div>
            <div className={styles.llmBody}>
              <div>
                <div className={styles.subLabel}>Select Provider</div>
                <div className={styles.providerGrid}>
                  {(llmConfig.available_providers ?? []).map((p) => {
                    const col    = PROVIDER_COLOR[p] ?? 'var(--accent)'
                    const hasKey = (llmConfig.api_keys_set ?? {})[p]
                    return (
                      <button
                        key={p}
                        className={`${styles.providerBtn}${selProvider === p ? ` ${styles.active}` : ''}`}
                        style={selProvider === p ? { borderColor: col, background: `${col}18` } : {}}
                        onClick={() => {
                          setSelProvider(p)
                          setSelModel((llmConfig.models_by_provider?.[p] ?? [])[0] ?? '')
                          setSwitchMsg(null)
                        }}
                      >
                        <span className={styles.providerIcon} style={{ color: col }}>
                          {PROVIDER_ICON[p] ?? '🤖'}
                        </span>
                        <span className={styles.providerName} style={{ color: selProvider === p ? col : 'var(--text)' }}>{p}</span>
                        <span
                          className={styles.providerKey}
                          style={{
                            background: hasKey ? 'var(--accentDim)' : 'var(--dangerDim)',
                            color: hasKey ? 'var(--accent)' : 'var(--danger)',
                          }}
                        >
                          {p === 'ollama' ? 'local' : hasKey ? 'key set' : 'no key'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selProvider && (
                <div>
                  <div className={styles.subLabel}>Select Model</div>
                  <select
                    className={styles.modelSelect}
                    value={selModel ?? ''}
                    onChange={(e) => setSelModel(e.target.value)}
                  >
                    {(llmConfig.models_by_provider?.[selProvider] ?? []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className={styles.switchRow}>
                <button
                  className={styles.switchBtn}
                  onClick={handleSwitch}
                  disabled={switching || !selProvider || !selModel}
                >
                  {switching ? 'Switching…' : 'Apply'}
                </button>
                {switchMsg && (
                  <span className={styles.switchMsg} style={{ color: switchMsg.ok ? 'var(--accent)' : 'var(--danger)' }}>
                    {switchMsg.text}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Detail grid */}
        <div className={styles.detailGrid}>
          <div className={styles.dCard}>
            <div className={styles.dCardHeader}>Recent Tasks</div>
            <div className={styles.dCardBody}>
              {tasks.slice(0, 5).map((t) => (
                <div key={t.id} className={styles.activityItem}>
                  <div className={styles.activityDot} style={{ background: STATUS_COLOR[t.status] ?? 'var(--muted)' }} />
                  <div>
                    <div className={styles.activityText}>{t.goal}</div>
                    <div className={styles.activityTime}>{t.created_at ?? '—'} · {t.status}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.dCard}>
            <div className={styles.dCardHeader}>Top Skills</div>
            <div className={styles.dCardBody}>
              {topSkills.map((s) => (
                <div key={s.name} className={styles.barRow}>
                  <div className={styles.barTop}>
                    <span className={styles.barName}>{s.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--muted2)' }}>{s.call_count ?? 0}</span>
                  </div>
                  <div className={styles.barBg}>
                    <div className={styles.barFill} style={{ width: `${((s.call_count ?? 0) / maxCalls) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MCP servers */}
        {mcpServers.length > 0 && (
          <>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: '10px' }}>
              MCP Servers
            </div>
            <div className={styles.mcpGrid}>
              {mcpServers.map(([name, srv]) => {
                const connected = !!(srv as { connected?: boolean }).connected
                return (
                  <div key={name} className={`${styles.mcpCard}${connected ? ` ${styles.connected}` : ''}`}>
                    <div className={styles.mcpBadge} style={{
                      background: connected ? 'rgba(110,231,183,.15)' : 'rgba(91,107,128,.15)',
                      color: connected ? 'var(--accent)' : 'var(--muted)',
                      borderColor: connected ? 'rgba(110,231,183,.3)' : 'var(--border2)',
                    }}>
                      {connected ? '● connected' : '○ disconnected'}
                    </div>
                    <div className={styles.mcpName}>{name}</div>
                    <div className={styles.mcpTools}>
                      {((srv as { tools?: string[] }).tools?.length ?? 0)} tools
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
