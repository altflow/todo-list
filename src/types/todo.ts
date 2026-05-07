export type Todo = {
  id: string
  task: string
  completed: boolean
  project: string | null
  order: number
  createdAt: Date
  updatedAt: Date
  completedAt: Date | null
}

export type DeletedItem = {
  item: Todo
  index: number
}

export type TodoAction =
  | { type: 'ADD'; task: string }
  | { type: 'TOGGLE_COMPLETE'; id: string }
  | { type: 'DELETE'; id: string }
  | { type: 'UNDO_DELETE' }
  | { type: 'UPDATE_TASK'; id: string; task: string }
  | { type: 'REORDER'; activeId: string; overId: string }
  | { type: 'CLEAR_COMPLETED' }

export type TodoState = {
  todos: Todo[]
  deletedStack: DeletedItem[]
}

export interface StorageAdapter {
  getAll(): Promise<Todo[]>
  add(todo: Todo): Promise<void>
  update(todo: Todo): Promise<void>
  remove(id: string): Promise<void>
  bulkUpdate(todos: Todo[]): Promise<void>
}
