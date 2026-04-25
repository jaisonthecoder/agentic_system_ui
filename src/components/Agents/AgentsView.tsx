import { useState, useEffect, useCallback } from 'react'
import { fetchAgents, runAgent, updateAgent, createAgent, fetchAgentRuns, fetchStoreSkills } from '../../api'
import type { Agent, Skill } from '../../types'
import GoalModal from '../common/GoalModal'
import styles from './AgentsView.module.scss'

const ARCHETYPE_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  autonomous: { label: 'Autonomous',   color: 'var(--accent)',  bg: 'var(--accentDim)' },
  assistant:  { label: 'Assistant',    color: 'var(--amber)',   bg: 'var(--amberDim)'  },
  pipeline:   { label: 'Pipeline',     color: 'var(--purple)',  bg: 'var(--purpleDim)' },
  event:      { label: 'Event-driven', color: 'var(--danger)',  bg: 'var(--dangerDim)' },
}

interface AgentsViewProps {
  onQuickRun: (goal: string) => void
}

interface AgentRun {
  id: string
  goal: string
  status: string
  created_at?: string
}

interface DrawerState {
  agent: Agent
  runs: AgentRun[]
  loading: boolean
}

export default function AgentsView({ onQuickRun }: AgentsViewProps) {
  const [agents, setAgents]       = useState<Agent[]>([])
  const [allSkills, setAllSkills] = useState<Skill[]>([])
  const [loading, setLoading]     = useState(true)
  const [runTarget, setRunTarget]     = useState<Agent | null>(null)
  const [configTarget, setConfigTarget] = useState<Agent | null>(null)
  const [showCreate, setShowCreate]   = useState(false)
  const [drawer, setDrawer]           = useState<DrawerState | null>(null)

  const load = useCallback(async () => {
    try {
      const [ag, sk] = await Promise.all([fetchAgents(), fetchStoreSkills()])
      setAgents(ag)
      setAllSkills(sk)
    } catch { /* network error — keep existing data */ }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const openDrawer = async (agent: Agent) => {
    setDrawer({ agent, runs: [], loading: true })
    try {
      const d = await fetchAgentRuns(agent.id)
      setDrawer({ agent, runs: (d.runs ?? []) as AgentRun[], loading: false })
    } catch {
      setDrawer({ agent, runs: [], loading: false })
    }
  }

  const handleRun = async (agentId: string, goal: string) => {
    await runAgent(agentId, goal)
    onQuickRun(goal)
  }

  const handleSaveConfig = async (id: string, data: Partial<Agent>) => {
    await updateAgent(id, data)
    setConfigTarget(null)
    load()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>Agents</div>
        <button className={styles.addBtn} onClick={() => setShowCreate(true)}>+ Create Agent</button>
      </div>

      <div className={styles.grid}>
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🤖</div>
            <div>Loading agents…</div>
          </div>
        ) : agents.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🤖</div>
            <div>No agents yet — create one!</div>
          </div>
        ) : (
          agents.map((agent) => {
            const at = ARCHETYPE_STYLE[agent.archetype] ?? ARCHETYPE_STYLE.autonomous
            return (
              <div
                key={agent.id}
                className={styles.card}
                onClick={() => openDrawer(agent)}
              >
                <div className={styles.iconBox} style={{ background: at.bg }}>
                  {agent.icon}
                </div>
                <div>
                  <div className={styles.cardName}>{agent.name}</div>
                  <div className={styles.archTag} style={{ color: at.color }}>{at.label}</div>
                </div>
                <div className={styles.cardDesc}>{agent.description}</div>
                {(agent.skills?.length ?? 0) > 0 && (
                  <div className={styles.skillChips}>
                    {(agent.skills ?? []).slice(0, 4).map((s) => (
                      <span key={s} className={styles.chip}>{s}</span>
                    ))}
                    {(agent.skills?.length ?? 0) > 4 && (
                      <span className={styles.chip}>+{(agent.skills?.length ?? 0) - 4}</span>
                    )}
                  </div>
                )}
                <div className={styles.cardFooter}>
                  <button
                    className={styles.runBtn}
                    style={{ background: at.bg, color: at.color }}
                    onClick={(e) => { e.stopPropagation(); setRunTarget(agent) }}
                  >
                    ▶ Run
                  </button>
                  <button
                    className={styles.cfgBtn}
                    onClick={(e) => { e.stopPropagation(); setConfigTarget(agent) }}
                  >
                    ⚙ Config
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create Agent Modal */}
      {showCreate && (
        <CreateAgentModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load() }}
        />
      )}

      {/* Run Goal Modal */}
      {runTarget && (
        <GoalModal
          icon={runTarget.icon}
          title={`Run ${runTarget.name}`}
          subtitle={runTarget.description}
          placeholder={`What should ${runTarget.name} do?`}
          onClose={() => setRunTarget(null)}
          onConfirm={(goal) => handleRun(runTarget.id, goal)}
        />
      )}

      {/* Config Modal */}
      {configTarget && (
        <AgentConfigModal
          agent={configTarget}
          allSkills={allSkills}
          onClose={() => setConfigTarget(null)}
          onSaved={(data) => handleSaveConfig(configTarget.id, data)}
        />
      )}

      {/* Run history drawer */}
      {drawer && (
        <div className={styles.drawer} role="complementary" aria-label="Agent run history">
          <div className={styles.drawerHeader}>
            <div className={styles.drawerTitle}>{drawer.agent.icon} {drawer.agent.name}</div>
            <button className={styles.drawerClose} onClick={() => setDrawer(null)} aria-label="Close">✕</button>
          </div>
          <div className={styles.drawerBody}>
            <div className={styles.sectionCard}>
              <span className={styles.sectionLabel}>Recent Runs</span>
              {drawer.loading ? (
                <div>Loading…</div>
              ) : drawer.runs.length === 0 ? (
                <div style={{ fontSize: '12px', color: 'var(--muted2)' }}>No runs yet</div>
              ) : (
                drawer.runs.map((r) => (
                  <div key={r.id} className={styles.runRow}>
                    <div className={styles.runGoal}>{r.goal}</div>
                    <div
                      className={styles.runStatus}
                      style={{ color: r.status === 'done' ? 'var(--accent)' : 'var(--danger)' }}
                    >
                      {r.status}
                    </div>
                    <div className={styles.runMeta}>{r.created_at ?? '—'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Config Modal ─────────────────────────────────────────────────────────────
interface ConfigModalProps {
  agent: Agent
  allSkills: Skill[]
  onClose: () => void
  onSaved: (data: Partial<Agent>) => void
}

function AgentConfigModal({ agent, onClose, onSaved }: ConfigModalProps) {
  const [form, setForm] = useState({
    name:          agent.name,
    icon:          agent.icon,
    description:   agent.description ?? '',
    system_prompt: (agent.system_prompt as string) ?? '',
    max_steps:     (agent.max_steps as number) ?? 10,
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    await onSaved(form)
    setSaving(false)
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div className={styles.modal}>
        <div className={styles.modalTitle}>⚙ Configure {agent.name}</div>
        <label className={styles.fieldLabel}>Display Name</label>
        <input className={styles.input} value={form.name} onChange={(e) => set('name', e.target.value)} />
        <label className={styles.fieldLabel}>System Prompt</label>
        <textarea className={styles.textarea} rows={5} value={form.system_prompt} onChange={(e) => set('system_prompt', e.target.value)} />
        <label className={styles.fieldLabel}>Max Steps</label>
        <input className={styles.input} type="number" min={1} max={50} value={form.max_steps} onChange={(e) => set('max_steps', Number(e.target.value))} />
        <div className={styles.modalBtns}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Create Agent Modal ───────────────────────────────────────────────────────
const ARCHETYPES: Array<{ id: Agent['archetype']; icon: string; label: string; desc: string }> = [
  { id: 'autonomous', icon: '🤖', label: 'Autonomous',   desc: 'Long-horizon, unattended goal execution' },
  { id: 'assistant',  icon: '💬', label: 'Assistant',    desc: 'Interactive Q&A with memory across turns' },
  { id: 'pipeline',   icon: '⛓', label: 'Pipeline',     desc: 'Fixed sequence of deterministic skill calls' },
  { id: 'event',      icon: '⚡', label: 'Event-driven', desc: 'Sleeps until a trigger fires (webhook, schedule)' },
]

interface CreateAgentModalProps {
  onClose: () => void
  onCreated: () => void
}

function CreateAgentModal({ onClose, onCreated }: CreateAgentModalProps) {
  const [form, setForm] = useState({
    archetype:     'autonomous' as Agent['archetype'],
    name:          '',
    icon:          '🤖',
    description:   '',
    system_prompt: 'You are a helpful AI agent. Complete tasks efficiently and accurately.',
    max_steps:     10,
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState<string | null>(null)

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const save = async () => {
    if (!form.name.trim()) { setError('Name is required'); return }
    setSaving(true)
    setError(null)
    try {
      await createAgent(form)
      onCreated()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create agent')
      setSaving(false)
    }
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Create Agent"
    >
      <div className={styles.modal}>
        <div className={styles.modalTitle}>🤖 Create Agent</div>

        {/* Archetype picker */}
        <label className={styles.fieldLabel}>Archetype</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {ARCHETYPES.map((a) => {
            const at = ARCHETYPE_STYLE[a.id] ?? ARCHETYPE_STYLE.autonomous
            const sel = form.archetype === a.id
            return (
              <button
                key={a.id}
                onClick={() => set('archetype', a.id)}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                  border: `1px solid ${sel ? at.color : 'var(--border2)'}`,
                  background: sel ? at.bg : 'var(--panel2)',
                  transition: 'all .15s',
                }}
              >
                <div style={{ fontSize: 18, marginBottom: 4 }}>{a.icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: sel ? at.color : 'var(--text)' }}>{a.label}</div>
                <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 2, lineHeight: 1.4 }}>{a.desc}</div>
              </button>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: '0 0 60px' }}>
            <label className={styles.fieldLabel}>Icon</label>
            <input className={styles.input} value={form.icon} onChange={(e) => set('icon', e.target.value)}
              style={{ textAlign: 'center', fontSize: 20 }} maxLength={2} />
          </div>
          <div style={{ flex: 1 }}>
            <label className={styles.fieldLabel}>Name *</label>
            <input className={styles.input} placeholder="e.g. PR Reviewer" value={form.name}
              onChange={(e) => set('name', e.target.value)} autoFocus />
          </div>
        </div>

        <label className={styles.fieldLabel}>Description</label>
        <input className={styles.input} placeholder="What does this agent do?" value={form.description}
          onChange={(e) => set('description', e.target.value)} style={{ marginBottom: 14 }} />

        <label className={styles.fieldLabel}>System Prompt</label>
        <textarea className={styles.textarea} rows={4} value={form.system_prompt}
          onChange={(e) => set('system_prompt', e.target.value)} />

        <label className={styles.fieldLabel} style={{ marginTop: 14 }}>Max Steps</label>
        <input className={styles.input} type="number" min={1} max={50} value={form.max_steps}
          onChange={(e) => set('max_steps', Number(e.target.value))} />

        {error && (
          <div style={{ marginTop: 10, padding: '8px 12px', borderRadius: 8, fontSize: 12,
            background: 'var(--dangerDim)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
            {error}
          </div>
        )}

        <div className={styles.modalBtns} style={{ marginTop: 16 }}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button className={styles.btnPrimary} onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? 'Creating…' : '🤖 Create Agent'}
          </button>
        </div>
      </div>
    </div>
  )
}

