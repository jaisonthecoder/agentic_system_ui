// ─── Shared domain types used across the app ──────────────────────────────────

export type ConnectionStatus = 'online' | 'offline' | 'connecting'

export interface Connection {
  status: ConnectionStatus
  label: string
}

export interface Task {
  id: string
  goal: string
  status: 'running' | 'done' | 'failed' | 'pending'
  agent_type?: string
  created_at?: string
  session_id?: string
  result?: unknown
}

export interface Agent {
  id: string
  name: string
  icon: string
  description?: string
  archetype: 'autonomous' | 'assistant' | 'pipeline' | 'event'
  skills?: string[]
  system_prompt?: string
  max_steps?: number
  pipeline_steps?: PipelineStep[]
  event_triggers?: string[]
  [key: string]: unknown
}

export interface PipelineStep {
  name: string
  skill: string
  args: Record<string, unknown>
  depends_on: string[]
}

export interface Skill {
  name: string
  description?: string
  icon?: string
  source_type?: string
  category?: string
  group_id?: string
  params?: string[]
  parameters?: SkillParam[]
  call_count?: number
}

export interface SkillParam {
  name: string
  type?: string
  required?: boolean
  description?: string
}

export interface SkillGroup {
  id: string
  label: string
  icon: string
  description?: string
  category: string
  connector_type?: string
  skill_count: number
  skills?: Skill[]
}

export interface Connector {
  id: string
  name: string
  type: string
  base_url: string
  auth_type: string
  status?: 'connected' | 'error' | 'untested'
  test_result?: string
  exposed_skills?: string[]
}

export interface ConnectorTemplate {
  id: string
  label: string
  icon: string
  type: string
  base_url: string
  auth_type: string
  headers?: Record<string, string>
  timeout_s?: number
  credential_fields?: Array<{ key: string; label: string; type: string; default?: string }>
  skills_preview?: string[]
}

export interface HealthData {
  status: string
  skills: number
  llm_provider?: string
  llm_model?: string
  layers?: string[]
  [key: string]: unknown
}

export interface LLMConfig {
  provider: string
  model: string
  available_providers: string[]
  models_by_provider: Record<string, string[]>
  api_keys_set: Record<string, boolean>
  [key: string]: unknown
}

export interface Metrics {
  total_tasks?: number
  avg_latency_ms?: number
  total_cost_usd?: number
  [key: string]: unknown
}

export interface McpServers {
  servers?: Record<string, { tools?: string[]; connected?: boolean }>
  [key: string]: unknown
}

export interface StreamEvent {
  result?: string
  name?: string
  args?: Record<string, unknown>
  message?: string
  error?: string
  status?: string
}

export interface StoreSkill extends Skill {
  installed?: boolean
  source?: string
}

export interface AnalyticsData {
  [skillName: string]: number
}
