import Dexie, { type Table } from 'dexie'
import type { Todo, StorageAdapter } from '../types/todo'

export interface TimeSession {
  id?: number
  taskId: string | number
  startedAt: Date
  endedAt: Date
  note?: string
  createdAt: Date
}

class TodoDatabase extends Dexie {
  todos!: Table<Todo>
  timeSessions!: Table<TimeSession>

  constructor() {
    super('TodoDB')
    this.version(2).stores({
      todos: '++id, project, completed, completedAt, order',
      timeSessions: '++id, taskId, startedAt',
    })
  }

  get tasks(): Table<Todo> {
    return this.todos
  }
}

export const db = new TodoDatabase()

class DexieStorageAdapter implements StorageAdapter {
  async getAll(): Promise<Todo[]> {
    return await db.todos.orderBy('order').toArray()
  }

  async getCompletedByDateRange(start: Date, end: Date): Promise<Todo[]> {
    return await db.todos.where('completedAt').between(start, end, true, true).toArray()
  }

  async add(todo: Todo): Promise<void> {
    await db.todos.add(todo)
  }

  async update(todo: Todo): Promise<void> {
    await db.todos.put(todo)
  }

  async remove(id: string): Promise<void> {
    await db.todos.delete(id)
  }

  async bulkUpdate(todos: Todo[]): Promise<void> {
    await db.transaction('rw', db.todos, async () => {
      await db.todos.bulkPut(todos)
    })
  }
}

export const storageAdapter = new DexieStorageAdapter()
