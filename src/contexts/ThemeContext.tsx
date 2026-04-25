import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

type Theme = 'dark' | 'light'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem('agentosTheme')
      const t: Theme = (stored === 'light' || stored === 'dark') ? stored : 'light'
      // Apply immediately (before first paint) — prevents flash of wrong theme
      document.documentElement.setAttribute('data-theme', t)
      document.documentElement.setAttribute('data-density', 'comfortable')
      return t
    } catch {
      document.documentElement.setAttribute('data-theme', 'light')
      document.documentElement.setAttribute('data-density', 'comfortable')
      return 'light'
    }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('agentosTheme', theme) } catch { /* ignore */ }
  }, [theme])

  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
