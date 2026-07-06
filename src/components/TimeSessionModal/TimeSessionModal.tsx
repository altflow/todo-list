import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useTimeSessions, formatDuration } from '../../hooks/useTimeSessions'
import styles from './TimeSessionModal.module.css'

interface Props {
  taskId: string | number
  taskTitle: string
  onClose: () => void
}

export const TimeSessionModal = ({ taskId, taskTitle, onClose }: Props) => {
  const { t } = useTranslation('timeSessions')
  const { sessions, totalMinutes, addSession, deleteSession } = useTimeSessions(taskId)

  const [startedAt, setStartedAt] = useState('')
  const [endedAt, setEndedAt] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!startedAt || !endedAt) {
      setError(t('required'))
      return
    }

    const startDate = new Date(startedAt)
    const endDate = new Date(endedAt)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setError(t('invalidRange'))
      return
    }

    setError('')
    await addSession(startDate, endDate, note.trim() || undefined)
    setStartedAt('')
    setEndedAt('')
    setNote('')
  }

  const sessionRows = useMemo(() => sessions ?? [], [sessions])

  return (
    <div className={styles.overlay} role="presentation" onClick={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>{taskTitle}</h2>
            <p className={styles.subtitle}>{t('title')}</p>
          </div>
          <div className={styles.totalTime}>{formatDuration(totalMinutes)}</div>
        </div>

        <div className={styles.content}>
          <div className={styles.tableWrapper}>
            {sessionRows.length === 0 ? (
              <p className={styles.empty}>{t('empty')}</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('startedAt')}</th>
                    <th>{t('endedAt')}</th>
                    <th>{t('note')}</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sessionRows.map((session) => (
                    <tr key={session.id}>
                      <td>{format(session.startedAt, 'MM/dd HH:mm')}</td>
                      <td>{format(session.endedAt, 'MM/dd HH:mm')}</td>
                      <td>{session.note ?? ''}</td>
                      <td>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => session.id !== undefined && void deleteSession(session.id)}
                        >
                          {t('delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="startedAt">
                {t('start')}
              </label>
              <input
                id="startedAt"
                type="datetime-local"
                value={startedAt}
                onChange={(event) => {
                  setStartedAt(event.target.value)
                  if (error) {
                    setError('')
                  }
                }}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="endedAt">
                {t('end')}
              </label>
              <input
                id="endedAt"
                type="datetime-local"
                value={endedAt}
                onChange={(event) => {
                  setEndedAt(event.target.value)
                  if (error) {
                    setError('')
                  }
                }}
              />
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="note">
                {t('note')}
              </label>
              <input
                id="note"
                type="text"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder={t('note')}
              />
            </div>

            {error ? <p className={styles.error}>{error}</p> : null}

            <div className={styles.actions}>
              <button type="button" className={styles.secondaryButton} onClick={onClose}>
                {t('close')}
              </button>
              <button type="submit" className={styles.primaryButton}>
                {t('save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
