import Dexie, { type Table } from 'dexie'
import type { Todo, StorageAdapter } from '../types/todo'

export interface TimeSession {
  id?: number
  taskId: string | number
  startedAt: Date
  endedAt: Date
  note?: string
  createdAt: Date
  updatedAt: Date
}

class TodoDatabase extends Dexie {
  tasks!: Table<Todo>
  todos!: Table<Todo>
  timeSessions!: Table<TimeSession>

  constructor() {
    super('TodoDB')

    this.version(3)
      .stores({
        tasks: '++id, project, completed, completedAt, order, updatedAt',
        timeSessions: '++id, taskId, startedAt, updatedAt',
      })
      .upgrade(async (tx) => {
        const now = new Date()

        await tx.table('tasks').toCollection().modify((task: Todo & { updatedAt?: Date }) => {
          task.updatedAt = task.updatedAt ?? now
        })

        await tx.table('timeSessions').toCollection().modify((session: TimeSession & { updatedAt?: Date }) => {
          session.updatedAt = session.updatedAt ?? now
        })
      })

    this.tasks = this.table('tasks')
    this.todos = this.table('tasks')
    this.timeSessions = this.table('timeSessions')
  }
}

export const db = new TodoDatabase()

class DexieStorageAdapter implements StorageAdapter {
  async getAll(): Promise<Todo[]> {
    return await db.tasks.orderBy('order').toArray()
  }

  async getCompletedByDateRange(start: Date, end: Date): Promise<Todo[]> {
    return await db.tasks.where('completedAt').between(start, end, true, true).toArray()
  }

  async add(todo: Todo): Promise<void> {
    await db.tasks.add({ ...todo, updatedAt: todo.updatedAt ?? new Date() })
  }

  async update(todo: Todo): Promise<void> {
    await db.tasks.put({ ...todo, updatedAt: todo.updatedAt ?? new Date() })
  }

  async remove(id: string): Promise<void> {
    await db.tasks.delete(id)
  }

  async bulkUpdate(todos: Todo[]): Promise<void> {
    await db.transaction('rw', db.tasks, async () => {
      await db.tasks.bulkPut(todos.map((todo) => ({ ...todo, updatedAt: todo.updatedAt ?? new Date() })))
    })
  }
}

export const storageAdapter = new DexieStorageAdapter()
