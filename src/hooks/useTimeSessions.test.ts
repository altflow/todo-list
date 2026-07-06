import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@testing-library/react' 
import { useTimeSessions, formatDuration } from './useTimeSessions'


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
      where: vi.fn(() => ({
        equals: vi.fn(() => ({
          sortBy: vi.fn(() => []),  // Promise.resolve([]) → [] に戻す
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
})