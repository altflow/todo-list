import type { TimeSession } from '../db/database'
import type { Todo } from '../types/todo'

export type Task = Todo

export interface ExportData {
  version: number
  exportedAt: string
  deviceId: string
  data: {
    tasks: Task[]
    timeSessions: TimeSession[]
  }
}

export interface SyncProvider {
  name: string
  login(onSuccess?: () => void): Promise<void>
  logout(): Promise<void>
  upload(data: ExportData): Promise<void>
  download(): Promise<ExportData | null>
  isAuthenticated(): boolean
}
