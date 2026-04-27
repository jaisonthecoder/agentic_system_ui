// api.ts — All calls to the AgentOS Python backend
import type {
  HealthData, Task, Agent, Skill, SkillGroup, Connector, ConnectorTemplate,
  Metrics, McpServers, LLMConfig, StoreSkill, AnalyticsData, StreamEvent,
} from './types'

// ─── Base URL ─────────────────────────────────────────────────────────────────
function getSafeBase(): string {
  try {
    const stored = localStorage.getItem('agentosUrl')
    if (stored) {
      const url = new URL(stored)
      if (url.protocol === 'http:' || url.protocol === 'https:') return stored
    }
  } catch {
    // fall through to default
  }
  return 'http://localhost:8000'
}

export const API_BASE = getSafeBase()

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function get<T>(path: string, signal?: AbortSignal): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { signal })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)
  return r.json() as Promise<T>
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)
  return r.json() as Promise<T>
}

async function put<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)
  return r.json() as Promise<T>
}

async function del<T>(path: string): Promise<T> {
  const r = await fetch(`${API_BASE}${path}`, { method: 'DELETE' })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)
  return r.json() as Promise<T>
}

// ─── Health ────────────────────────────────────────────────────────────────────
export function fetchHealth(): Promise<HealthData> {
  return get<HealthData>('/health', AbortSignal.timeout(3000))
}

// ─── LLM Config ───────────────────────────────────────────────────────────────
export function fetchLLMConfig(): Promise<LLMConfig> {
  return get<LLMConfig>('/api/v1/config/llm')
}

export function updateLLMConfig(provider: string, model: string): Promise<LLMConfig> {
  return post<LLMConfig>('/api/v1/config/llm', { provider, model })
}

// ─── Run (non-streaming) ──────────────────────────────────────────────────────
export interface RunOptions {
  goal: string
  userId?: string
  userRoles?: string[]
}

export function runGoal({ goal, userId = 'ui-user', userRoles = ['USER', 'LEAD'] }: RunOptions) {
  return post<{ result: unknown }>('/api/v1/run', { goal, user_id: userId, user_roles: userRoles })
}

