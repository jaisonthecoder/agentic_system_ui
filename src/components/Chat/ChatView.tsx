import { useState, useRef, useEffect, useCallback } from 'react'
import { runAgentStream, runGoal } from '../../api'
import type { StreamEvent } from '../../types'
import styles from './ChatView.module.scss'

const PRESETS = [
  { label: 'Review PR #42',      goal: 'Review PR #42 in acme/api and post a comment' },
  { label: 'Create Jira ticket', goal: 'Create a Jira ticket: login bug causes timeout on mobile' },
  { label: 'Slack message',      goal: 'Send Slack message to #engineering: deployment complete' },
  { label: 'Research topic',     goal: 'Search for Python async best practices and summarise' },
]

const WELCOME_ACTIONS = [
  { label: '🔍 Review a PR',     goal: "Review PR #42 in acme/api-service and tell me if it's safe to merge" },
  { label: '🎫 My tickets',      goal: 'Summarise open Jira tickets assigned to me' },
  { label: '📋 Standup',         goal: 'Generate a standup summary for today' },
  { label: '💡 What can you do?',goal: 'What skills and tools do you have?' },
]

interface ToolCall {
  name: string
  args: string
  result: string
}

interface Action {
  label: string
  onClick: () => void
}

interface Message {
  id: string
  type: 'user' | 'agent'
  time: string
  text: string
  typing?: boolean
  tools?: ToolCall[]
  actions?: Action[]
}

interface ChatViewProps {
  isOnline: boolean
  initialGoal: string | null
  onInitialGoalUsed: () => void
}

function now() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function TypingDots() {
  return (
    <div className={styles.typingDots} aria-label="Thinking…">
      <div className={styles.dot} />
      <div className={styles.dot} />
      <div className={styles.dot} />
    </div>
  )
}

