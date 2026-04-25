import { useState, useEffect } from 'react'
import {
  fetchConnectors, fetchConnectorTemplates, createConnector,
  testConnector, deleteConnector,
} from '../../api'
import type { Connector, ConnectorTemplate } from '../../types'
import styles from './ConnectorView.module.scss'

const STATUS_COLOR: Record<string, string> = {
  connected: '#4ade80',
  error:     '#f87171',
  untested:  'var(--muted2)',
}

const CONN_TYPES = [
  { id: 'rest',      icon: '🌐', label: 'REST API'  },
  { id: 'database',  icon: '🗄️', label: 'Database'  },
  { id: 'storage',   icon: '📦', label: 'Storage'   },
  { id: 'messaging', icon: '📨', label: 'Messaging' },
]

const AUTH_TYPES = ['none', 'bearer', 'api_key', 'basic', 'oauth2_client']

interface AuthFields {
  token: string
  api_key: string
  header_name: string
  username: string
  password: string
}

function AddModal({
  template,
  onClose,
  onSaved,
}: {
  template?: ConnectorTemplate | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    name:      template?.id ?? '',
    type:      template?.type ?? 'rest',
    base_url:  template?.base_url ?? '',
    auth_type: template?.auth_type ?? 'none',
    timeout_s: template?.timeout_s ?? 30,
    headers:   template?.headers ?? {},
    credentials: {} as Record<string, string>,
  })
  const [auth, setAuth] = useState<AuthFields>({ token: '', api_key: '', header_name: 'X-API-Key', username: '', password: '' })
  const [saving,  setSaving]  = useState(false)
  const [testing, setTesting] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)
  const [testRes, setTestRes] = useState<{ connected: boolean; message?: string } | null>(null)

  const set = (k: string, v: unknown) => setForm((p) => ({ ...p, [k]: v }))

  const buildCreds = () => {
    if (form.auth_type === 'bearer')  return { token: auth.token }
    if (form.auth_type === 'api_key') return { api_key: auth.api_key, header_name: auth.header_name }
    if (form.auth_type === 'basic')   return { username: auth.username, password: auth.password }
    return {}
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const r = await createConnector({ ...form, credentials: buildCreds() })
      setSavedId(r.id)
      onSaved()
    } catch { /* surface error via test */ }
    setSaving(false)
  }

  const handleTest = async () => {
    if (!savedId) { setTestRes({ connected: false, message: 'Save first, then test.' }); return }
    setTesting(true)
    const r = await testConnector(savedId)
    setTestRes(r)
    setTesting(false)
  }

  const isGH = form.auth_type === 'bearer' && (form.name.includes('github') || form.base_url.includes('github'))

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true">
      <div className={styles.modal}>
        <div className={styles.modalTitle}>
          {template ? `${template.icon} Connect ${template.label}` : '🔗 Add Connector'}
        </div>

        {!template && (
          <div className={styles.typeRow}>
            {CONN_TYPES.map((t) => (
              <button key={t.id} className={`${styles.typeBtn}${form.type === t.id ? ` ${styles.active}` : ''}`} onClick={() => set('type', t.id)}>
                {t.icon}<br />{t.label}
              </button>
            ))}
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Connector Name</label>
          <input className={styles.input} placeholder="e.g. github_prod" value={form.name} onChange={(e) => set('name', e.target.value)} />
        </div>
        <div className={styles.field}>
          <label className={styles.label}>Base URL</label>
          <input className={styles.input} placeholder="https://api.example.com" value={form.base_url} onChange={(e) => set('base_url', e.target.value)} />
        </div>
        {!template && (
          <div className={styles.field}>
            <label className={styles.label}>Auth Type</label>
            <select className={styles.input} value={form.auth_type} onChange={(e) => set('auth_type', e.target.value)}>
              {AUTH_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        )}

        {form.auth_type === 'bearer' && (
          <div className={styles.field}>
            <label className={styles.label}>{isGH ? 'GitHub Personal Access Token' : 'Bearer Token'}</label>
            <input className={styles.input} type="password" placeholder={isGH ? 'ghp_xxxx…' : 'eyJ…'} value={auth.token} onChange={(e) => setAuth((p) => ({ ...p, token: e.target.value }))} />
            {isGH && <p className={styles.hint}>Scopes needed: repo, read:user, read:org</p>}
          </div>
        )}
        {form.auth_type === 'api_key' && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>API Key</label>
              <input className={styles.input} type="password" value={auth.api_key} onChange={(e) => setAuth((p) => ({ ...p, api_key: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Header Name</label>
              <input className={styles.input} value={auth.header_name} onChange={(e) => setAuth((p) => ({ ...p, header_name: e.target.value }))} />
            </div>
          </>
        )}
        {form.auth_type === 'basic' && (
          <>
            <div className={styles.field}>
              <label className={styles.label}>Username</label>
              <input className={styles.input} value={auth.username} onChange={(e) => setAuth((p) => ({ ...p, username: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Password</label>
              <input className={styles.input} type="password" value={auth.password} onChange={(e) => setAuth((p) => ({ ...p, password: e.target.value }))} />
            </div>
          </>
        )}

        <div className={styles.modalBtns}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.saveBtn} onClick={handleTest} disabled={testing || !savedId}>
            {testing ? 'Testing…' : 'Test'}
          </button>
          <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
        {testRes && (
          <div className={styles.testRes} style={{ color: testRes.connected ? 'var(--accent)' : 'var(--danger)' }}>
            {testRes.connected ? '✓ Connected' : '✗ ' + testRes.message}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConnectorView() {
  const [connectors, setConnectors] = useState<Connector[]>([])
  const [templates,  setTemplates]  = useState<ConnectorTemplate[]>([])
  const [showModal,  setShowModal]  = useState(false)
  const [tplTarget,  setTplTarget]  = useState<ConnectorTemplate | null>(null)
  const [testResults,setTestResults]= useState<Record<string, { connected: boolean; message?: string }>>({})
  const [testing,    setTesting]    = useState<string | null>(null)

  const load = async () => {
    try {
      const [c, t] = await Promise.all([fetchConnectors(), fetchConnectorTemplates()])
      setConnectors(c)
      setTemplates(t.templates ?? [])
    } catch { /* network error */ }
  }

  useEffect(() => { load() }, [])

  const handleTest = async (id: string) => {
    setTesting(id)
    try {
      const r = await testConnector(id)
      setTestResults((p) => ({ ...p, [id]: r }))
    } catch (e) {
      setTestResults((p) => ({ ...p, [id]: { connected: false, message: String(e) } }))
    }
    setTesting(null)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this connector?')) return
    await deleteConnector(id)
    load()
  }

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <span className={styles.title}>Connectors</span>
        <button className={styles.addBtn} onClick={() => { setTplTarget(null); setShowModal(true) }}>+ Add Connector</button>
      </div>

      <div className={styles.body}>
        {templates.length > 0 && (
          <div>
            <span className={styles.tplLabel}>Quick Connect</span>
            <div className={styles.tplGrid}>
              {templates.map((t) => (
                <div key={t.id} className={styles.tplCard} onClick={() => { setTplTarget(t); setShowModal(true) }}>
                  <div className={styles.tplIcon}>{t.icon}</div>
                  <div className={styles.tplName}>{t.label}</div>
                  <div className={styles.tplDesc}>{t.id}</div>
                  {t.skills_preview && (
                    <div className={styles.tplSkills}>{t.skills_preview.length} skills</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {connectors.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>🔗</div>
            <div>No connectors yet</div>
          </div>
        ) : (
          <div className={styles.list}>
            {connectors.map((c) => {
              const tr = testResults[c.id]
              return (
                <div key={c.id} className={styles.card}>
                  <div className={styles.cardRow}>
                    <div className={styles.statusDot} style={{ background: STATUS_COLOR[c.status ?? 'untested'] }} />
                    <div className={styles.info}>
                      <div className={styles.cName}>{c.name}<span className={styles.badge}>{c.type}</span></div>
                      <div className={styles.cUrl}>{c.base_url}</div>
                    </div>
                    <div className={styles.cardBtns}>
                      <button className={styles.cardBtn} onClick={() => handleTest(c.id)} disabled={testing === c.id}>
                        {testing === c.id ? '…' : 'Test'}
                      </button>
                      <button className={`${styles.cardBtn} ${styles.danger}`} onClick={() => handleDelete(c.id)}>Delete</button>
                    </div>
                  </div>
                  {c.exposed_skills && c.exposed_skills.length > 0 && (
                    <div>{c.exposed_skills.map((s) => <span key={s} className={styles.skillPill}>{s}</span>)}</div>
                  )}
                  {tr && (
                    <div className={styles.testResult} style={{ color: tr.connected ? 'var(--accent)' : 'var(--danger)' }}>
                      {tr.connected ? '✓ Connected' : '✗ ' + tr.message}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showModal && (
        <AddModal
          template={tplTarget}
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); load() }}
        />
      )}
    </div>
  )
}