// ─── Run Streaming (SSE) ──────────────────────────────────────────────────────
export async function* runAgentStream({
  goal,
  userId = 'ui-user',
  userRoles = ['USER', 'LEAD'],
}: RunOptions): AsyncGenerator<StreamEvent> {
  const r = await fetch(`${API_BASE}/api/v1/run/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ goal, user_id: userId, user_roles: userRoles }),
  })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)

  const reader = r.body!.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const chunk = decoder.decode(value)
    for (const line of chunk.split('\n')) {
      if (!line.startsWith('data:')) continue
      try {
        yield JSON.parse(line.replace(/^data:\s*/, '')) as StreamEvent
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export async function fetchTasks(): Promise<Task[]> {
  const d = await get<{ tasks: Task[] }>('/api/v1/tasks')
  return d.tasks ?? []
}

export interface CreateTaskOptions {
  goal: string
  agentType?: string
  userId?: string
}

export function createTask({ goal, agentType = 'auto', userId = 'ui-user' }: CreateTaskOptions): Promise<Task> {
  return post<Task>('/api/v1/tasks', { goal, agent_type: agentType, user_id: userId })
}

// ─── Agents ───────────────────────────────────────────────────────────────────
export async function fetchAgents(): Promise<Agent[]> {
  const d = await get<{ agents: Agent[] }>('/api/v1/agents')
  return d.agents ?? []
}

export function fetchAgent(id: string): Promise<Agent> {
  return get<Agent>(`/api/v1/agents/${id}`)
}

export function createAgent(data: Partial<Agent>): Promise<Agent> {
  return post<Agent>('/api/v1/agents', data)
}

export function updateAgent(id: string, data: Partial<Agent>): Promise<Agent> {
  return put<Agent>(`/api/v1/agents/${id}`, data)
}

export function deleteAgent(id: string): Promise<{ ok: boolean }> {
  return del<{ ok: boolean }>(`/api/v1/agents/${id}`)
}

export function runAgent(id: string, goal: string, userId = 'ui-user'): Promise<{ result: unknown }> {
  return post(`/api/v1/agents/${id}/run`, { goal, user_id: userId, user_roles: ['USER', 'LEAD'] })
}

export function fetchAgentRuns(id: string, limit = 20): Promise<{ runs: unknown[] }> {
  return get(`/api/v1/agents/${id}/runs?limit=${limit}`)
}

// ─── Skills ───────────────────────────────────────────────────────────────────
export async function fetchSkills(): Promise<Skill[]> {
  const d = await get<{ skills: Skill[] }>('/api/v1/skills')
  return d.skills ?? []
}

// ─── Skill Groups ─────────────────────────────────────────────────────────────
export async function fetchSkillGroups(): Promise<{ groups: SkillGroup[]; count: number }> {
  return get('/api/v1/skill-groups')
}

export function createSkillGroup(data: Partial<SkillGroup>): Promise<SkillGroup> {
  return post('/api/v1/skill-groups', data)
}

export function updateSkillGroup(id: string, data: Partial<SkillGroup>): Promise<SkillGroup> {
  return put(`/api/v1/skill-groups/${id}`, data)
}

export function deleteSkillGroup(id: string): Promise<{ ok: boolean }> {
  return del(`/api/v1/skill-groups/${id}`)
}

// ─── Metrics ──────────────────────────────────────────────────────────────────
export function fetchMetrics(): Promise<Metrics> {
  return get('/api/v1/metrics')
}

// ─── MCP ──────────────────────────────────────────────────────────────────────
export function fetchMcpServers(): Promise<McpServers> {
  return get('/api/v1/mcp/servers')
}

export function connectMcpServer(config: unknown): Promise<unknown> {
  return post('/api/v1/mcp/connect', config)
}

// ─── Skill Store ──────────────────────────────────────────────────────────────
export interface StoreFilters {
  category?: string
  source_type?: string
  search?: string
}

export async function fetchStoreSkills(filters: StoreFilters = {}): Promise<StoreSkill[]> {
  const p = new URLSearchParams()
  if (filters.category)    p.set('category', filters.category)
  if (filters.source_type) p.set('source_type', filters.source_type)
  if (filters.search)      p.set('search', filters.search)
  const d = await get<{ skills: StoreSkill[] }>(`/api/v1/store/skills?${p}`)
  return d.skills ?? (Array.isArray(d) ? (d as StoreSkill[]) : [])
}

export function fetchStoreSkill(name: string): Promise<StoreSkill> {
  return get(`/api/v1/store/skills/${encodeURIComponent(name)}`)
}

export function uninstallSkill(name: string): Promise<{ ok: boolean }> {
  return post(`/api/v1/store/skills/${encodeURIComponent(name)}/uninstall`)
}

export function testSkill(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  return post(`/api/v1/store/skills/${encodeURIComponent(name)}/test`, { args })
}

export function fetchSkillAnalytics(): Promise<AnalyticsData> {
  return get('/api/v1/store/analytics')
}

// ─── Connectors ───────────────────────────────────────────────────────────────
export async function fetchConnectors(): Promise<Connector[]> {
  const d = await get<{ connectors: Connector[] }>('/api/v1/connectors')
  return d.connectors ?? []
}

export function fetchConnectorTemplates(): Promise<{ templates: ConnectorTemplate[] }> {
  return get('/api/v1/connectors/templates')
}

export function createConnector(data: Partial<Connector> & { credentials?: unknown }): Promise<Connector> {
  return post('/api/v1/connectors', data)
}

export function updateConnector(id: string, data: Partial<Connector>): Promise<Connector> {
  return put(`/api/v1/connectors/${id}`, data)
}

export function testConnector(id: string): Promise<{ connected: boolean; message?: string }> {
  return post(`/api/v1/connectors/${id}/test`)
}

export function deleteConnector(id: string): Promise<{ ok: boolean }> {
  return del(`/api/v1/connectors/${id}`)
}

// ─── Skill Builder ────────────────────────────────────────────────────────────
export function createSkillFromDefinition(data: unknown): Promise<Skill> {
  return post('/api/v1/skills/build', data)
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export interface Project {
  id: string
  name: string
  status: string
  stage: string
  created_at?: number
  [key: string]: unknown
}

export async function fetchProjects(): Promise<Project[]> {
  const d = await get<{ projects: Project[] }>('/api/v1/projects')
  return d.projects ?? []
}

export function fetchProject(id: string): Promise<Project> {
  return get(`/api/v1/projects/${id}`)
}

export function fetchProjectIntent(id: string): Promise<unknown> {
  return get(`/api/v1/projects/${id}/intent`)
}

export function updateProjectIntent(id: string, data: unknown): Promise<unknown> {
  return put(`/api/v1/projects/${id}/intent`, data)
}

export function fetchProjectArtifacts(id: string): Promise<unknown[]> {
  return get(`/api/v1/projects/${id}/artifacts`)
}

export function fetchArtifact(projectId: string, artifactId: string): Promise<unknown> {
  return get(`/api/v1/projects/${projectId}/artifacts/${artifactId}`)
}

export function approveProjectStage(id: string, stage: string): Promise<unknown> {
  return post(`/api/v1/projects/${id}/stages/${stage}/approve`)
}

export function rejectProjectStage(id: string, stage: string, reason?: string): Promise<unknown> {
  return post(`/api/v1/projects/${id}/stages/${stage}/reject`, { reason })
}

export function analyzeDocuments(data: unknown): Promise<unknown> {
  return post('/api/v1/projects/analyze-documents', data)
}

export function fetchPatterns(): Promise<unknown[]> {
  return get('/api/v1/projects/patterns')
}

export function fetchPortfolioHealth(): Promise<unknown> {
  return get('/api/v1/projects/portfolio-health')
}

// ─── Skill Builder ─────────────────────────────────────────────────────────────
export interface SkillPreviewRecord {
  name: string
  description?: string
  icon?: string
  source_type?: string
  category?: string
  parameters?: Array<{ name: string; type?: string; required?: boolean; description?: string }>
}

export interface BuildResult {
  preview?: SkillPreviewRecord[]
  message?: string
  installed?: number
}

export function buildFromDocument(content: string, filename = 'document.md'): Promise<BuildResult> {
  return post('/api/v1/store/build/from-document', { content, filename })
}

export function buildFromOpenAPI(spec: string): Promise<BuildResult> {
  return post('/api/v1/store/build/from-openapi', { spec })
}

export function buildFromDescription(description: string): Promise<BuildResult> {
  return post('/api/v1/store/build/from-description', { description })
}

export function buildFromForm(data: unknown): Promise<BuildResult> {
  return post('/api/v1/store/build/from-form', data)
}

export function buildFromPython(code: string): Promise<BuildResult> {
  return post('/api/v1/store/build/from-python', { code })
}

export function installPreview(skills: SkillPreviewRecord[]): Promise<BuildResult> {
  return post('/api/v1/store/build/install', { skills })
}

export function fetchStoreSkillAnalytics(): Promise<{ analytics: Record<string, number> }> {
  return get('/api/v1/store/analytics')
}

