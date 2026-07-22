import { format } from 'date-fns'
import { db, type TimeSession } from '../db/database'
import { formatDuration } from '../hooks/useTimeSessions'
import type { Todo } from '../types/todo'

type TaskWithSessions = {
  task: Todo
  sessions: TimeSession[]
}

function getInclusiveEndDate(date: Date): Date {
  const next = new Date(date)
  next.setHours(23, 59, 59, 999)
  return next
}

function formatDateLabel(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function formatSessionDate(date: Date): string {
  return format(date, 'MM/dd HH:mm')
}

function sanitizeFilename(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
}

export async function generateProjectMarkdown(
  projectId: number,
  projectName: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  void projectId

  const tasks = await db.tasks.toArray()
  const projectTasks = tasks.filter((task) => {
    const taskProjectId = (task as Todo & { projectId?: number }).projectId
    return task.project === projectName || taskProjectId === projectId
  })

  const normalizedStartDate = new Date(startDate)
  normalizedStartDate.setHours(0, 0, 0, 0)
  const normalizedEndDate = getInclusiveEndDate(new Date(endDate))

  const allSessions = await db.timeSessions
    .where('startedAt')
    .between(normalizedStartDate, normalizedEndDate, true, true)
    .toArray()

  const sessionsByTaskId = allSessions.reduce<Record<string | number, TimeSession[]>>((acc, session) => {
    const taskId = session.taskId
    const existing = acc[taskId] ?? []
    existing.push(session)
    acc[taskId] = existing
    return acc
  }, {})

  const taskSections: TaskWithSessions[] = projectTasks
    .sort((left, right) => left.order - right.order)
    .map((task) => ({
      task,
      sessions: (sessionsByTaskId[task.id] ?? []).sort((left, right) => left.startedAt.getTime() - right.startedAt.getTime()),
    }))
    .filter(({ sessions }) => sessions.length > 0)

  const lines: string[] = [
    `# ${projectName}`,
    `- 期間: ${formatDateLabel(startDate)} ～ ${formatDateLabel(endDate)}`,
  ]

  const markdownSections = taskSections.map(({ task, sessions }) => {
    const totalMinutes = sessions.reduce((total, session) => {
      return total + Math.max(0, Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000))
    }, 0)
    const completedLine = task.completedAt ? `- 完了日: ${formatDateLabel(task.completedAt)}` : '- 完了日: 未完了'
    const sessionLines = sessions.map((session) => {
      const sessionLine = `### ${formatSessionDate(session.startedAt)} ～ ${formatSessionDate(session.endedAt)} (${formatDuration(Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 60000))})`
      if (!session.note) {
        return sessionLine
      }
      return `${sessionLine}\n${session.note}`
    })

    return [
      `## ${task.task}`,
      `- 合計時間: ${formatDuration(totalMinutes)}`,
      completedLine,
      ...sessionLines,
    ].join('\n')
  })

  return [...lines, ...(markdownSections.length > 0 ? [''] : []), ...markdownSections].join('\n\n')
}

export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = sanitizeFilename(filename)
  link.click()
  URL.revokeObjectURL(url)
}

export async function copyToClipboard(content: string): Promise<void> {
  await navigator.clipboard.writeText(content)
}
