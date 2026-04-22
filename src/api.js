// api.js — All calls to the AgentOS Python backend

const BASE = localStorage.getItem('agentosUrl') || 'http://localhost:8000'

export const API_BASE = BASE

// ── Health ────────────────────────────────────────────────────────────────────
export async function fetchHealth() {
  const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(3000) })
  return r.json()
}

// ── LLM Config ────────────────────────────────────────────────────────────────
export async function fetchLLMConfig() {
  const r = await fetch(`${BASE}/api/v1/config/llm`)
  return r.json()
}

export async function updateLLMConfig(provider, model) {
  const r = await fetch(`${BASE}/api/v1/config/llm`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, model }),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status}`)
  return r.json()
}

// ── Run (non-streaming, generic orchestrator) ─────────────────────────────────
export async function runGoal({ goal, userId = 'ui-user', userRoles = ['USER', 'LEAD'] }) {
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

export async function fetchAgent(id) {
  const r = await fetch(`${BASE}/api/v1/agents/${id}`)
  return r.json()
}

export async function createAgent(data) {
  const r = await fetch(`${BASE}/api/v1/agents`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  return r.json()
}

export async function updateAgent(id, data) {
  const r = await fetch(`${BASE}/api/v1/agents/${id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  return r.json()
}

export async function deleteAgent(id) {
  const r = await fetch(`${BASE}/api/v1/agents/${id}`, { method: 'DELETE' })
  return r.json()
}

export async function runAgent(id, goal, userId = 'ui-user') {
  const r = await fetch(`${BASE}/api/v1/agents/${id}/run`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, user_id: userId, user_roles: ['USER', 'LEAD'] }),
  })
  return r.json()
}

export async function fetchAgentRuns(id, limit = 20) {
  const r = await fetch(`${BASE}/api/v1/agents/${id}/runs?limit=${limit}`)
  return r.json()
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

// ── Skill Store ───────────────────────────────────────────────────────────────
export async function fetchStoreSkills({ category, source_type, search } = {}) {
  const p = new URLSearchParams()
  if (category) p.set('category', category)
  if (source_type) p.set('source_type', source_type)
  if (search) p.set('search', search)
  const r = await fetch(`${BASE}/api/v1/store/skills?${p}`)
  return r.json()
}

export async function fetchStoreSkill(name) {
  const r = await fetch(`${BASE}/api/v1/store/skills/${encodeURIComponent(name)}`)
  return r.json()
}

export async function uninstallSkill(name) {
  const r = await fetch(`${BASE}/api/v1/store/skills/${encodeURIComponent(name)}/uninstall`, { method: 'POST' })
  return r.json()
}

export async function testSkill(name, args = {}) {
  const r = await fetch(`${BASE}/api/v1/store/skills/${encodeURIComponent(name)}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  return r.json()
}

export async function buildFromForm(data) {
  const r = await fetch(`${BASE}/api/v1/store/build/from-form`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  return r.json()
}

export async function buildFromDescription(description) {
  const r = await fetch(`${BASE}/api/v1/store/build/from-description`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  })
  return r.json()
}

export async function buildFromOpenAPI(spec, connector_id = '') {
  const r = await fetch(`${BASE}/api/v1/store/build/from-openapi`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ spec, connector_id }),
  })
  return r.json()
}

export async function buildFromDocument(content, filename = 'document.md') {
  const r = await fetch(`${BASE}/api/v1/store/build/from-document`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, filename }),
  })
  return r.json()
}

export async function buildFromPython(code, filename = '') {
  const r = await fetch(`${BASE}/api/v1/store/build/from-python`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, filename }),
  })
  if (!r.ok) {
    const err = await r.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${r.status}`)
  }
  return r.json()
}

export async function installPreview(skills, connector = null) {
  const r = await fetch(`${BASE}/api/v1/store/build/install-preview`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ skills, connector }),
  })
  return r.json()
}

export async function fetchSkillAnalytics() {
  const r = await fetch(`${BASE}/api/v1/store/analytics`)
  return r.json()
}

// ── Connectors ────────────────────────────────────────────────────────────────
export async function fetchConnectors() {
  const r = await fetch(`${BASE}/api/v1/connectors`)
  return r.json()
}

export async function createConnector(data) {
  const r = await fetch(`${BASE}/api/v1/connectors`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  })
  return r.json()
}

export async function testConnector(id) {
  const r = await fetch(`${BASE}/api/v1/connectors/${id}/test`)
  return r.json()
}

export async function deleteConnector(id) {
  const r = await fetch(`${BASE}/api/v1/connectors/${id}`, { method: 'DELETE' })
  return r.json()
}

