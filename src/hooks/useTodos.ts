import { useReducer } from 'react'
import { arrayMove } from '@dnd-kit/sortable'
import type { DeletedItem, Todo, TodoAction, TodoState } from '../types/todo'

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
      const { project, task } = parseProject(action.task)
      const newTodo: Todo = {
        id: crypto.randomUUID(),
        task,
        project,
        completed: false,
        order: state.todos.length,
        createdAt: new Date(),
        updatedAt: new Date(),
        completedAt: null,
      }

      return {
        todos: [...state.todos, newTodo],
        deletedStack: [],
      }
    }

    case 'TOGGLE_COMPLETE': {
      const todos = state.todos.map((todo) => {
        if (todo.id !== action.id) {
          return todo
        }

        const completed = !todo.completed
        return {
          ...todo,
          completed,
          completedAt: completed ? new Date() : null,
          updatedAt: new Date(),
        }
      })

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
      const { project, task } = parseProject(action.task)
      const todos = state.todos.map((todo) => {
        if (todo.id !== action.id) {
          return todo
        }

        return {
          ...todo,
          project,
          task,
          updatedAt: new Date(),
        }
      })

      return {
        ...state,
        todos,
      }
    }

    case 'REORDER': {
      const sortedTodos = [...state.todos].sort((a, b) => a.order - b.order)
      const activeIndex = sortedTodos.findIndex((todo) => todo.id === action.activeId)
      const overIndex = sortedTodos.findIndex((todo) => todo.id === action.overId)

      if (activeIndex === -1 || overIndex === -1) {
        return state
      }

      const movedTodos = arrayMove(sortedTodos, activeIndex, overIndex)
      const normalizedTodos = movedTodos.map((todo, idx) => ({
        ...todo,
        order: idx,
      }))

      return {
        ...state,
        todos: normalizedTodos,
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

  const addTodo = (task: string) => {
    dispatch({ type: 'ADD', task })
  }

  const toggleComplete = (id: string) => {
    dispatch({ type: 'TOGGLE_COMPLETE', id })
  }

  const deleteTodo = (id: string) => {
    dispatch({ type: 'DELETE', id })
  }

  const undoDelete = () => {
    dispatch({ type: 'UNDO_DELETE' })
  }

  const updateTask = (id: string, task: string) => {
    dispatch({ type: 'UPDATE_TASK', id, task })
  }

  const reorder = (activeId: string, overId: string) => {
    dispatch({ type: 'REORDER', activeId, overId })
  }

  const clearCompleted = () => {
    dispatch({ type: 'CLEAR_COMPLETED' })
  }

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
