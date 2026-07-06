import { useTranslation } from 'react-i18next'
import { useWeeklyReport } from '../../hooks/useWeeklyReport'
import { formatDuration } from '../../hooks/useTimeSessions'
import styles from './WeeklyReport.module.css'

export const WeeklyReport = () => {
  const { t } = useTranslation()
  const { weekLabel, weeklyReport, prevWeek, nextWeek } = useWeeklyReport()
  const report = weeklyReport

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
                {group.tasks.map(({ todo, completedAt, totalMinutes }) => (
                  <li key={todo.id} className={styles.taskItem}>
                    <span className={styles.completedAt}>{formatDate(completedAt)}</span>
                    <span className={styles.taskName}>{todo.task}</span>
                    <span className={styles.timeValue}>{totalMinutes > 0 ? formatDuration(totalMinutes) : '—'}</span>
                  </li>
                ))}
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
