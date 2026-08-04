import { describe, expect, it } from 'vitest'
import { groupByProject } from '../utils/weeklyReportLogic'
import type { Todo } from '../types/todo'
import type { TimeSession } from '../db/database'

const makeTodo = (overrides: Partial<Todo>): Todo => ({
  id: 'test-id',
  task: 'テストタスク',
  completed: true,
  project: null,
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  completedAt: new Date('2024-01-08'),
  ...overrides,
})

const makeSession = (overrides: Partial<TimeSession>): TimeSession => ({
  taskId: 'test-id',
  startedAt: new Date('2024-01-08T10:00:00'),
  endedAt: new Date('2024-01-08T10:30:00'),
  createdAt: new Date('2024-01-08T10:00:00'),
  updatedAt: new Date('2024-01-08T10:00:00'),
  ...overrides,
})

describe('groupByProject', () => {
  it('groups todos by project name when project is specified', () => {
    const todos = [
      makeTodo({ id: '1', project: 'Work', completedAt: new Date('2024-01-08T10:00:00') }),
      makeTodo({ id: '2', project: 'Work', completedAt: new Date('2024-01-08T11:00:00') }),
      makeTodo({ id: '3', project: 'Personal', completedAt: new Date('2024-01-08T12:00:00') }),
    ]

    const result = groupByProject(todos)

    expect(result).toHaveLength(2)
    expect(result[0].project).toBe('Personal')
    expect(result[0].tasks).toHaveLength(1)
    expect(result[1].project).toBe('Work')
    expect(result[1].tasks).toHaveLength(2)
  })

  it('groups null project as "General"', () => {
    const todos = [
      makeTodo({ id: '1', project: null, completedAt: new Date('2024-01-08T10:00:00') }),
      makeTodo({ id: '2', project: null, completedAt: new Date('2024-01-08T11:00:00') }),
    ]

    const result = groupByProject(todos)

    expect(result).toHaveLength(1)
    expect(result[0].project).toBe('General')
    expect(result[0].tasks).toHaveLength(2)
  })

  it('sorts multiple projects in alphabetical order', () => {
    const todos = [
      makeTodo({ id: '1', project: 'Zebra', completedAt: new Date('2024-01-08T10:00:00') }),
      makeTodo({ id: '2', project: 'Apple', completedAt: new Date('2024-01-08T11:00:00') }),
      makeTodo({ id: '3', project: 'Mango', completedAt: new Date('2024-01-08T12:00:00') }),
    ]

    const result = groupByProject(todos)

    expect(result).toHaveLength(3)
    expect(result[0].project).toBe('Apple')
    expect(result[1].project).toBe('Mango')
    expect(result[2].project).toBe('Zebra')
  })

  it('places General group at the end', () => {
    const todos = [
      makeTodo({ id: '1', project: 'Work', completedAt: new Date('2024-01-08T10:00:00') }),
      makeTodo({ id: '2', project: null, completedAt: new Date('2024-01-08T11:00:00') }),
      makeTodo({ id: '3', project: 'Personal', completedAt: new Date('2024-01-08T12:00:00') }),
    ]

    const result = groupByProject(todos)

    expect(result).toHaveLength(3)
    expect(result[0].project).toBe('Personal')
    expect(result[1].project).toBe('Work')
    expect(result[2].project).toBe('General')
  })

  it('sorts tasks within a group by completedAt in ascending order', () => {
    const todos = [
      makeTodo({ id: '1', project: 'Work', completedAt: new Date('2024-01-08T15:00:00') }),
      makeTodo({ id: '2', project: 'Work', completedAt: new Date('2024-01-08T10:00:00') }),
      makeTodo({ id: '3', project: 'Work', completedAt: new Date('2024-01-08T12:00:00') }),
    ]

    const result = groupByProject(todos)

    expect(result).toHaveLength(1)
    expect(result[0].tasks).toHaveLength(3)
    expect(result[0].tasks[0].completedAt).toEqual(new Date('2024-01-08T10:00:00'))
    expect(result[0].tasks[1].completedAt).toEqual(new Date('2024-01-08T12:00:00'))
    expect(result[0].tasks[2].completedAt).toEqual(new Date('2024-01-08T15:00:00'))
  })

  it('aggregates task and project time from weekly time sessions', () => {
    const todos = [
      makeTodo({ id: '1', project: 'Work', completedAt: new Date('2024-01-08T10:00:00') }),
      makeTodo({ id: '2', project: 'Work', completedAt: new Date('2024-01-08T11:00:00') }),
      makeTodo({ id: '3', project: null, completedAt: new Date('2024-01-08T12:00:00') }),
    ]

    const sessions = [
      makeSession({ taskId: '1', startedAt: new Date('2024-01-08T10:00:00'), endedAt: new Date('2024-01-08T10:45:00') }),
      makeSession({ taskId: '1', startedAt: new Date('2024-01-08T11:00:00'), endedAt: new Date('2024-01-08T11:30:00') }),
      makeSession({ taskId: '2', startedAt: new Date('2024-01-08T12:00:00'), endedAt: new Date('2024-01-08T12:20:00') }),
    ]

    const result = groupByProject(todos, sessions)

    expect(result).toHaveLength(2)
    expect(result[0].project).toBe('Work')
    expect(result[0].tasks[0].totalMinutes).toBe(75)
    expect(result[0].tasks[1].totalMinutes).toBe(20)
    expect(result[0].totalMinutes).toBe(95)
    expect(result[1].project).toBe('General')
    expect(result[1].tasks[0].totalMinutes).toBe(0)
    expect(result[1].totalMinutes).toBe(0)
  })

  it('returns empty array when given empty array', () => {
    const result = groupByProject([])

    expect(result).toEqual([])
  })
})
