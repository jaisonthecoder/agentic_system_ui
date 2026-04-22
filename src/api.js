// api.js — All calls to the AgentOS Python backend

const BASE = localStorage.getItem('agentosUrl') || 'http://localhost:8000'

export const API_BASE = BASE

// ── Health ────────────────────────────────────────────────────────────────────
export async function fetchHealth() {
  const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) })
  return r.json()
}

// ── Run (non-streaming) ───────────────────────────────────────────────────────
export async function runAgent({ goal, userId = 'ui-user', userRoles = ['USER', 'LEAD'] }) {
  const r = await fetch(`${BASE}/api/v1/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, user_id: userId, user_roles: userRoles }),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// ── Run Streaming (SSE) ───────────────────────────────────────────────────────
export async function* runAgentStream({ goal, userId = 'ui-user', userRoles = ['USER', 'LEAD'] }) {
  const r = await fetch(`${BASE}/api/v1/run/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, user_id: userId, user_roles: userRoles }),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)

  const reader = r.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data:')) continue
      try {
        yield JSON.parse(line.replace(/^data: /, ''))
      } catch {}
    }
  }
}

// ── Tasks ─────────────────────────────────────────────────────────────────────
export async function fetchTasks() {
  const r = await fetch(`${BASE}/api/v1/tasks`)
  const d = await r.json()
  return d.tasks || []
}

export async function createTask({ goal, agentType = 'auto', userId = 'ui-user' }) {
  const r = await fetch(`${BASE}/api/v1/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, agent_type: agentType, user_id: userId }),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// ── Agents ────────────────────────────────────────────────────────────────────
export async function fetchAgents() {
  const r = await fetch(`${BASE}/api/v1/agents`)
  const d = await r.json()
  return d.agents || []
}

// ── Skills ────────────────────────────────────────────────────────────────────
export async function fetchSkills() {
  const r = await fetch(`${BASE}/api/v1/skills`)
  const d = await r.json()
  return d.skills || []
}

// ── Metrics / Dashboard ───────────────────────────────────────────────────────
export async function fetchMetrics() {
  const r = await fetch(`${BASE}/api/v1/metrics`)
  return r.json()
}

// ── MCP ───────────────────────────────────────────────────────────────────────
export async function fetchMcpServers() {
  const r = await fetch(`${BASE}/api/v1/mcp/servers`)
  return r.json()
}

export async function connectMcpServer(config) {
  const r = await fetch(`${BASE}/api/v1/mcp/connect`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  })
  return r.json()
}
