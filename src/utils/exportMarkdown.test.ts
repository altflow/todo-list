import { beforeEach, describe, expect, it, vi } from 'vitest'
import { generateProjectMarkdown } from './exportMarkdown'

const mockTodos = [
  {
    id: '1',
    task: 'Task One',
    completed: true,
    project: 'Project Alpha',
    order: 0,
    createdAt: new Date('2024-01-01T00:00:00'),
    updatedAt: new Date('2024-01-01T00:00:00'),
    completedAt: new Date('2024-01-05T00:00:00'),
    note: 'Done note',
  },
  {
    id: '2',
    task: 'Task Two',
    completed: false,
    project: 'Project Alpha',
    order: 1,
    createdAt: new Date('2024-01-02T00:00:00'),
    updatedAt: new Date('2024-01-02T00:00:00'),
    completedAt: null,
    note: undefined,
  },
]

const mockSessions = [
  {
    taskId: '1',
    startedAt: new Date('2024-01-02T10:00:00'),
    endedAt: new Date('2024-01-02T11:30:00'),
    note: 'First note',
    createdAt: new Date('2024-01-02T10:00:00'),
  },
  {
    taskId: '1',
    startedAt: new Date('2024-01-03T09:00:00'),
    endedAt: new Date('2024-01-03T09:45:00'),
    note: undefined,
    createdAt: new Date('2024-01-03T09:00:00'),
  },
]

vi.mock('../db/database', async () => {
  const actual = await vi.importActual<typeof import('../db/database')>('../db/database')

  return {
    ...actual,
    db: {
      tasks: {
        toArray: vi.fn(async () => mockTodos),
      },
      timeSessions: {
        where: vi.fn(() => ({
          between: vi.fn(() => ({
            toArray: vi.fn(async () => mockSessions),
          })),
        })),
      },
    },
  }
})

describe('generateProjectMarkdown', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('creates markdown grouped by task and session order', async () => {
    const markdown = await generateProjectMarkdown(1, 'Project Alpha', new Date('2024-01-01'), new Date('2024-01-10'))

    expect(markdown).toContain('# Project Alpha')
    expect(markdown).toContain('- 期間: 2024-01-01 ～ 2024-01-10')
    expect(markdown).toContain('## Task One')
    expect(markdown).toContain('### 01/02 10:00 ～ 01/02 11:30 (1h 30m)')
    expect(markdown).toContain('First note')
    expect(markdown).not.toContain('## Task Two')
  })
})
