import { arrayMove } from '@dnd-kit/sortable'
import type { Todo } from '../types/todo'

export function parseProject(input: string): { project: string | null; task: string } {
  const trimmedInput = input.trim()

  if (/^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmedInput)) {
    return { project: null, task: input }
  }

  const match = trimmedInput.match(/^([^:]+?)\s*:\s*(.+)$/)

  if (!match) {
    return { project: null, task: input }
  }

  return {
    project: match[1].trim(),
    task: match[2].trim(),
  }
}

export function createTodo(task: string, order: number): Todo {
  const { project, task: parsedTask } = parseProject(task)

  return {
    id: crypto.randomUUID(),
    task: parsedTask,
    project,
    completed: false,
    order,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
  }
}

export function reorderTodos(todos: Todo[], activeId: string, overId: string): Todo[] {
  const sortedTodos = [...todos].sort((a, b) => a.order - b.order)
  const activeIndex = sortedTodos.findIndex((todo) => todo.id === activeId)
  const overIndex = sortedTodos.findIndex((todo) => todo.id === overId)

  if (activeIndex === -1 || overIndex === -1) {
    return todos
  }

  const movedTodos = arrayMove(sortedTodos, activeIndex, overIndex)

  return movedTodos.map((todo, idx) => ({
    ...todo,
    order: idx,
  }))
}
