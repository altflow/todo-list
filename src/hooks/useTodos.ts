import { useEffect, useCallback, useReducer } from 'react'
import type { DeletedItem, Todo, TodoAction, TodoState } from '../types/todo'
import { storageAdapter } from '../db/database'
import { createTodo, parseProject, reorderTodos } from '../utils/todoLogic'


const initialState: TodoState = {
  todos: [],
  deletedStack: [],
}

export const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
  switch (action.type) {
    case 'ADD': {
      return {
        todos: [...state.todos, action.todo],
        deletedStack: [],
      }
    }

    case 'LOAD': {
      return {
        todos: action.todos,
        deletedStack: [],
      }
    }

    case 'TOGGLE_COMPLETE': {
      const todos = state.todos.map((todo) =>
        todo.id === action.todo.id ? action.todo : todo
      )

      return {
        ...state,
        todos,
      }
    }

    case 'DELETE': {
      const index = state.todos.findIndex((todo) => todo.id === action.id)
      if (index === -1) {
        return state
      }

      const item = state.todos[index]
      const todos = state.todos.filter((todo) => todo.id !== action.id)
      const deletedStack: DeletedItem[] = [{ item, index }]

      return {
        todos,
        deletedStack,
      }
    }

    case 'UNDO_DELETE': {
      if (state.deletedStack.length === 0) {
        return state
      }

      const [restored] = state.deletedStack
      const todos = [...state.todos]
      const insertIndex = Math.min(Math.max(restored.index, 0), todos.length)
      todos.splice(insertIndex, 0, restored.item)

      const normalizedTodos = todos.map((todo, idx) => ({
        ...todo,
        order: idx,
      }))

      return {
        todos: normalizedTodos,
        deletedStack: [],
      }
    }

    case 'DISMISS_DELETE': {
      return {
        ...state,
        deletedStack: [],
      }
    }

    case 'UPDATE_TASK': {
      const todos = state.todos.map((todo) =>
        todo.id === action.todo.id ? action.todo : todo
      )

      return {
        ...state,
        todos,
      }
    }

    case 'REORDER': {
      return {
        ...state,
        todos: action.todos,
      }
    }

    case 'CLEAR_COMPLETED': {
      return {
        ...state,
        todos: state.todos.filter((todo) => !todo.completed),
      }
    }

    default:
      return state
  }
}

export const useTodos = () => {
  const [state, dispatch] = useReducer(todoReducer, initialState)

  useEffect(() => {
    void (async () => {
      const todos = await storageAdapter.getAll()
      dispatch({ type: 'LOAD', todos })
    })()
  }, [])

  const addTodo = useCallback(async (task: string) => {
    const newTodo = createTodo(task, state.todos.length)

    await storageAdapter.add(newTodo)
    dispatch({ type: 'ADD', todo: newTodo })
  }, [state.todos.length])

  const toggleComplete = useCallback(async (id: string) => {
    const todo = state.todos.find((item) => item.id === id)
    if (!todo) {
      return
    }

    const updatedTodo: Todo = {
      ...todo,
      completed: !todo.completed,
      completedAt: !todo.completed ? new Date() : null,
      updatedAt: new Date(),
    }

    dispatch({ type: 'TOGGLE_COMPLETE', todo: updatedTodo })
    await storageAdapter.update(updatedTodo)
  }, [state.todos])

  const deleteTodo = useCallback(async (id: string) => {
    dispatch({ type: 'DELETE', id })
    await storageAdapter.remove(id)
  }, [])

  const undoDelete = useCallback(async () => {
    if (state.deletedStack.length === 0) {
      return
    }

    const { item } = state.deletedStack[0]
    await storageAdapter.add(item)
    dispatch({ type: 'UNDO_DELETE' })
  }, [state.deletedStack])

  const dismissDelete = useCallback(() => {
    if (state.deletedStack.length === 0) {
      return
    }

    dispatch({ type: 'DISMISS_DELETE' })
  }, [state.deletedStack])

  const updateTask = useCallback(async (id: string, task: string) => {
    const todo = state.todos.find((item) => item.id === id)
    if (!todo) {
      return
    }

    const { project, task: parsedTask } = parseProject(task)
    const updatedTodo: Todo = {
      ...todo,
      task: parsedTask,
      project,
      updatedAt: new Date(),
    }

    dispatch({ type: 'UPDATE_TASK', todo: updatedTodo })
    await storageAdapter.update(updatedTodo)
  }, [state.todos])

  const reorder = useCallback(async (activeId: string, overId: string) => {
    const normalizedTodos = reorderTodos(state.todos, activeId, overId)

    dispatch({ type: 'REORDER', todos: normalizedTodos })
    await storageAdapter.bulkUpdate(normalizedTodos)
  }, [state.todos])

  const clearCompleted = useCallback(async () => {
    const completedIds = state.todos.filter((todo) => todo.completed).map((todo) => todo.id)
    dispatch({ type: 'CLEAR_COMPLETED' })
    await Promise.all(completedIds.map((id) => storageAdapter.remove(id)))
  }, [state.todos])

  return {
    todos: state.todos,
    deletedStack: state.deletedStack,
    addTodo,
    toggleComplete,
    deleteTodo,
    undoDelete,
    dismissDelete,
    updateTask,
    reorder,
    clearCompleted,
  }
}
