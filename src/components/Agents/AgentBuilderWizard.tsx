// AgentBuilderWizard.tsx — full wizard is inlined in AgentsView.tsx (CreateAgentModal).
// This module is kept for future expansion to the 4-step wizard.
import type { Agent } from '../../types'

interface Props {
  onClose: () => void
  onCreated: (agent: Agent) => void
}

export default function AgentBuilderWizard(_props: Props) {
  return null
}
