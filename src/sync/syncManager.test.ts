import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../db/database'
import { generateSyncData, mergeSyncData } from './syncManager'

describe('syncManager', () => {
  beforeEach(async () => {
    localStorage.clear()
    await db.tasks.clear()
    await db.timeSessions.clear()
  })

  it('generates export data from the local database', async () => {
    await db.tasks.put({
      id: 'task-1',
      task: 'Write tests',
      completed: false,
      project: 'work',
      order: 1,
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-02T00:00:00.000Z'),
      completedAt: null,
    })

    await db.timeSessions.put({
      id: 1,
      taskId: 'task-1',
      startedAt: new Date('2024-01-01T00:00:00.000Z'),
      endedAt: new Date('2024-01-01T01:00:00.000Z'),
      createdAt: new Date('2024-01-01T00:00:00.000Z'),
      updatedAt: new Date('2024-01-01T01:00:00.000Z'),
    })

    const data = await generateSyncData()

    expect(data.version).toBe(1)
    expect(data.deviceId).toBeTruthy()
    expect(data.data.tasks).toHaveLength(1)
    expect(data.data.timeSessions).toHaveLength(1)
  })

  it('merges records by id and prefers the newer updatedAt', () => {
    const local = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      deviceId: 'device-a',
      data: {
        tasks: [
          {
            id: 'task-1',
            task: 'Older task',
            completed: false,
            project: null,
            order: 1,
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            completedAt: null,
          },
        ],
        timeSessions: [],
      },
    }

    const remote = {
      version: 1,
      exportedAt: '2024-01-02T00:00:00.000Z',
      deviceId: 'device-b',
      data: {
        tasks: [
          {
            id: 'task-1',
            task: 'Newer task',
            completed: true,
            project: 'work',
            order: 2,
            createdAt: '2024-01-02T00:00:00.000Z',
            updatedAt: '2024-01-03T00:00:00.000Z',
            completedAt: '2024-01-03T00:00:00.000Z',
          },
        ],
        timeSessions: [],
      },
    }

    const merged = mergeSyncData(local as never, remote as never)

    expect(merged.data.tasks).toHaveLength(1)
    expect(merged.data.tasks[0].task).toBe('Newer task')
    expect(merged.data.tasks[0].updatedAt).toBeInstanceOf(Date)
    expect(merged.data.tasks[0].createdAt).toBeInstanceOf(Date)
    expect(merged.data.tasks[0].completedAt).toBeInstanceOf(Date)
  })

  it('normalizes synced time session dates to Date instances', () => {
    const local = {
      version: 1,
      exportedAt: '2024-01-01T00:00:00.000Z',
      deviceId: 'device-a',
      data: {
        tasks: [],
        timeSessions: [
          {
            id: 1,
            taskId: 'task-1',
            startedAt: '2024-01-01T00:00:00.000Z',
            endedAt: '2024-01-01T01:00:00.000Z',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T01:00:00.000Z',
          },
        ],
      },
    }

    const merged = mergeSyncData(local as never, local as never)

    expect(merged.data.timeSessions[0].startedAt).toBeInstanceOf(Date)
    expect(merged.data.timeSessions[0].endedAt).toBeInstanceOf(Date)
    expect(merged.data.timeSessions[0].createdAt).toBeInstanceOf(Date)
    expect(merged.data.timeSessions[0].updatedAt).toBeInstanceOf(Date)
  })
})
