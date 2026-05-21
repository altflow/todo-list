import { describe, expect, it } from 'vitest'
import { createTodo, parseProject, reorderTodos } from './todoLogic'
import type { Todo } from '../types/todo'

describe('parseProject', () => {
  it('parses project and task from ProjectName: タスク名', () => {
    expect(parseProject('ProjectName: タスク名')).toEqual({
      project: 'ProjectName',
      task: 'タスク名',
    })
  })

  it('returns null project for task only', () => {
    expect(parseProject('タスク名のみ')).toEqual({
      project: null,
      task: 'タスク名のみ',
    })
  })

  it('trims spaces around project and task', () => {
    expect(parseProject('  Project  :  タスク  ')).toEqual({
      project: 'Project',
      task: 'タスク',
    })
  })

  it('does not detect URL as project', () => {
    expect(parseProject('http://example.com')).toEqual({
      project: null,
      task: 'http://example.com',
    })
  })

  it('returns null project when colon is followed by nothing', () => {
    expect(parseProject('Project: ')).toEqual({
      project: null,
      task: 'Project: ',
    })
  })

  it('returns null project when project name is empty', () => {
    expect(parseProject(': タスク名')).toEqual({
      project: null,
      task: ': タスク名',
    })
  })
})

describe('createTodo', () => {
  it('creates a todo with correct default fields', () => {
    const todo = createTodo('タスク', 2)

    expect(todo.id).toEqual(expect.any(String))
    expect(todo.task).toBe('タスク')
    expect(todo.project).toBeNull()
    expect(todo.completed).toBe(false)
    expect(todo.completedAt).toBeNull()
    expect(todo.order).toBe(2)
    expect(todo.createdAt).toBeInstanceOf(Date)
    expect(todo.updatedAt).toBeInstanceOf(Date)
  })

  it('parses project when task string contains Project: タスク', () => {
    const todo = createTodo('Project: タスク', 1)

    expect(todo.project).toBe('Project')
    expect(todo.task).toBe('タスク')
  })

  it('returns null project for tasks without project prefix', () => {
    const todo = createTodo('タスクのみ', 3)

    expect(todo.project).toBeNull()
    expect(todo.task).toBe('タスクのみ')
  })
})

describe('reorderTodos', () => {
  const todos: Todo[] = [
    { id: 'todo-0', task: 'task0', project: null, completed: false, order: 0, createdAt: new Date(), updatedAt: new Date(), completedAt: null },
    { id: 'todo-1', task: 'task1', project: null, completed: false, order: 1, createdAt: new Date(), updatedAt: new Date(), completedAt: null },
    { id: 'todo-2', task: 'task2', project: null, completed: false, order: 2, createdAt: new Date(), updatedAt: new Date(), completedAt: null },
    { id: 'todo-3', task: 'task3', project: null, completed: false, order: 3, createdAt: new Date(), updatedAt: new Date(), completedAt: null },
  ]

  it('moves the first item to the end and reassigns order values', () => {
    const result = reorderTodos(todos, 'todo-0', 'todo-3')

    expect(result.map((todo) => todo.id)).toEqual(['todo-1', 'todo-2', 'todo-3', 'todo-0'])
    expect(result.map((todo) => todo.order)).toEqual([0, 1, 2, 3])
  })

  it('moves the last item to the start and reassigns order values', () => {
    const result = reorderTodos(todos, 'todo-3', 'todo-0')

    expect(result.map((todo) => todo.id)).toEqual(['todo-3', 'todo-0', 'todo-1', 'todo-2'])
    expect(result.map((todo) => todo.order)).toEqual([0, 1, 2, 3])
  })

  it('returns the original todos when activeId does not exist', () => {
    const result = reorderTodos(todos, 'missing-id', 'todo-2')

    expect(result).toBe(todos)
  })

  it('returns the original todos when overId does not exist', () => {
    const result = reorderTodos(todos, 'todo-1', 'missing-id')

    expect(result).toBe(todos)
  })
})
