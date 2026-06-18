import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { startOfWeek, endOfWeek, addWeeks, format, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale/ja'
import { enUS } from 'date-fns/locale/en-US'
import type { Todo } from '../types/todo'
import { storageAdapter } from '../db/database'

export type ReportTask = {
  todo: Todo
  completedAt: Date
}

export type ProjectReport = {
  project: string
  tasks: ReportTask[]
}

export const useWeeklyReport = () => {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }))
  const [weeklyTodos, setWeeklyTodos] = useState<Todo[]>([])

  useEffect(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })

    setWeeklyTodos([])
    void (async () => {
      const todos = await storageAdapter.getCompletedByDateRange(currentWeekStart, weekEnd)
      setWeeklyTodos(todos)
    })()
  }, [currentWeekStart])

  const prevWeek = () => {
    setCurrentWeekStart((current) => addWeeks(current, -1))
  }

  const nextWeek = () => {
    setCurrentWeekStart((current) => addWeeks(current, 1))
  }

  const getWeeklyReport = (): ProjectReport[] => {
    const completedTasks = weeklyTodos
      .filter((todo) => todo.completedAt !== null)
      .map((todo) => ({ todo, completedAt: todo.completedAt as Date }))
      .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())

    const groups = new Map<string, ReportTask[]>()

    completedTasks.forEach((reportTask) => {
      const projectKey = reportTask.todo.project === null ? 'General' : reportTask.todo.project
      const tasks = groups.get(projectKey) ?? []
      tasks.push(reportTask)
      groups.set(projectKey, tasks)
    })

    const groupedReports: ProjectReport[] = []
    const projectNames = Array.from(groups.keys())
      .filter((project) => project !== 'General')
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))

    projectNames.forEach((project) => {
      const tasks = groups.get(project)
      if (tasks) {
        groupedReports.push({ project, tasks })
      }
    })

    if (groups.has('General')) {
      groupedReports.push({ project: 'General', tasks: groups.get('General') ?? [] })
    }

    return groupedReports
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
  }
}
