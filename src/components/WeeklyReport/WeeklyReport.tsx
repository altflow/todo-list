import { useTranslation } from 'react-i18next'
import type { Todo } from '../../types/todo'
import { useWeeklyReport } from '../../hooks/useWeeklyReport'
import styles from './WeeklyReport.module.css'

interface WeeklyReportProps {
  todos: Todo[]
}

export const WeeklyReport = ({ todos }: WeeklyReportProps) => {
  const { t } = useTranslation()
  const { weekLabel, getWeeklyReport, prevWeek, nextWeek } = useWeeklyReport()
  const report = getWeeklyReport(todos)

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
              <h2 className={styles.projectName}>{group.project}</h2>
              <ul className={styles.taskList}>
                {group.tasks.map(({ todo, completedAt }) => (
                  <li key={todo.id} className={styles.taskItem}>
                    <span className={styles.completedAt}>{formatDate(completedAt)}</span>
                    <span className={styles.taskName}>{todo.task}</span>
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
