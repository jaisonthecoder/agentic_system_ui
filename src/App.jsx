import { useState, useEffect, useCallback } from 'react'
import { fetchHealth, fetchTasks } from './api'
import TopBar from './components/Layout/TopBar'
import Sidebar from './components/Layout/Sidebar'
import ChatView from './components/Chat/ChatView'
import TasksView from './components/Tasks/TasksView'
import AgentsView from './components/Agents/AgentsView'
import SkillsView from './components/Skills/SkillsView'
import SkillStoreView from './components/Skills/SkillStoreView'
import ConnectorView from './components/Connectors/ConnectorView'
import DashboardView from './components/Dashboard/DashboardView'

export default function App() {
  const [view, setView] = useState('chat')
  const [connection, setConnection] = useState({ status: 'connecting', label: 'Connecting…' })
  const [runningCount, setRunningCount] = useState(0)
  const [quickGoal, setQuickGoal] = useState(null)  // goal to pre-fill in Chat

  // ── Connection polling ─────────────────────────────────────────────────────
  const checkConn = useCallback(async () => {
    try {
      const data = await fetchHealth()
      setConnection({ status: 'online', label: `Online · ${data.skills} skills` })
    } catch {
      setConnection({ status: 'offline', label: 'Backend offline' })
    }
  }, [])

  useEffect(() => {
    checkConn()
    const t = setInterval(checkConn, 10000)
    return () => clearInterval(t)
  }, [checkConn])

  // ── Running tasks badge ────────────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const tasks = await fetchTasks()
        setRunningCount(tasks.filter(t => t.status === 'running').length)
      } catch {}
    }
    poll()
    const t = setInterval(poll, 3000)
    return () => clearInterval(t)
  }, [])

  // ── Navigate + send goal to Chat (from sidebar quick-run or agent Run btn) ─
  const handleQuickRun = (goal) => {
    setView('chat')
    setQuickGoal(goal)
  }

  const handleRunAgent = (agent) => {
    const goal = window.prompt(`What should the ${agent.name} agent do?`, `Run the ${agent.name} agent with default parameters`)
    if (goal) handleQuickRun(goal)
  }

  const handleViewTask = (task) => {
    setView('chat')
    if (task.result) setQuickGoal(`Show task result: ${task.result}`)
  }

  // ── View map ───────────────────────────────────────────────────────────────
  const views = {
    chat:       <ChatView isOnline={connection.status === 'online'} initialGoal={quickGoal} onInitialGoalUsed={() => setQuickGoal(null)} />,
    tasks:      <TasksView onViewTask={handleViewTask} />,
    agents:     <AgentsView onRunAgent={handleRunAgent} />,
    store:      <SkillStoreView />,
    connectors: <ConnectorView />,
    skills:     <SkillsView />,
    dashboard:  <DashboardView />,
  }

  return (
    <div className="app">
      <TopBar activeView={view} onViewChange={setView} connection={connection} />
      <div className="app-body">
        <Sidebar
          activeView={view}
          onViewChange={setView}
          runningCount={runningCount}
          onQuickRun={handleQuickRun}
        />
        <div className="main">
          {views[view]}
        </div>
      </div>
    </div>
  )
}
