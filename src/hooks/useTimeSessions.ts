import { useMemo } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { differenceInMinutes } from 'date-fns'
import { db, type TimeSession } from '../db/database'

export type UseTimeSessionsResult = {
  sessions: TimeSession[] | undefined
  totalMinutes: number
  addSession: (startedAt: Date, endedAt: Date, note?: string) => Promise<void>
  updateSession: (id: number, startedAt: Date, endedAt: Date, note?: string) => Promise<void>
  deleteSession: (id: number) => Promise<void>
}

export const useTimeSessions = (taskId: string | number): UseTimeSessionsResult => {
  const normalizedTaskId = taskId

  const sessions = useLiveQuery(
    () => db.timeSessions.where('taskId').equals(normalizedTaskId).sortBy('startedAt'),
    [normalizedTaskId]
  )

  const totalMinutes = useMemo<number>(() => {
    if (!sessions) {
      return 0
    }

    return sessions.reduce((total, session) => {
      return total + differenceInMinutes(session.endedAt, session.startedAt)
    }, 0)
  }, [sessions])

  const addSession = async (startedAt: Date, endedAt: Date, note?: string): Promise<void> => {
    if (endedAt <= startedAt) {
      throw new Error('endedAt must be greater than startedAt')
    }

    await db.timeSessions.add({
      taskId: normalizedTaskId,
      startedAt,
      endedAt,
      note,
      createdAt: new Date(),
    })
  }

  const updateSession = async (id: number, startedAt: Date, endedAt: Date, note?: string): Promise<void> => {
    if (endedAt <= startedAt) {
      throw new Error('endedAt must be greater than startedAt')
    }

    await db.timeSessions.update(id, { startedAt, endedAt, note })
  }

  const deleteSession = async (id: number): Promise<void> => {
    await db.timeSessions.delete(id)
  }

  return {
    sessions,
    totalMinutes,
    addSession,
    updateSession,
    deleteSession,
  }
}

export function formatDuration(minutes: number): string {
  const totalMinutes = Math.max(0, Math.floor(minutes))
  const hours = Math.floor(totalMinutes / 60)
  const remainingMinutes = totalMinutes % 60

  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`
  }

  return `${remainingMinutes}m`
}
