import { beforeEach, describe, expect, it, vi } from 'vitest'

const { taskStore, sessionStore, mockTasks, mockSessions } = vi.hoisted(() => {
  const mockTasks = [
    { id: 'existing-task', task: 'Existing', completed: false, project: 'Work', order: 0, createdAt: new Date(), updatedAt: new Date(), completedAt: null },
  ]

  const mockSessions = [{ id: 1, taskId: 'existing-task', startedAt: new Date(), endedAt: new Date(), createdAt: new Date() }]

  return {
    mockTasks,
    mockSessions,
    taskStore: {
      get: vi.fn(async (id: string) => mockTasks.find((task) => task.id === id) ?? null),
      add: vi.fn(async (task: unknown) => {
        mockTasks.push(task as typeof mockTasks[number])
        return 1
      }),
      put: vi.fn(async (task: unknown) => {
        const index = mockTasks.findIndex((current) => current.id === (task as { id: string }).id)
        if (index >= 0) {
          mockTasks[index] = task as typeof mockTasks[number]
        } else {
          mockTasks.push(task as typeof mockTasks[number])
        }
        return 1
      }),
      toArray: vi.fn(async () => mockTasks),
    },
    sessionStore: {
      get: vi.fn(async (id: number) => mockSessions.find((session) => session.id === id) ?? null),
      add: vi.fn(async (session: unknown) => {
        mockSessions.push(session as typeof mockSessions[number])
        return 1
      }),
      put: vi.fn(async (session: unknown) => {
        const index = mockSessions.findIndex((current) => current.id === (session as { id?: number }).id)
        if (index >= 0) {
          mockSessions[index] = session as typeof mockSessions[number]
        } else {
          mockSessions.push(session as typeof mockSessions[number])
        }
        return 1
      }),
      toArray: vi.fn(async () => mockSessions),
    },
  }
})

vi.mock('../db/database', () => ({
  db: {
    tasks: taskStore,
    timeSessions: sessionStore,
  },
}))

import { exportAllData, importAllData } from './dataTransfer'

describe('dataTransfer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTasks.length = 1
    mockTasks[0] = { id: 'existing-task', task: 'Existing', completed: false, project: 'Work', order: 0, createdAt: new Date(), updatedAt: new Date(), completedAt: null }
    mockSessions.length = 1
    mockSessions[0] = { id: 1, taskId: 'existing-task', startedAt: new Date(), endedAt: new Date(), createdAt: new Date() }
  })

  it('imports non-conflicting tasks and sessions when skipping conflicts', async () => {
    const file = new File([
      JSON.stringify({
        version: 1,
        exportedAt: '2024-01-01T00:00:00.000Z',
        data: {
          tasks: [
            { id: 'existing-task', task: 'Existing', completed: false, project: 'Work', order: 0, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', completedAt: null },
            { id: 'new-task', task: 'New', completed: false, project: 'Work', order: 1, createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-01T00:00:00.000Z', completedAt: null },
          ],
          timeSessions: [
            { id: 10, taskId: 'existing-task', startedAt: '2024-01-02T00:00:00.000Z', endedAt: '2024-01-02T01:00:00.000Z', createdAt: '2024-01-02T00:00:00.000Z' },
            { id: 11, taskId: 'new-task', startedAt: '2024-01-02T00:00:00.000Z', endedAt: '2024-01-02T01:00:00.000Z', createdAt: '2024-01-02T00:00:00.000Z' },
          ],
        },
      }),
    ], 'backup.json', { type: 'application/json' })

    const result = await importAllData(file, 'skip')

    expect(result).toEqual({ taskCount: 1, sessionCount: 1 })
    expect(taskStore.add).toHaveBeenCalledTimes(1)
    expect(taskStore.put).not.toHaveBeenCalled()
    expect(mockTasks[1]?.createdAt).toBeInstanceOf(Date)
    expect(mockSessions[1]?.startedAt).toBeInstanceOf(Date)
  })

  it('exports a downloadable backup payload', async () => {
    const createObjectURL = vi.fn(() => 'blob:mock-url')
    const revokeObjectURL = vi.fn()
    const anchorClick = vi.fn()

    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    })

    const originalCreateElement = document.createElement.bind(document)
    const anchor = {
      href: '',
      download: '',
      click: anchorClick,
    }

    vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
      if (tagName === 'a') {
        return anchor as unknown as HTMLAnchorElement
      }
      return originalCreateElement(tagName)
    }) as typeof document.createElement)

    await exportAllData()

    expect(createObjectURL).toHaveBeenCalledTimes(1)
    expect(anchor.download).toContain('todo-backup-')
    expect(anchor.href).toBe('blob:mock-url')
    expect(anchorClick).toHaveBeenCalledTimes(1)
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url')
  })
})
