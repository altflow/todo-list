import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { startOfWeek, endOfWeek, addWeeks, format, isSameDay, isWithinInterval } from 'date-fns'
import { ja } from 'date-fns/locale/ja'
import { enUS } from 'date-fns/locale/en-US'
import type { Todo } from '../types/todo'
import { db, storageAdapter, type TimeSession } from '../db/database'
import { groupByProject } from '../utils/weeklyReportLogic'
import type { ProjectReport } from '../utils/weeklyReportLogic'

export type { ReportTask } from '../utils/weeklyReportLogic'

export const useWeeklyReport = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [weeklyTodos, setWeeklyTodos] = useState<Todo[]>([])
  const [weeklyTimeSessions, setWeeklyTimeSessions] = useState<TimeSession[]>([])

  useEffect(() => {
    const weekStart = startOfWeek(currentWeekStart, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

    setWeeklyTodos([])
    setWeeklyTimeSessions([])
    void (async () => {
      const todos = await storageAdapter.getCompletedByDateRange(weekStart, weekEnd)
      const sessions = await db.timeSessions.where('startedAt').between(weekStart, weekEnd).toArray()
      const filteredSessions = sessions.filter((session) => isWithinInterval(session.startedAt, { start: weekStart, end: weekEnd }))

      setWeeklyTodos(todos)
      setWeeklyTimeSessions(filteredSessions)
    })()
  }, [currentWeekStart])

  const prevWeek = () => {
    setCurrentWeekStart((current) => addWeeks(current, -1))
  }

  const nextWeek = () => {
    setCurrentWeekStart((current) => addWeeks(current, 1))
  }

  const getWeeklyReport = (): ProjectReport[] => {
    const completedTodos = weeklyTodos.filter((todo) => todo.completedAt !== null)
    return groupByProject(completedTodos, weeklyTimeSessions)
  }

  const weeklyReport = getWeeklyReport()
  const { i18n } = useTranslation()

  const weekLabel = (() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    const sameDay = isSameDay(currentWeekStart, weekEnd)

    if (i18n.language === 'en') {
      const startLabel = format(currentWeekStart, 'MMM d (eee)', { locale: enUS })
      const endLabel = format(weekEnd, 'MMM d (eee)', { locale: enUS })
      const yearLabel = format(weekEnd, 'yyyy', { locale: enUS })
      return sameDay ? `${startLabel}, ${yearLabel}` : `${startLabel} – ${endLabel}, ${yearLabel}`
    }

    const startLabel = format(currentWeekStart, 'yyyy年M月d日（eee）', { locale: ja })
    const endLabel = format(weekEnd, 'M月d日（eee）', { locale: ja })
    return sameDay ? `${startLabel}` : `${startLabel}〜 ${endLabel}`
  })()

  return {
    currentWeekStart,
    weekLabel,
    weeklyReport,
    prevWeek,
    nextWeek,
    weekSessions: weeklyTimeSessions,
  }
}
