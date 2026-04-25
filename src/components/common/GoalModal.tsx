import { useState, useEffect, useRef } from 'react'
import styles from './GoalModal.module.scss'

interface GoalModalProps {
  title: string
  subtitle?: string
  icon?: string
  placeholder?: string
  onClose: () => void
  onConfirm: (value: string) => Promise<void> | void
}

export default function GoalModal({
  title,
  subtitle,
  icon,
  placeholder,
  onClose,
  onConfirm,
}: GoalModalProps) {
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async () => {
    if (!value.trim() || loading) return
    setLoading(true)
    try {
      await onConfirm(value.trim())
      onClose()
    } catch {
      setLoading(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={styles.modal}>
        {icon && <div className={styles.icon}>{icon}</div>}
        <h3 className={styles.title}>{title}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        <textarea
          ref={ref}
          className={styles.textarea}
          placeholder={placeholder ?? 'Describe what you want done…'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          rows={4}
        />
        <p className={styles.hint}>⌘ + Enter to submit</p>
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.confirmBtn}
            onClick={handleSubmit}
            disabled={loading || !value.trim()}
          >
            {loading ? 'Running…' : '▶ Run'}
          </button>
        </div>
      </div>
    </div>
  )
}
