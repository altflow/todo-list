import { useMemo, useState, type FormEvent } from 'react'
import { differenceInMinutes, format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { type TimeSession } from '../../db/database'
import { useTimeSessions, formatDuration } from '../../hooks/useTimeSessions'
import styles from './TimeSessionModal.module.css'

interface Props {
  taskId: string | number
  taskTitle: string
  onBack: () => void
  syncVersion?: number
}

const formatDateTimeLocal = (date: Date): string => format(date, "yyyy-MM-dd'T'HH:mm")

export const TimeSessionModal = ({ taskId, taskTitle, onBack, syncVersion = 0 }: Props) => {
  const { t } = useTranslation()
  const timeSessionsT = (key: string) => t(`timeSessions.${key}`)
  const { sessions, totalMinutes, addSession, updateSession, deleteSession } = useTimeSessions(taskId, syncVersion)

  const [startedAt, setStartedAt] = useState('')
  const [endedAt, setEndedAt] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [editingSessionId, setEditingSessionId] = useState<number | null>(null)
  const [editStartedAt, setEditStartedAt] = useState('')
  const [editEndedAt, setEditEndedAt] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editError, setEditError] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!startedAt || !endedAt) {
      setError(timeSessionsT('required'))
      return
    }

    const startDate = new Date(startedAt)
    const endDate = new Date(endedAt)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setError(timeSessionsT('invalidRange'))
      return
    }

    setError('')
    await addSession(startDate, endDate, note.trim() || undefined)
    setStartedAt('')
    setEndedAt('')
    setNote('')
  }

  const handleEditStart = (session: TimeSession) => {
    if (editingSessionId === session.id) {
      setEditingSessionId(null)
      setEditStartedAt('')
      setEditEndedAt('')
      setEditNote('')
      setEditError('')
      return
    }

    setEditingSessionId(session.id ?? null)
    setEditStartedAt(formatDateTimeLocal(session.startedAt))
    setEditEndedAt(formatDateTimeLocal(session.endedAt))
    setEditNote(session.note ?? '')
    setEditError('')
  }

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>, sessionId: number) => {
    event.preventDefault()

    if (!editStartedAt || !editEndedAt) {
      setEditError(timeSessionsT('required'))
      return
    }

    const startDate = new Date(editStartedAt)
    const endDate = new Date(editEndedAt)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate <= startDate) {
      setEditError(timeSessionsT('invalidRange'))
      return
    }

    setEditError('')
    await updateSession(sessionId, startDate, endDate, editNote.trim() || undefined)
    setEditingSessionId(null)
    setEditStartedAt('')
    setEditEndedAt('')
    setEditNote('')
  }

  const handleNoteInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.target.style.height = 'auto'
    event.target.style.height = `${event.target.scrollHeight}px`
    setNote(event.target.value)
  }

  const handleEditNoteInput = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    event.target.style.height = 'auto'
    event.target.style.height = `${event.target.scrollHeight}px`
    setEditNote(event.target.value)
  }

  const sessionRows = useMemo(() => sessions ?? [], [sessions])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
          <button type="button" className={styles.backButton} onClick={onBack} aria-label={timeSessionsT('back')}>
          &lt;
        </button>
        <div className={styles.headerTitle}>
          <h1 className={styles.title}>{taskTitle}</h1>
          <p className={styles.subtitle}>{timeSessionsT('title')}</p>
        </div>
        <div className={styles.totalTime}>{formatDuration(totalMinutes)}</div>
      </header>

      <main className={styles.content}>
          <div className={styles.listWrapper}>
            {sessionRows.length === 0 ? (
              <p className={styles.empty}>{timeSessionsT('empty')}</p>
            ) : (
              <div className={styles.sessionList}>
                {sessionRows.map((session) => {
                  const isEditing = editingSessionId === session.id

                  return (
                    <div key={session.id} className={styles.sessionCard}>
                      {isEditing ? (
                        <form className={styles.inlineForm} onSubmit={(event) => session.id !== undefined && handleEditSubmit(event, session.id)}>
                          <div className={styles.datetimeGroup}>
                            <div className={styles.datetimeRow}>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor={`edit-started-${session.id}`}>
                                  {timeSessionsT('start')}
                                </label>
                                <input
                                  id={`edit-started-${session.id}`}
                                  type="datetime-local"
                                  value={editStartedAt}
                                  onChange={(event) => {
                                    setEditStartedAt(event.target.value)
                                    if (editError) {
                                      setEditError('')
                                    }
                                  }}
                                />
                              </div>
                              <div className={styles.fieldGroup}>
                                <label className={styles.label} htmlFor={`edit-ended-${session.id}`}>
                                  {timeSessionsT('end')}
                                </label>
                                <input
                                  id={`edit-ended-${session.id}`}
                                  type="datetime-local"
                                  value={editEndedAt}
                                  onChange={(event) => {
                                    setEditEndedAt(event.target.value)
                                    if (editError) {
                                      setEditError('')
                                    }
                                  }}
                                />
                              </div>
                            </div>
                            {editError ? <p className={styles.inlineError}>{editError}</p> : null}
                          </div>

                          <div className={styles.fieldGroup}>
                            <label className={styles.label} htmlFor={`edit-note-${session.id}`}>
                              {timeSessionsT('note')}
                            </label>
                            <textarea
                              id={`edit-note-${session.id}`}
                              className={styles.noteTextarea}
                              value={editNote}
                              onChange={handleEditNoteInput}
                              placeholder={t('note')}
                            />
                          </div>

                          <div className={styles.actions}>
                            <button type="button" className={styles.secondaryButton} onClick={() => handleEditStart(session)}>
                              {timeSessionsT('cancel')}
                            </button>
                            <button type="submit" className={styles.primaryButton}>
                              {timeSessionsT('save')}
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className={styles.cardContent}>
                          <div className={styles.cardHeader}>
                            <div className={styles.sessionMeta}>
                              <span>
                                {format(session.startedAt, 'MM/dd HH:mm')} → {format(session.endedAt, 'MM/dd HH:mm')}
                              </span>
                              <span className={styles.duration}>
                                {formatDuration(differenceInMinutes(session.endedAt, session.startedAt))}
                              </span>
                            </div>
                            <div className={styles.cardActions}>
                              <button
                                type="button"
                                className={styles.editButton}
                                aria-label={timeSessionsT('edit')}
                                onClick={() => session.id !== undefined && handleEditStart(session)}
                              >
                                <span className={styles.buttonLabel}>{timeSessionsT('edit')}</span>
                                <span className={styles.buttonIcon} aria-hidden="true">✎</span>
                              </button>
                              <button
                                type="button"
                                className={styles.deleteButton}
                                aria-label={timeSessionsT('delete')}
                                onClick={() => session.id !== undefined && void deleteSession(session.id)}
                              >
                                <span className={styles.buttonLabel}>{timeSessionsT('delete')}</span>
                                <span className={styles.buttonIcon} aria-hidden="true">🗑</span>
                              </button>
                            </div>
                          </div>
                          {session.note ? <p className={styles.noteContent}>{session.note}</p> : null}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.datetimeGroup}>
              <div className={styles.datetimeRow}>
                <div className={styles.fieldGroup}>
                  <label className={styles.label} htmlFor="startedAt">
                    {timeSessionsT('start')}
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
                    {timeSessionsT('end')}
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
              </div>
              {error ? <p className={styles.inlineError}>{error}</p> : null}
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.label} htmlFor="note">
                {timeSessionsT('note')}
              </label>
              <textarea
                id="note"
                className={styles.noteTextarea}
                value={note}
                onChange={handleNoteInput}
                placeholder={timeSessionsT('note')}
              />
            </div>

            <div className={styles.actions}>
              <button type="submit" className={styles.primaryButton}>
                {timeSessionsT('save')}
              </button>
            </div>
          </form>
      </main>
    </div>
  )
}