function MessageBubble({ msg }: { msg: Message }) {
  const html = (msg.text || '')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />')

  return (
    <div className={`${styles.message} ${styles[msg.type]}`}>
      <div className={styles.avatar}>{msg.type === 'user' ? 'AL' : '🧠'}</div>
      <div className={styles.msgBody}>
        <div className={styles.msgMeta}>
          {msg.type === 'user' ? 'You' : 'AgentOS'} · {msg.time}
        </div>
        <div className={styles.bubble}>
          {msg.typing
            ? <TypingDots />
            : <span dangerouslySetInnerHTML={{ __html: html }} />
          }
          {msg.tools?.map((t, i) => (
            <div key={i} className={styles.toolBlock}>
              <div className={styles.toolHeader}>
                <span>🔧</span>
                <span className={styles.toolName}>{t.name}</span>
                <span className={styles.toolDone}>✓ done</span>
              </div>
              <div className={styles.toolMeta}>
                <strong>Args:</strong> {t.args}<br />
                <strong>Result:</strong> {t.result}
              </div>
            </div>
          ))}
          {msg.actions && (
            <div className={styles.actionBtns}>
              {msg.actions.map((a, i) => (
                <button key={i} className={styles.actionBtn} onClick={a.onClick}>
                  {a.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ChatView({ isOnline, initialGoal, onInitialGoalUsed }: ChatViewProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput]       = useState('')
  const [busy, setBusy]         = useState(false)
  const msgsRef    = useRef<HTMLDivElement>(null)
  const taRef      = useRef<HTMLTextAreaElement>(null)
  const abortRef   = useRef<AbortController | null>(null)
  // Ref always points to the latest sendMessage — fixes stale-closure in welcome actions
  const sendMsgRef = useRef<(text: string) => void>(() => {})

  const scroll = useCallback(() => {
    setTimeout(() => {
      if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight
    }, 30)
  }, [])

  const addMsg = useCallback((msg: Omit<Message, 'id'>) => {
    setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, ...msg }])
    scroll()
  }, [scroll])

  const updateLastAgent = useCallback((updater: (m: Message) => Message) => {
    setMessages((prev) => {
      const copy = [...prev]
      const idx  = [...copy].reverse().findIndex((m) => m.type === 'agent')
      if (idx >= 0) {
        const realIdx = copy.length - 1 - idx
        copy[realIdx] = updater(copy[realIdx])
      }
      return copy
    })
    scroll()
  }, [scroll])

  const sendMessage = useCallback(async (text: string) => {
    if (!text?.trim() || busy) return

    // Abort any in-flight stream
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setBusy(true)
    addMsg({ type: 'user',  time: now(), text })
    addMsg({ type: 'agent', time: now(), text: '', typing: true, tools: [] })

    if (!isOnline) {
      updateLastAgent((m) => ({
        ...m,
        typing: false,
        text: '⚠ Backend is offline. Start uvicorn first:\n\ncd agentic-system\nuvicorn src.layer0_interface.api:app --reload',
      }))
      setBusy(false)
      return
    }

    try {
      for await (const evt of runAgentStream({ goal: text })) {
        if (abortRef.current?.signal.aborted) break
        const e = evt as StreamEvent
        if (e.result) {
          updateLastAgent((m) => ({ ...m, typing: false, text: String(e.result) }))
        } else if (e.name) {
          updateLastAgent((m) => ({
            ...m,
            tools: [...(m.tools ?? []), {
              name:   e.name!,
              args:   JSON.stringify(e.args ?? ''),
              result: String(e.result ?? ''),
            }],
          }))
        } else if (e.message) {
          updateLastAgent((m) => ({ ...m, text: e.message! }))
        } else if (e.error) {
          updateLastAgent((m) => ({ ...m, typing: false, text: `⚠ Error: ${e.error}` }))
        }
      }
    } catch {
      try {
        const result = await runGoal({ goal: text })
        const out = result?.result ? JSON.stringify(result.result, null, 2) : 'Done.'
        updateLastAgent((m) => ({ ...m, typing: false, text: out }))
      } catch (e2) {
        const msg = e2 instanceof Error ? e2.message : 'Unknown error'
        updateLastAgent((m) => ({ ...m, typing: false, text: `⚠ Could not reach backend: ${msg}` }))
      }
    }
    if (!abortRef.current?.signal.aborted) setBusy(false)
  }, [busy, isOnline, addMsg, updateLastAgent])

  // Keep ref current so welcome-message actions always call the latest sendMessage
  sendMsgRef.current = sendMessage

  // Cleanup stream on unmount
  useEffect(() => () => { abortRef.current?.abort() }, [])

  // Welcome message — uses ref to avoid stale closure
  useEffect(() => {
    setMessages([{
      id: 'welcome',
      type: 'agent',
      time: now(),
      text: "Hi Alice 👋 I'm your AI workforce, connected live to the Python backend.\n\nTell me what to do in plain English — I'll plan, call tools, and get it done.",
      actions: WELCOME_ACTIONS.map((a) => ({
        label: a.label,
        onClick: () => sendMsgRef.current(a.goal),
      })),
    }])
  }, [])

  // External goal injection (sidebar quick-run, task view-result)
  useEffect(() => {
    if (initialGoal) {
      sendMsgRef.current(initialGoal)
      onInitialGoalUsed()
    }
  }, [initialGoal, onInitialGoalUsed])

  const send = () => { sendMessage(input); setInput('') }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div className={styles.wrap}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.agentIcon}>🧠</div>
        <div>
          <div className={styles.agentName}>AgentOS Assistant</div>
          <div className={styles.agentDesc}>Connected to Python backend · All 7 layers active</div>
        </div>
        <div className={`${styles.statusLabel} ${busy ? styles.busy : styles.ready}`}>
          <div className={styles.statusDot} />
          {busy ? 'Thinking…' : 'Ready'}
        </div>
      </div>

      {/* Messages */}
      <div className={styles.messages} ref={msgsRef} aria-live="polite">
        {messages.map((m) => <MessageBubble key={m.id} msg={m} />)}
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <div className={styles.presets}>
          {PRESETS.map((p) => (
            <button key={p.label} className={styles.presetBtn} onClick={() => sendMessage(p.goal)}>
              {p.label}
            </button>
          ))}
        </div>
        <div className={styles.inputRow}>
          <textarea
            ref={taRef}
            className={styles.textarea}
            placeholder="Tell AgentOS what to do… (Enter to send, Shift+Enter for newline)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={busy}
            aria-label="Message input"
          />
          <button
            className={styles.sendBtn}
            onClick={send}
            disabled={busy || !input.trim()}
            aria-label="Send message"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  )
}
