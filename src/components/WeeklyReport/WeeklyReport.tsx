import { useMemo, useState } from 'react'
import { differenceInMinutes, format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import type { TimeSession } from '../../db/database'
import { useWeeklyReport } from '../../hooks/useWeeklyReport'
import { formatDuration } from '../../hooks/useTimeSessions'
import styles from './WeeklyReport.module.css'

type TaskId = string | number

export const WeeklyReport = ({ syncVersion = 0 }: { syncVersion?: number }) => {
  const { t } = useTranslation()
  const { weekLabel, weeklyReport, prevWeek, nextWeek, weekSessions } = useWeeklyReport(syncVersion)
  const report = weeklyReport
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<TaskId>>(new Set())

  const sessionsByTaskId = useMemo(() => {
    return weekSessions.reduce<Record<TaskId, TimeSession[]>>((acc, session) => {
      if (!acc[session.taskId]) acc[session.taskId] = []
      acc[session.taskId].push(session)
      return acc
    }, {})
  }, [weekSessions])

  const toggleTask = (taskId: TaskId) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  return (
    <section className={styles.report}>
      <div className={styles.navigation}>
        <button type="button" className={styles.navButton} onClick={prevWeek}>
          〈
        </button>
        <span className={styles.weekLabel}>{weekLabel}</span>
        <button type="button" className={styles.navButton} onClick={nextWeek}>
          〉
        </button>
      </div>

      {report.length === 0 ? (
        <p className={styles.emptyMessage}>{t('weeklyReport.emptyMessage')}</p>
      ) : (
        <div className={styles.groups}>
          {report.map((group) => (
            <div key={group.project} className={styles.group}>
              <div className={styles.groupHeader}>
                <h2 className={styles.projectName}>{group.project}</h2>
                <span className={styles.projectTotal}>{group.totalMinutes > 0 ? formatDuration(group.totalMinutes) : '—'}</span>
              </div>
              <ul className={styles.taskList}>
                {group.tasks.map(({ todo, completedAt, totalMinutes }) => {
                  const sessions = sessionsByTaskId[todo.id] ?? []
                  const hasSessions = sessions.length > 0
                  const isExpanded = expandedTaskIds.has(todo.id)

                  return (
                    <li key={todo.id} className={styles.taskItem}>
                      <div
                        className={`${styles.taskRow} ${hasSessions ? styles.taskRowInteractive : ''}`}
                        role={hasSessions ? 'button' : undefined}
                        tabIndex={hasSessions ? 0 : undefined}
                        aria-expanded={hasSessions ? isExpanded : undefined}
                        onClick={() => hasSessions && toggleTask(todo.id)}
                        onKeyDown={(event) => {
                          if (!hasSessions) return
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            toggleTask(todo.id)
                          }
                        }}
                      >
                        <div className={styles.taskContent}>
                          <span className={styles.taskToggle} aria-hidden="true">
                            {hasSessions ? (isExpanded ? '▼' : '▶') : ''}
                          </span>
                          <span className={styles.completedAt}>{formatDate(completedAt)}</span>
                          <span className={styles.taskName}>{todo.task}</span>
                          <span className={styles.timeValue}>{totalMinutes > 0 ? formatDuration(totalMinutes) : '—'}</span>
                        </div>
                        {isExpanded && hasSessions ? (
                          <ul className={styles.sessionList}>
                            {sessions.map((session) => {
                              const startLabel = format(session.startedAt, 'MM/dd HH:mm')
                              const endLabel = format(session.endedAt, 'MM/dd HH:mm')
                              const duration = formatDuration(Math.max(0, differenceInMinutes(session.endedAt, session.startedAt)))
                              return (
                                <li key={session.id ?? `${session.startedAt.getTime()}-${session.endedAt.getTime()}`} className={styles.sessionItem}>
                                  <div className={styles.sessionMeta}>
                                    <span className={styles.sessionTime}>{`${startLabel} → ${endLabel}`}</span>
                                    <span className={styles.sessionDuration}>{duration}</span>
                                  </div>
                                  {session.note ? <div className={styles.sessionNote}>{session.note}</div> : null}
                                </li>
                              )
                            })}
                          </ul>
                        ) : null}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

const formatDate = (date: Date) => {
  return `${date.getMonth() + 1}/${date.getDate()}`
}
