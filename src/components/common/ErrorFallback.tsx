import type { FallbackProps } from 'react-error-boundary'

export default function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="error-fallback" role="alert">
      <h2>Something went wrong</h2>
      <p>{error instanceof Error ? error.message : 'An unexpected error occurred in this section.'}</p>
      <button onClick={resetErrorBoundary}>Try again</button>
    </div>
  )
}
