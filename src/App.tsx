import { lazy, Suspense, useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import { fetchHealth, fetchTasks } from './api'
import TopBar from './components/Layout/TopBar'
import Sidebar from './components/Layout/Sidebar'
import ErrorFallback from './components/common/ErrorFallback'
import type { Connection, Task } from './types'

// ─── Lazy-loaded views ────────────────────────────────────────────────────────
const ChatView        = lazy(() => import('./components/Chat/ChatView'))
const TasksView       = lazy(() => import('./components/Tasks/TasksView'))
const AgentsView      = lazy(() => import('./components/Agents/AgentsView'))
const SkillsView      = lazy(() => import('./components/Skills/SkillsView'))
const SkillStoreView  = lazy(() => import('./components/Skills/SkillStoreView'))
const ConnectorView   = lazy(() => import('./components/Connectors/ConnectorView'))
const DashboardView   = lazy(() => import('./components/Dashboard/DashboardView'))
const ProjectsView    = lazy(() => import('./components/Projects/ProjectsView'))

function Spinner() {
  return <div className="loading-spinner" aria-label="Loading…" />
}

export default function App() {
  const navigate = useNavigate()
  const [connection, setConnection] = useState<Connection>({ status: 'connecting', label: 'Connecting…' })
  const [runningCount, setRunningCount] = useState(0)
  const [quickGoal, setQuickGoal] = useState<string | null>(null)

  // ── Health polling ─────────────────────────────────────────────────────────
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
    const t = setInterval(checkConn, 10_000)
    return () => clearInterval(t)
  }, [checkConn])

  // ── Running task badge ─────────────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const tasks = await fetchTasks()
        setRunningCount(tasks.filter((t: Task) => t.status === 'running').length)
      } catch {
        // silently ignore poll failures
      }
    }
    poll()
    const t = setInterval(poll, 3_000)
    return () => clearInterval(t)
  }, [])

  // ── Quick-run helpers ──────────────────────────────────────────────────────
  const handleQuickRun = (goal: string) => {
    setQuickGoal(goal)
    navigate('/chat')
  }

  const handleViewTask = (task: Task) => {
    const goalText = task.result
      ? `Show me the result of task: ${String(task.result)}`
      : `What happened with task: "${task.goal}"?`
    setQuickGoal(goalText)
    navigate('/chat')
  }

  return (
    <div className="app">
      <TopBar connection={connection} />
      <div className="app-body">
        <Sidebar runningCount={runningCount} onQuickRun={handleQuickRun} />
        <main className="main">
          <ErrorBoundary FallbackComponent={ErrorFallback}>
            <Suspense fallback={<Spinner />}>
              <Routes>
                <Route path="/" element={<Navigate to="/chat" replace />} />
                <Route
                  path="/chat"
                  element={
                    <ChatView
                      isOnline={connection.status === 'online'}
                      initialGoal={quickGoal}
                      onInitialGoalUsed={() => setQuickGoal(null)}
                    />
                  }
                />
                <Route path="/tasks"      element={<TasksView onViewTask={handleViewTask} />} />
                <Route path="/agents"     element={<AgentsView onQuickRun={handleQuickRun} />} />
                <Route path="/skills"     element={<SkillsView />} />
                <Route path="/store"      element={<SkillStoreView />} />
                <Route path="/connectors" element={<ConnectorView />} />
                <Route path="/dashboard"  element={<DashboardView />} />
                <Route path="/projects"   element={<ProjectsView />} />
                <Route path="*"           element={<Navigate to="/chat" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
