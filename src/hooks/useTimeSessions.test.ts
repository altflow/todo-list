import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useTimeSessions, formatDuration } from './useTimeSessions'
import { db } from '../db/database'


vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: (queryFn: () => unknown) => {
    try {
      return queryFn() as unknown
    } catch {
      return []
    }
  },
}))

vi.mock('../db/database', () => ({
  db: {
    timeSessions: {
      add: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          sortBy: vi.fn(() => []),
        })),
      })),
    },
  },
}))

describe('formatDuration', () => {
  it('formats 0 minutes as 0m', () => {
    expect(formatDuration(0)).toBe('0m')
  })

  it('formats 45 minutes as 45m', () => {
    expect(formatDuration(45)).toBe('45m')
  })

  it('formats 60 minutes as 1h 0m', () => {
    expect(formatDuration(60)).toBe('1h 0m')
  })

  it('formats 90 minutes as 1h 30m', () => {
    expect(formatDuration(90)).toBe('1h 30m')
  })
})

describe('useTimeSessions', () => {
  it('throws an error when endedAt is before startedAt', async () => {
    const start = new Date('2024-01-01T10:00:00')
    const end = new Date('2024-01-01T09:00:00')

    const { result } = renderHook(() => useTimeSessions('test'))

    await expect(result.current.addSession(start, end)).rejects.toThrow(
      'endedAt must be greater than startedAt'
    )
  })

  it('adds a session with updatedAt when endedAt is after startedAt', async () => {
    const start = new Date('2024-01-01T10:00:00')
    const end = new Date('2024-01-01T10:30:00')

    const { result } = renderHook(() => useTimeSessions('test'))

    await expect(result.current.addSession(start, end, 'new note')).resolves.toBeUndefined()
    expect(db.timeSessions.add).toHaveBeenCalledWith(expect.objectContaining({
      taskId: 'test',
      startedAt: start,
      endedAt: end,
      note: 'new note',
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    }))
  })

  it('updates a session with updatedAt when endedAt is after startedAt', async () => {
    const start = new Date('2024-01-01T10:00:00')
    const end = new Date('2024-01-01T10:30:00')

    const { result } = renderHook(() => useTimeSessions('test'))

    await expect(result.current.updateSession(1, start, end, 'updated note')).resolves.toBeUndefined()
    expect(db.timeSessions.update).toHaveBeenCalledWith(1, expect.objectContaining({
      startedAt: start,
      endedAt: end,
      note: 'updated note',
      updatedAt: expect.any(Date),
    }))
  })
})