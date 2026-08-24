import { db } from '../db/database'
import type { ExportData, SyncProvider } from './SyncProvider'

type SyncRecord = {
  id?: string | number
  updatedAt?: Date | string
}

function getDeviceId(): string {
  const storageKey = 'sync_device_id'
  const existingDeviceId = localStorage.getItem(storageKey)

  if (existingDeviceId) {
    return existingDeviceId
  }

  const generatedDeviceId = globalThis.crypto?.randomUUID?.()

  if (!generatedDeviceId) {
    throw new Error('Failed to generate a sync device ID')
  }

  localStorage.setItem(storageKey, generatedDeviceId)

  return generatedDeviceId
}

function toDate(value: Date | string | undefined): Date | undefined {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string') {
    return new Date(value)
  }

  return undefined
}

function normalizeTaskDates<T extends { createdAt?: Date | string; updatedAt?: Date | string; completedAt?: Date | string | null }>(task: T): T {
  const normalizedCreatedAt = toDate(task.createdAt) ?? new Date()
  const normalizedUpdatedAt = toDate(task.updatedAt) ?? new Date()
  const normalizedCompletedAt = task.completedAt ? toDate(task.completedAt) ?? null : null

  return {
    ...task,
    createdAt: normalizedCreatedAt as T['createdAt'],
    updatedAt: normalizedUpdatedAt as T['updatedAt'],
    completedAt: normalizedCompletedAt as T['completedAt'],
  }
}

function normalizeTimeSessionDates<T extends { startedAt?: Date | string; endedAt?: Date | string; createdAt?: Date | string; updatedAt?: Date | string }>(session: T): T {
  return {
    ...session,
    startedAt: toDate(session.startedAt) ?? new Date() as T['startedAt'],
    endedAt: toDate(session.endedAt) ?? new Date() as T['endedAt'],
    createdAt: toDate(session.createdAt) ?? new Date() as T['createdAt'],
    updatedAt: toDate(session.updatedAt) ?? new Date() as T['updatedAt'],
  }
}

function mergeById<T extends SyncRecord>(localItems: T[], remoteItems: T[]): T[] {
  const mergedItems = new Map<string, T>()

  for (const item of [...localItems, ...remoteItems]) {
    if (item.id === undefined || item.id === null) {
      continue
    }

    const key = String(item.id)
    const existingItem = mergedItems.get(key)

    if (!existingItem) {
      const normalizedItem = {
        ...item,
        updatedAt: toDate(item.updatedAt) as T['updatedAt'],
      }
      mergedItems.set(key, normalizedItem)
      continue
    }

    const existingUpdatedAt = toDate(existingItem.updatedAt)
    const incomingUpdatedAt = toDate(item.updatedAt)

    if (incomingUpdatedAt && (!existingUpdatedAt || incomingUpdatedAt > existingUpdatedAt)) {
      mergedItems.set(key, { ...item, updatedAt: incomingUpdatedAt as T['updatedAt'] })
    }
  }

  return Array.from(mergedItems.values()).map((item) => {
    if ('completedAt' in item || 'createdAt' in item) {
      return normalizeTaskDates(item as never) as T
    }

    return normalizeTimeSessionDates(item as never) as T
  })
}

export async function generateSyncData(): Promise<ExportData> {
  const [tasks, timeSessions] = await Promise.all([db.tasks.toArray(), db.timeSessions.toArray()])

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    deviceId: getDeviceId(),
    data: { tasks, timeSessions },
  }
}

export function mergeSyncData(local: ExportData, remote: ExportData): ExportData {
  const mergedTasks = mergeById(local.data.tasks, remote.data.tasks)
  const mergedTimeSessions = mergeById(local.data.timeSessions, remote.data.timeSessions)

  return {
    version: Math.max(local.version, remote.version, 1),
    exportedAt: new Date().toISOString(),
    deviceId: local.deviceId || remote.deviceId || getDeviceId(),
    data: {
      tasks: mergedTasks.map((task) => normalizeTaskDates(task as never) as never),
      timeSessions: mergedTimeSessions.map((session) => normalizeTimeSessionDates(session as never) as never),
    },
  }
}

export async function syncToDrive(provider: SyncProvider): Promise<void> {
  const localData = await generateSyncData()
  const remoteData = await provider.download()
  const mergedData = remoteData ? mergeSyncData(localData, remoteData) : localData

  await provider.upload(mergedData)

  await db.transaction('rw', db.tasks, db.timeSessions, async () => {
    await db.tasks.bulkPut(mergedData.data.tasks)
    await db.timeSessions.bulkPut(mergedData.data.timeSessions)
  })

  window.dispatchEvent(new CustomEvent('sync-completed'))
}

export async function syncFromDrive(provider: SyncProvider): Promise<void> {
  const remoteData = await provider.download()

  if (!remoteData) {
    return
  }

  const localData = await generateSyncData()
  const mergedData = mergeSyncData(localData, remoteData)

  await db.tasks.bulkPut(mergedData.data.tasks)
  await db.timeSessions.bulkPut(mergedData.data.timeSessions)

  window.dispatchEvent(new CustomEvent('sync-completed'))

  await provider.upload(mergedData)
}

export { getDeviceId }
