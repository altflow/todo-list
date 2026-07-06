import { differenceInMinutes } from 'date-fns'
import type { Todo } from '../types/todo'
import type { TimeSession } from '../db/database'

export type ReportTask = {
  todo: Todo
  completedAt: Date
  totalMinutes: number
}

export type ProjectReport = {
  project: string
  tasks: ReportTask[]
  totalMinutes: number
}

/**
 * グルーピングロジック
 * 1. completedAt の昇順でソート
 * 2. project ごとにグルーピング
 * 3. project === null のグループは 'General' というラベルにする
 * 4. プロジェクトあり → アルファベット順
 * 5. General → 常に末尾
 */
export function groupByProject(todos: Todo[], timeSessions: TimeSession[] = []): ProjectReport[] {
  // 1. completedAt の昇順でソート
  const completedTasks = todos
    .filter((todo) => todo.completedAt !== null)
    .map((todo) => ({ todo, completedAt: todo.completedAt as Date }))
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())

  const taskMinutes = new Map<string | number, number>()

  timeSessions.forEach((session) => {
    const minutes = Math.max(0, differenceInMinutes(session.endedAt, session.startedAt))
    const currentMinutes = taskMinutes.get(session.taskId) ?? 0
    taskMinutes.set(session.taskId, currentMinutes + minutes)
  })

  // 2. project ごとにグルーピング
  const groups = new Map<string, ReportTask[]>()

  completedTasks.forEach((reportTask) => {
    const projectKey = reportTask.todo.project === null ? 'General' : reportTask.todo.project
    const tasks = groups.get(projectKey) ?? []
    tasks.push({
      ...reportTask,
      totalMinutes: taskMinutes.get(reportTask.todo.id) ?? 0,
    })
    groups.set(projectKey, tasks)
  })

  // 3. プロジェクトあり → アルファベット順（General を除外）
  const projectNames = Array.from(groups.keys())
    .filter((project) => project !== 'General')
    .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))

  const groupedReports: ProjectReport[] = []

  // プロジェクトをアルファベット順に追加
  projectNames.forEach((project) => {
    const tasks = groups.get(project)
    if (tasks) {
      groupedReports.push({
        project,
        tasks,
        totalMinutes: tasks.reduce((sum, task) => sum + task.totalMinutes, 0),
      })
    }
  })

  // 4. General は常に末尾
  if (groups.has('General')) {
    const tasks = groups.get('General') ?? []
    groupedReports.push({ project: 'General', tasks, totalMinutes: tasks.reduce((sum, task) => sum + task.totalMinutes, 0) })
  }

  return groupedReports
}
