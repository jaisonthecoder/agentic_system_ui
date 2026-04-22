import { useState, useRef, useEffect, useCallback } from 'react'
import { runAgentStream } from '../../api'

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  wrap: { display: 'flex', flexDirection: 'column', height: '100%' },
  hdr: {
    padding: '18px 28px 14px', borderBottom: '1px solid var(--border)',
    display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
  },
  agIcon: {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    background: 'linear-gradient(135deg, var(--accent), var(--blue))',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
  },
  agName: { fontSize: 16, fontWeight: 800 },
  agDesc: { fontSize: 11, color: 'var(--muted2)' },
  status: (busy) => ({
    marginLeft: 'auto', fontSize: 11, fontWeight: 600,
    color: busy ? 'var(--amber)' : 'var(--accent)',
    display: 'flex', alignItems: 'center', gap: 6,
  }),
  pulse: { width: 6, height: 6, borderRadius: '50%', background: 'currentColor', animation: 'blink 2s infinite' },
  msgs: { flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 18 },
  msg: (type) => ({
    display: 'flex', gap: 12, maxWidth: 800,
    flexDirection: type === 'user' ? 'row-reverse' : 'row',
    alignSelf: type === 'user' ? 'flex-end' : 'flex-start',
  }),
  av: (type) => ({
    width: 32, height: 32, borderRadius: 10, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
    background: type === 'user'
      ? 'linear-gradient(135deg, var(--blue), var(--purple))'
      : 'linear-gradient(135deg, var(--accent), var(--blue))',
  }),
  name: (type) => ({ fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 4, textAlign: type === 'user' ? 'right' : 'left' }),
  bubble: (type) => ({
    padding: '12px 16px', borderRadius: 12, fontSize: 13, lineHeight: 1.7,
    background: type === 'user' ? 'var(--blue-dim)' : 'var(--panel2)',
    border: `1px solid ${type === 'user' ? 'rgba(96,165,250,.2)' : 'var(--border)'}`,
    borderTopLeftRadius: type === 'agent' ? 2 : 12,
    borderTopRightRadius: type === 'user' ? 2 : 12,
  }),
  actBtn: {
    padding: '5px 12px', borderRadius: 20, border: '1px solid var(--border2)',
    background: 'none', color: 'var(--muted2)', fontSize: 11, fontWeight: 600,
    transition: 'all .15s',
  },
  toolBlock: {
    marginTop: 10, background: 'var(--bg)', border: '1px solid var(--border2)',
    borderRadius: 8, padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: 11,
  },
  inpArea: { padding: '14px 28px 18px', borderTop: '1px solid var(--border)', flexShrink: 0 },
  presets: { display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' },
  presetBtn: {
    padding: '6px 14px', borderRadius: 20, border: '1px solid var(--border2)',
    background: 'none', color: 'var(--muted2)', fontSize: 12, fontWeight: 500, transition: 'all .15s',
  },
  inpRow: { display: 'flex', gap: 10, alignItems: 'flex-end' },
  textarea: {
    flex: 1, background: 'var(--panel2)', border: '1px solid var(--border2)', borderRadius: 12,
    padding: '12px 16px', color: 'var(--text)', fontSize: 14, resize: 'none',
    outline: 'none', minHeight: 48, maxHeight: 120, lineHeight: 1.5,
  },
  sendBtn: (disabled) => ({
    width: 44, height: 44, borderRadius: 10, flexShrink: 0,
    background: disabled ? 'var(--border2)' : 'linear-gradient(135deg, var(--accent), var(--blue))',
    border: 'none', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
    opacity: disabled ? 0.4 : 1, cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all .15s',
  }),
  typing: { display: 'flex', gap: 4, alignItems: 'center', padding: '4px 0' },
  td: (i) => ({
    width: 6, height: 6, borderRadius: '50%', background: 'var(--muted)',
    animation: `bounce 1.4s infinite ${i * 0.2}s`,
  }),
}

const PRESETS = [
  { label: 'Review PR #42',   goal: 'Review PR #42 in acme/api and post a comment' },
  { label: 'Create Jira ticket', goal: 'Create a Jira ticket: login bug causes timeout on mobile' },
  { label: 'Slack message',   goal: 'Send Slack message to #engineering: deployment complete' },
  { label: 'Research topic',  goal: 'Search for Python async best practices and summarise' },
]

const WELCOME_ACTIONS = [
  { label: "🔍 Review a PR",   goal: "Review PR #42 in acme/api-service and tell me if it's safe to merge" },
  { label: "🎫 My tickets",    goal: 'Summarise open Jira tickets assigned to me' },
  { label: "📋 Standup",       goal: 'Generate a standup summary for today' },
  { label: "💡 What can you do?", goal: 'What skills and tools do you have?' },
]

function TypingDots() {
  return (
    <div style={s.typing}>
      {[0,1,2].map(i => <div key={i} style={s.td(i)} />)}
    </div>
  )
}

