import { useEffect, useCallback, useReducer } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import type { DeletedItem, Todo, TodoAction, TodoState } from '../types/todo'
import { storageAdapter } from '../db/database'

const parseProject = (input: string): { project: string | null; task: string } => {
  const match = input.match(/^\s*([^:]+?)\s*:\s*(.+)$/)

  if (!match) {
    return { project: null, task: input }
  }

  return {
    project: match[1].trim(),
    task: match[2].trim(),
  }
}

const initialState: TodoState = {
  todos: [],
  deletedStack: [],
}

const todoReducer = (state: TodoState, action: TodoAction): TodoState => {
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
      const deletedStack: DeletedItem[] = [{ item, index }, ...state.deletedStack]

      return {
        todos,
        deletedStack,
      }
    }

    case 'UNDO_DELETE': {
      if (state.deletedStack.length === 0) {
        return state
      }

      const [restored, ...rest] = state.deletedStack
      const todos = [...state.todos]
      const insertIndex = Math.min(Math.max(restored.index, 0), todos.length)
      todos.splice(insertIndex, 0, restored.item)

      const normalizedTodos = todos.map((todo, idx) => ({
        ...todo,
        order: idx,
      }))

      return {
        todos: normalizedTodos,
        deletedStack: rest,
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
    const { project, task: parsedTask } = parseProject(task)
    const newTodo: Todo = {
      id: crypto.randomUUID(),
      task: parsedTask,
      project,
      completed: false,
      order: state.todos.length,
      createdAt: new Date(),
      updatedAt: new Date(),
      completedAt: null,
    }

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
    const sortedTodos = [...state.todos].sort((a, b) => a.order - b.order)
    const activeIndex = sortedTodos.findIndex((todo) => todo.id === activeId)
    const overIndex = sortedTodos.findIndex((todo) => todo.id === overId)

    if (activeIndex === -1 || overIndex === -1) {
      return
    }

    const movedTodos = arrayMove(sortedTodos, activeIndex, overIndex)
    const normalizedTodos = movedTodos.map((todo, idx) => ({
      ...todo,
      order: idx,
    }))

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
    updateTask,
    reorder,
    clearCompleted,
  }
}
