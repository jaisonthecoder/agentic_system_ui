import { useState, useEffect } from 'react'
import { fetchConnectors, createConnector, testConnector, deleteConnector } from '../../api'

const AUTH_TYPES = ['none', 'bearer', 'api_key', 'basic', 'oauth2_client']
const CONN_TYPES = [
  { id: 'rest',      icon: '🌐', label: 'REST API' },
  { id: 'database',  icon: '🗄️',  label: 'Database' },
  { id: 'storage',   icon: '📦', label: 'Storage' },
  { id: 'messaging', icon: '📨', label: 'Messaging' },
]

const STATUS_COLOR = {
  connected: '#4ade80',
  error:     '#f87171',
  untested:  'var(--muted2)',
}

const s = {
  wrap:   { display:'flex', flexDirection:'column', height:'100%' },
  hdr:    { padding:'18px 24px 14px', borderBottom:'1px solid var(--border)',
            display:'flex', alignItems:'center', gap:12, flexShrink:0 },
  title:  { fontSize:20, fontWeight:800, letterSpacing:-0.5, flex:1 },
  addBtn: { padding:'8px 16px', borderRadius:8, fontSize:13, fontWeight:700,
            background:'var(--accent)', color:'#000', border:'none', cursor:'pointer' },
  body:   { flex:1, overflowY:'auto', padding:'20px 24px' },
  list:   { display:'flex', flexDirection:'column', gap:10 },
  card:   { background:'var(--panel)', border:'1px solid var(--border)', borderRadius:12,
            padding:'14px 18px', display:'flex', alignItems:'center', gap:14 },
  dot:    (status) => ({
            width:10, height:10, borderRadius:'50%', flexShrink:0,
            background: STATUS_COLOR[status] || STATUS_COLOR.untested,
          }),
  info:   { flex:1, minWidth:0 },
  name:   { fontSize:14, fontWeight:700 },
  url:    { fontSize:11, color:'var(--muted2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' },
  badge:  { fontSize:10, fontWeight:700, padding:'2px 8px', borderRadius:4,
            background:'var(--panel2)', color:'var(--muted2)', marginLeft:6 },
  btns:   { display:'flex', gap:8, flexShrink:0 },
  btn:    (danger) => ({
            padding:'6px 14px', borderRadius:7, fontSize:12, fontWeight:600, cursor:'pointer',
            background: danger ? 'transparent' : 'var(--panel2)',
            color:      danger ? '#ef4444' : 'var(--text)',
            border:     danger ? '1px solid #ef444488' : '1px solid var(--border2)',
          }),
  empty:  { display:'flex', flexDirection:'column', alignItems:'center',
            justifyContent:'center', height:200, gap:10, color:'var(--muted)' },
  // Modal
  overlay:{ position:'fixed', inset:0, background:'#0008', zIndex:200,
            display:'flex', alignItems:'center', justifyContent:'center' },
  modal:  { background:'var(--panel)', borderRadius:14, padding:28, width:460,
            border:'1px solid var(--border)', maxHeight:'90vh', overflowY:'auto' },
  mTitle: { fontSize:17, fontWeight:800, marginBottom:20 },
  field:  { marginBottom:14 },
  label:  { fontSize:11, fontWeight:600, color:'var(--muted2)', marginBottom:4, display:'block' },
  input:  { padding:'8px 12px', borderRadius:8, fontSize:13, background:'var(--panel2)',
            border:'1px solid var(--border2)', color:'var(--text)', width:'100%',
            outline:'none', boxSizing:'border-box' },
  typeRow:{ display:'flex', gap:8, marginBottom:14 },
  typeBtn:(a) => ({
            flex:1, padding:'10px 0', borderRadius:8, fontSize:12, fontWeight:700,
            cursor:'pointer', textAlign:'center',
            background: a ? 'var(--accent-dim)' : 'var(--panel2)',
            color:      a ? 'var(--accent)' : 'var(--muted2)',
            border:     a ? '1px solid var(--accent)' : '1px solid var(--border2)',
          }),
  mBtns:  { display:'flex', gap:10, marginTop:20 },
  saveBtn:{ flex:1, padding:'10px', borderRadius:8, fontSize:13, fontWeight:700,
            background:'var(--accent)', color:'#000', border:'none', cursor:'pointer' },
  cancelBtn:{ padding:'10px 18px', borderRadius:8, fontSize:13, fontWeight:600,
              background:'var(--panel2)', color:'var(--text)',
              border:'1px solid var(--border2)', cursor:'pointer' },
  testRes:{ marginTop:10, padding:'8px 12px', borderRadius:8, fontSize:12,
            background:'var(--panel2)', lineHeight:1.5 },
}

