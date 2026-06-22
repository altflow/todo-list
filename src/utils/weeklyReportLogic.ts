import type { Todo } from '../types/todo'

export type ReportTask = {
  todo: Todo
  completedAt: Date
}

export type ProjectReport = {
  project: string
  tasks: ReportTask[]
}

/**
 * グルーピングロジック
 * 1. completedAt の昇順でソート
 * 2. project ごとにグルーピング
 * 3. project === null のグループは 'General' というラベルにする
 * 4. プロジェクトあり → アルファベット順
 * 5. General → 常に末尾
 */
export function groupByProject(todos: Todo[]): ProjectReport[] {
  // 1. completedAt の昇順でソート
  const completedTasks = todos
    .filter((todo) => todo.completedAt !== null)
    .map((todo) => ({ todo, completedAt: todo.completedAt as Date }))
    .sort((a, b) => a.completedAt.getTime() - b.completedAt.getTime())

  // 2. project ごとにグルーピング
  const groups = new Map<string, ReportTask[]>()

  completedTasks.forEach((reportTask) => {
    const projectKey = reportTask.todo.project === null ? 'General' : reportTask.todo.project
    const tasks = groups.get(projectKey) ?? []
    tasks.push(reportTask)
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
      groupedReports.push({ project, tasks })
    }
  })

  // 4. General は常に末尾
  if (groups.has('General')) {
    groupedReports.push({ project: 'General', tasks: groups.get('General') ?? [] })
  }

  return groupedReports
}