function Message({ msg }) {
  const html = (msg.text || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')

  return (
    <div style={s.msg(msg.type)}>
      <div style={s.av(msg.type)}>{msg.type === 'user' ? 'AL' : '🧠'}</div>
      <div>
        <div style={s.name(msg.type)}>{msg.type === 'user' ? 'You' : 'AgentOS'} · {msg.time}</div>
        <div style={s.bubble(msg.type)}>
          {msg.typing ? <TypingDots /> : <span dangerouslySetInnerHTML={{ __html: html }} />}
          {msg.tools?.map((t, i) => (
            <div key={i} style={s.toolBlock}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4, fontFamily: 'var(--head)' }}>
                <span>🔧</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber)' }}>{t.name}</span>
                <span style={{ fontSize: 10, color: 'var(--accent)' }}>✓ done</span>
              </div>
              <div style={{ color: 'var(--muted2)', lineHeight: 1.6 }}>
                <strong>Args:</strong> {t.args}<br />
                <strong>Result:</strong> {t.result}
              </div>
            </div>
          ))}
          {msg.actions && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              {msg.actions.map((a, i) => (
                <button key={i} style={s.actBtn} onClick={() => a.onClick()}>{a.label}</button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function now() { return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }

export default function ChatView({ isOnline, initialGoal, onInitialGoalUsed }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const msgsRef = useRef(null)
  const taRef = useRef(null)

  // Welcome message
  useEffect(() => {
    setMessages([{
      id: 'welcome', type: 'agent', time: now(),
      text: "Hi Alice 👋 I'm your AI workforce, connected live to the Python backend.\n\nTell me what to do in plain English — I'll plan, call tools, and get it done.",
      actions: WELCOME_ACTIONS.map(a => ({ label: a.label, onClick: () => sendText(a.goal) })),
    }])
  }, [])

  // Honour external quick-run goals
  useEffect(() => {
    if (initialGoal) { sendText(initialGoal); onInitialGoalUsed?.() }
  }, [initialGoal])

  const scroll = () => { setTimeout(() => { if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight }, 30) }

  const addMsg = useCallback((msg) => {
    setMessages(prev => [...prev, { id: Date.now() + Math.random(), ...msg }])
    scroll()
  }, [])

  const updateLastAgent = useCallback((updater) => {
    setMessages(prev => {
      const copy = [...prev]
      const idx = copy.map(m => m.type).lastIndexOf('agent')
      if (idx >= 0) copy[idx] = updater(copy[idx])
      return copy
    })
    scroll()
  }, [])

  const sendText = useCallback(async (text) => {
    if (!text?.trim() || busy) return
    setBusy(true)
    addMsg({ type: 'user', time: now(), text })
    addMsg({ type: 'agent', time: now(), text: '', typing: true, tools: [] })

    if (!isOnline) {
      updateLastAgent(m => ({ ...m, typing: false, text: '⚠ Backend is offline. Start uvicorn first:\n\ncd agentic-system\nuvicorn src.layer0_interface.api:app --reload' }))
      setBusy(false)
      return
    }

    try {
      for await (const evt of runAgentStream({ goal: text })) {
        if (evt.result) {
          updateLastAgent(m => ({ ...m, typing: false, text: evt.result }))
        } else if (evt.name) {
          updateLastAgent(m => ({ ...m, tools: [...(m.tools || []), { name: evt.name, args: JSON.stringify(evt.args || ''), result: String(evt.result || '') }] }))
        } else if (evt.message) {
          updateLastAgent(m => ({ ...m, text: evt.message }))
        } else if (evt.error) {
          updateLastAgent(m => ({ ...m, typing: false, text: `⚠ Error: ${evt.error}` }))
        }
      }
    } catch (e) {
      // Fallback: non-streaming run
      try {
        const { runAgent } = await import('../../api')
        const result = await runAgent({ goal: text })
        const out = result?.result ? JSON.stringify(result.result, null, 2) : 'Done.'
        updateLastAgent(m => ({ ...m, typing: false, text: out }))
      } catch (e2) {
        updateLastAgent(m => ({ ...m, typing: false, text: `⚠ Could not reach backend: ${e2.message}` }))
      }
    }
    setBusy(false)
  }, [busy, isOnline, addMsg, updateLastAgent])

  const send = () => { sendText(input); setInput('') }

  const handleKey = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }

  return (
    <div style={s.wrap}>
      {/* Header */}
      <div style={s.hdr}>
        <div style={s.agIcon}>🧠</div>
        <div>
          <div style={s.agName}>AgentOS Assistant</div>
          <div style={s.agDesc}>Connected to Python backend · All 7 layers active</div>
        </div>
        <div style={s.status(busy)}>
          <div style={s.pulse} />
          {busy ? 'Thinking…' : 'Ready'}
        </div>
      </div>

      {/* Messages */}
      <div style={s.msgs} ref={msgsRef}>
        {messages.map(m => <Message key={m.id} msg={m} />)}
      </div>

      {/* Input */}
      <div style={s.inpArea}>
        <div style={s.presets}>
          {PRESETS.map(p => (
            <button key={p.label} style={s.presetBtn} onClick={() => sendText(p.goal)}>{p.label}</button>
          ))}
        </div>
        <div style={s.inpRow}>
          <textarea
            ref={taRef}
            style={s.textarea}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Tell the agent what to do…"
            rows={1}
          />
          <button style={s.sendBtn(busy || !input.trim())} disabled={busy || !input.trim()} onClick={send}>
            ➤
          </button>
        </div>
      </div>
    </div>
  )
}
