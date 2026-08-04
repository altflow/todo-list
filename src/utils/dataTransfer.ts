import { db } from '../db/database'

export type ConflictStrategy = 'skip' | 'overwrite'

export interface BackupPayload {
  version: number
  exportedAt: string
  data: {
    tasks: Array<{
      id: string
      task: string
      completed: boolean
      project: string | null
      order: number
      createdAt: Date
      updatedAt: Date
      completedAt: Date | null
      note?: string
    }>
    timeSessions: Array<{
      id?: number
      taskId: string | number
      startedAt: Date
      endedAt: Date
      note?: string
      createdAt: Date
      updatedAt: Date
    }>
  }
}

export async function exportAllData(): Promise<void> {
  const [tasks, timeSessions] = await Promise.all([db.tasks.toArray(), db.timeSessions.toArray()])

  const payload: BackupPayload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: {
      tasks,
      timeSessions,
    },
  }

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const date = new Date().toISOString().slice(0, 10)

  anchor.href = url
  anchor.download = `todo-backup-${date}.json`
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function importAllData(
  file: File,
  conflictStrategy: ConflictStrategy,
): Promise<{ taskCount: number; sessionCount: number }> {
  const text = await readFileAsText(file)
  const parsed = JSON.parse(text) as Partial<BackupPayload>

  if (!parsed || typeof parsed !== 'object' || !('version' in parsed)) {
    throw new Error('Invalid file format')
  }

  const payload = parsed as BackupPayload
  const tasks = Array.isArray(payload.data?.tasks) ? payload.data.tasks : []
  const timeSessions = Array.isArray(payload.data?.timeSessions) ? payload.data.timeSessions : []
  const normalizedTasks = tasks.map((task) => ({
    ...task,
    createdAt: toDate(task.createdAt),
    updatedAt: task.updatedAt ? toDate(task.updatedAt) : new Date(),
    completedAt: task.completedAt ? toDate(task.completedAt) : null,
  }))
  const normalizedTimeSessions = timeSessions.map((session) => ({
    ...session,
    startedAt: toDate(session.startedAt),
    endedAt: toDate(session.endedAt),
    createdAt: toDate(session.createdAt),
    updatedAt: session.updatedAt ? toDate(session.updatedAt) : new Date(),
  }))

  if (conflictStrategy === 'overwrite') {
    for (const task of normalizedTasks) {
      await db.tasks.put(task)
    }

    for (const session of normalizedTimeSessions) {
      await db.timeSessions.put(session)
    }

    return { taskCount: normalizedTasks.length, sessionCount: normalizedTimeSessions.length }
  }

  let taskCount = 0
  let sessionCount = 0
  const importedTaskIds = new Set<string>()

  for (const task of normalizedTasks) {
    const existingTask = await db.tasks.get(task.id)
    if (existingTask) {
      continue
    }

    await db.tasks.add(task)
    importedTaskIds.add(task.id)
    taskCount += 1
  }

  for (const session of normalizedTimeSessions) {
    const taskId = session.taskId
    const isImportedTask = typeof taskId === 'string' || typeof taskId === 'number' ? importedTaskIds.has(String(taskId)) : false
    if (!isImportedTask) {
      continue
    }

    const existingSession = typeof session.id === 'number' ? await db.timeSessions.get(session.id) : null
    if (existingSession) {
      continue
    }

    await db.timeSessions.add(session)
    sessionCount += 1
  }

  return { taskCount, sessionCount }
}

function toDate(value: unknown): Date {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value)
    if (!Number.isNaN(date.getTime())) {
      return date
    }
  }

  throw new Error('Invalid file format')
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }

      reject(new Error('Invalid file format'))
    }

    reader.onerror = () => reject(new Error('Invalid file format'))
    reader.readAsText(file)
  })
}
