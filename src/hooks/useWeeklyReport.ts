import { useState } from 'react'
import { startOfWeek, endOfWeek, addWeeks, isWithinInterval, format, isSameDay } from 'date-fns'
import { ja } from 'date-fns/locale/ja'
import type { Todo } from '../types/todo'

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

  const prevWeek = () => {
    setCurrentWeekStart((current) => addWeeks(current, -1))
  }

  const nextWeek = () => {
    setCurrentWeekStart((current) => addWeeks(current, 1))
  }

  const getWeeklyReport = (todos: Todo[]): ProjectReport[] => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    const completedTasks = todos
      .filter((todo) => todo.completedAt !== null)
      .map((todo) => ({ todo, completedAt: todo.completedAt as Date }))
      .filter(({ completedAt }) => isWithinInterval(completedAt, { start: currentWeekStart, end: weekEnd }))
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

  const weekLabel = (() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 })
    const sameDay = isSameDay(currentWeekStart, weekEnd)
    const startLabel = format(currentWeekStart, 'yyyy年M月d日（eee）', { locale: ja })
    const endLabel = format(weekEnd, 'M月d日（eee）', { locale: ja })
    return sameDay ? `${startLabel}` : `${startLabel}〜 ${endLabel}`
  })()

  return {
    currentWeekStart,
    weekLabel,
    getWeeklyReport,
    prevWeek,
    nextWeek,
  }
}
