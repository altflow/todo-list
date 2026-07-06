export type Todo = {
  id: string
  task: string
  completed: boolean
  project: string | null
  order: number
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
  note?: string
}

// 'all' | 'general' | 'project-name' (dynamically added)
export type ProjectFilter = 'all' | 'general' | string

export type DeletedItem = {
  item: Todo
  index: number
}

export type TodoAction =
  | { type: 'ADD'; todo: Todo }
  | { type: 'LOAD'; todos: Todo[] }
  | { type: 'TOGGLE_COMPLETE'; todo: Todo }
  | { type: 'DELETE'; id: string }
  | { type: 'UNDO_DELETE' }
  | { type: 'DISMISS_DELETE' }
  | { type: 'UPDATE_TASK'; todo: Todo }
  | { type: 'REORDER'; todos: Todo[] }
  | { type: 'CLEAR_COMPLETED' }

export type TodoState = {
  todos: Todo[]
  deletedStack: DeletedItem[]
}

export interface StorageAdapter {
  getAll(): Promise<Todo[]>
  getCompletedByDateRange(start: Date, end: Date): Promise<Todo[]>
  add(todo: Todo): Promise<void>
  update(todo: Todo): Promise<void>
  remove(id: string): Promise<void>
  bulkUpdate(todos: Todo[]): Promise<void>
}
