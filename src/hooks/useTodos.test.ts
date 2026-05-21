import { describe, expect, it } from 'vitest'
import { todoReducer } from './useTodos'
import type { DeletedItem, Todo, TodoState } from '../types/todo'

const mockTodo: Todo = {
  id: 'test-id-1',
  task: 'テストタスク',
  project: null,
  completed: false,
  order: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  completedAt: null,
}

describe('todoReducer', () => {
  describe('ADD', () => {
    it('adds a todo and clears the deletedStack', () => {
      const addedTodo: Todo = { ...mockTodo, id: 'new-id', order: 1 }
      const state: TodoState = {
        todos: [mockTodo],
        deletedStack: [{ item: mockTodo, index: 0 }],
      }

      const nextState = todoReducer(state, { type: 'ADD', todo: addedTodo })

      expect(nextState.todos).toEqual([mockTodo, addedTodo])
      expect(nextState.deletedStack).toEqual([])
    })
  })

  describe('LOAD', () => {
    it('replaces todos and resets deletedStack', () => {
      const state: TodoState = {
        todos: [mockTodo],
        deletedStack: [{ item: mockTodo, index: 0 }],
      }
      const todos: Todo[] = [
        { ...mockTodo, id: 'loaded-id', order: 0 },
      ]

      const nextState = todoReducer(state, { type: 'LOAD', todos })

      expect(nextState.todos).toEqual(todos)
      expect(nextState.deletedStack).toEqual([])
    })
  })

  describe('TOGGLE_COMPLETE', () => {
    it('marks a todo completed and sets completedAt', () => {
      const completedTodo: Todo = {
        ...mockTodo,
        completed: true,
        completedAt: new Date('2024-01-02'),
      }
      const state: TodoState = {
        todos: [mockTodo],
        deletedStack: [],
      }

      const nextState = todoReducer(state, { type: 'TOGGLE_COMPLETE', todo: completedTodo })

      expect(nextState.todos[0].completed).toBe(true)
      expect(nextState.todos[0].completedAt).toEqual(completedTodo.completedAt)
    })

    it('unmarks a todo completed and clears completedAt', () => {
      const completedTodo: Todo = {
        ...mockTodo,
        completed: true,
        completedAt: new Date('2024-01-02'),
      }
      const state: TodoState = {
        todos: [completedTodo],
        deletedStack: [],
      }
      const undoneTodo: Todo = {
        ...completedTodo,
        completed: false,
        completedAt: null,
      }

      const nextState = todoReducer(state, { type: 'TOGGLE_COMPLETE', todo: undoneTodo })

      expect(nextState.todos[0].completed).toBe(false)
      expect(nextState.todos[0].completedAt).toBeNull()
    })
  })

  describe('DELETE', () => {
    it('removes a todo and pushes it onto deletedStack', () => {
      const state: TodoState = {
        todos: [mockTodo],
        deletedStack: [],
      }

      const nextState = todoReducer(state, { type: 'DELETE', id: mockTodo.id })

      expect(nextState.todos).toEqual([])
      expect(nextState.deletedStack).toEqual([{ item: mockTodo, index: 0 }])
    })

    it('does not change state when id does not exist', () => {
      const state: TodoState = {
        todos: [mockTodo],
        deletedStack: [],
      }

      const nextState = todoReducer(state, { type: 'DELETE', id: 'missing-id' })

      expect(nextState).toBe(state)
    })
  })

  describe('UNDO_DELETE', () => {
    it('does not change state when deletedStack is empty', () => {
      const state: TodoState = {
        todos: [mockTodo],
        deletedStack: [],
      }

      const nextState = todoReducer(state, { type: 'UNDO_DELETE' })

      expect(nextState).toBe(state)
    })

    it('restores the deleted todo at its original index and renumbers order', () => {
      const deletedItem: DeletedItem = {
        item: { ...mockTodo, id: 'restored-id', order: 0 },
        index: 0,
      }
      const state: TodoState = {
        todos: [
          { ...mockTodo, id: 'other-id', order: 1 },
        ],
        deletedStack: [deletedItem],
      }

      const nextState = todoReducer(state, { type: 'UNDO_DELETE' })

      expect(nextState.todos.map((todo) => todo.id)).toEqual(['restored-id', 'other-id'])
      expect(nextState.todos.map((todo) => todo.order)).toEqual([0, 1])
      expect(nextState.deletedStack).toEqual([])
    })
  })

  describe('REORDER', () => {
    it('replaces todos with the provided list', () => {
      const reorderedTodos: Todo[] = [
        { ...mockTodo, id: 'first', order: 0 },
        { ...mockTodo, id: 'second', order: 1 },
      ]
      const state: TodoState = {
        todos: [mockTodo],
        deletedStack: [],
      }

      const nextState = todoReducer(state, { type: 'REORDER', todos: reorderedTodos })

      expect(nextState.todos).toBe(reorderedTodos)
    })
  })

  describe('CLEAR_COMPLETED', () => {
    it('removes only completed todos and leaves deletedStack unchanged', () => {
      const completedTodo: Todo = {
        ...mockTodo,
        id: 'done-id',
        completed: true,
        completedAt: new Date('2024-01-02'),
        order: 1,
      }
      const state: TodoState = {
        todos: [mockTodo, completedTodo],
        deletedStack: [{ item: mockTodo, index: 0 }],
      }

      const nextState = todoReducer(state, { type: 'CLEAR_COMPLETED' })

      expect(nextState.todos).toEqual([mockTodo])
      expect(nextState.deletedStack).toEqual(state.deletedStack)
    })
  })
})
