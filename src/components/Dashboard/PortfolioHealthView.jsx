/**
 * PortfolioHealthView.jsx — Cross-project health dashboard panel.
 * Shows per-project CVE counts, PR scores, stage distribution, framework health.
 */
import { useState, useEffect } from 'react'
import { fetchPortfolioHealth } from '../../api'

const RISK_COLORS = {
  CRITICAL: '#ef4444',
  HIGH:     '#f59e0b',
  MEDIUM:   '#6366f1',
  LOW:      '#22c55e',
}

function ScoreBar({ score }) {
  const pct = (score / 10) * 100
  const color = score >= 8 ? '#22c55e' : score >= 6 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color, minWidth: 28 }}>{score?.toFixed(1)}</span>
    </div>
  )
}

export default function PortfolioHealthView() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPortfolioHealth()
      .then(d => setHealth(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ color: 'var(--muted)', fontSize: 13, padding: 20 }}>Loading portfolio health…</div>
  if (!health) return null

  const { projects, summary } = health

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Projects', value: summary.total, color: '#6366f1' },
          { label: 'Active', value: summary.active, color: '#22c55e' },
          { label: 'With CVEs', value: summary.with_cves, color: '#ef4444' },
        ].map(m => (
          <div key={m.label} style={{
            flex: 1, minWidth: 100, padding: '12px 16px', borderRadius: 12,
            background: 'var(--panel2)', border: `1px solid ${m.color}44`,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Project health table */}
      {projects.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--muted)', fontSize: 13 }}>
          No projects found. Create your first project to see portfolio health.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {projects.map(p => {
            const hasCves = Object.keys(p.cve_summary || {}).length > 0
            const cveCount = Object.values(p.cve_summary || {}).reduce((a, b) => a + b, 0)
            return (
              <div key={p.project_id} style={{
                padding: '12px 16px', borderRadius: 12,
                border: `1px solid ${hasCves ? '#ef444455' : 'var(--border)'}`,
                background: hasCves ? '#3a1a1a22' : 'var(--panel2)',
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{ flex: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{p.current_stage?.replace(/_/g, ' ')} · {p.status}</div>
                </div>

                {/* CVE badge */}
                <div style={{ textAlign: 'center', minWidth: 70 }}>
                  {cveCount > 0 ? (
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#ef4444' }}>{cveCount}</div>
                      <div style={{ fontSize: 10, color: '#f87171' }}>CVEs</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>✓ Clean</div>
                  )}
                </div>

                {/* PR Score */}
                <div style={{ flex: 1.5, minWidth: 100 }}>
                  <div style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 3 }}>Avg PR Score</div>
                  {p.avg_pr_score != null
                    ? <ScoreBar score={p.avg_pr_score} />
                    : <span style={{ fontSize: 11, color: 'var(--muted)' }}>No reviews yet</span>
                  }
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