function AddConnectorModal({ onClose, onSaved }) {
  const [form, setForm] = useState({
    name:'', type:'rest', base_url:'', auth_type:'none',
    credentials:{}, headers:{}, timeout_s:30,
  })
  const [authFields, setAuthFields] = useState({ token:'', api_key:'', header_name:'X-API-Key', username:'', password:'' })
  const [saving, setSaving]   = useState(false)
  const [testing, setTesting] = useState(false)
  const [testRes, setTestRes] = useState(null)
  const [savedId, setSavedId] = useState(null)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const buildCredentials = () => {
    if (form.auth_type === 'bearer')  return { token: authFields.token }
    if (form.auth_type === 'api_key') return { api_key: authFields.api_key, header_name: authFields.header_name }
    if (form.auth_type === 'basic')   return { username: authFields.username, password: authFields.password }
    return {}
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await createConnector({ ...form, credentials: buildCredentials() })
    setSaving(false)
    setSavedId(result.id)
    onSaved()
  }

  const handleTest = async () => {
    if (!savedId) { setTestRes({ connected: false, message: 'Save the connector first.' }); return }
    setTesting(true)
    const r = await testConnector(savedId)
    setTestRes(r)
    setTesting(false)
  }

  return (
    <div style={s.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modal}>
        <div style={s.mTitle}>🔗 Add Connector</div>

        <div style={s.typeRow}>
          {CONN_TYPES.map(t => (
            <button key={t.id} style={s.typeBtn(form.type === t.id)} onClick={() => set('type', t.id)}>
              {t.icon}<br />{t.label}
            </button>
          ))}
        </div>

        <div style={s.field}>
          <label style={s.label}>Name</label>
          <input style={s.input} placeholder="my_api_connector" value={form.name} onChange={e => set('name', e.target.value)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Base URL</label>
          <input style={s.input} placeholder="https://api.example.com" value={form.base_url} onChange={e => set('base_url', e.target.value)} />
        </div>
        <div style={s.field}>
          <label style={s.label}>Auth Type</label>
          <select style={s.input} value={form.auth_type} onChange={e => set('auth_type', e.target.value)}>
            {AUTH_TYPES.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {form.auth_type === 'bearer' && (
          <div style={s.field}>
            <label style={s.label}>Bearer Token</label>
            <input style={s.input} type="password" placeholder="eyJ..." value={authFields.token}
              onChange={e => setAuthFields(p => ({ ...p, token: e.target.value }))} />
          </div>
        )}
        {form.auth_type === 'api_key' && (<>
          <div style={s.field}>
            <label style={s.label}>API Key</label>
            <input style={s.input} type="password" placeholder="sk-…" value={authFields.api_key}
              onChange={e => setAuthFields(p => ({ ...p, api_key: e.target.value }))} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Header Name</label>
            <input style={s.input} value={authFields.header_name}
              onChange={e => setAuthFields(p => ({ ...p, header_name: e.target.value }))} />
          </div>
        </>)}
        {form.auth_type === 'basic' && (<>
          <div style={s.field}>
            <label style={s.label}>Username</label>
            <input style={s.input} value={authFields.username}
              onChange={e => setAuthFields(p => ({ ...p, username: e.target.value }))} />
          </div>
          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" value={authFields.password}
              onChange={e => setAuthFields(p => ({ ...p, password: e.target.value }))} />
          </div>
        </>)}

        <div style={s.field}>
          <label style={s.label}>Timeout (seconds)</label>
          <input style={s.input} type="number" value={form.timeout_s}
            onChange={e => set('timeout_s', parseInt(e.target.value) || 30)} />
        </div>

        {testRes && (
          <div style={{ ...s.testRes, color: testRes.connected ? '#4ade80' : '#f87171' }}>
            {testRes.connected ? '✓ ' : '✗ '}{testRes.message}
          </div>
        )}

        <div style={s.mBtns}>
          <button style={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...s.saveBtn, background:'var(--panel2)', color:'var(--text)', border:'1px solid var(--border2)' }}
            onClick={handleTest} disabled={testing}>
            {testing ? 'Testing…' : '⚡ Test'}
          </button>
          <button style={s.saveBtn} onClick={handleSave} disabled={saving || !form.name || !form.base_url}>
            {saving ? 'Saving…' : 'Save Connector'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ConnectorView() {
  const [connectors, setConnectors] = useState([])
  const [loading, setLoading]       = useState(true)
  const [showAdd, setShowAdd]       = useState(false)
  const [testingId, setTestingId]   = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const d = await fetchConnectors()
      setConnectors(d.connectors || [])
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleTest = async (id) => {
    setTestingId(id)
    await testConnector(id)
    await load()
    setTestingId(null)
  }

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete connector '${name}'?`)) return
    await deleteConnector(id)
    load()
  }

  return (
    <div style={s.wrap}>
      <div style={s.hdr}>
        <div style={s.title}>🔗 Connectors</div>
        <button style={s.addBtn} onClick={() => setShowAdd(true)}>+ Add Connector</button>
      </div>

      <div style={s.body}>
        {loading ? (
          <div style={s.empty}><div style={{fontSize:40,opacity:.4}}>🔗</div><div>Loading…</div></div>
        ) : connectors.length === 0 ? (
          <div style={s.empty}>
            <div style={{fontSize:40,opacity:.4}}>🔗</div>
            <div>No connectors yet</div>
            <div style={{fontSize:12,color:'var(--muted2)'}}>Add one to connect skills to external systems</div>
          </div>
        ) : (
          <div style={s.list}>
            {connectors.map(c => (
              <div key={c.id} style={s.card}>
                <div style={s.dot(c.status)} title={c.status} />
                <div style={s.info}>
                  <div style={s.name}>
                    {CONN_TYPES.find(t => t.id === c.type)?.icon || '🌐'} {c.name}
                    <span style={s.badge}>{c.type}</span>
                    <span style={{ ...s.badge, color: STATUS_COLOR[c.status] }}>{c.status}</span>
                  </div>
                  <div style={s.url}>{c.base_url || '—'}</div>
                  {c.error_msg && <div style={{fontSize:11, color:'#f87171', marginTop:2}}>{c.error_msg}</div>}
                </div>
                <div style={s.btns}>
                  <button style={s.btn(false)} onClick={() => handleTest(c.id)} disabled={testingId === c.id}>
                    {testingId === c.id ? 'Testing…' : '⚡ Test'}
                  </button>
                  <button style={s.btn(true)} onClick={() => handleDelete(c.id, c.name)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddConnectorModal
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load() }}
        />
      )}
    </div>
  )
}
