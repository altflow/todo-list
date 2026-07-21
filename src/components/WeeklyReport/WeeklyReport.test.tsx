import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Todo } from '../../types/todo'
import type { TimeSession } from '../../db/database'
import { WeeklyReport } from './WeeklyReport'

const mockUseWeeklyReport = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../../hooks/useWeeklyReport', () => ({
  useWeeklyReport: () => mockUseWeeklyReport(),
}))

const makeTodo = (overrides: Partial<Todo> = {}): Todo => ({
  id: overrides.id ?? 'todo-1',
  task: overrides.task ?? 'Task 1',
  completed: true,
  project: overrides.project ?? 'Project A',
  order: 1,
  createdAt: new Date(2024, 0, 1),
  updatedAt: new Date(2024, 0, 1),
  completedAt: new Date(2024, 0, 5),
  note: overrides.note,
})

const makeSession = (overrides: Partial<TimeSession> = {}): TimeSession => ({
  id: 1,
  taskId: overrides.taskId ?? 'todo-1',
  startedAt: overrides.startedAt ?? new Date(2024, 0, 5, 10, 0),
  endedAt: overrides.endedAt ?? new Date(2024, 0, 5, 10, 30),
  note: overrides.note,
  createdAt: new Date(2024, 0, 5, 10, 0),
})

describe('WeeklyReport', () => {
  beforeEach(() => {
    mockUseWeeklyReport.mockReset()
  })

  it('shows session details when a task row is clicked and hides them when clicked again', () => {
    mockUseWeeklyReport.mockReturnValue({
      weekLabel: 'Week',
      weeklyReport: [
        {
          project: 'Project A',
          totalMinutes: 30,
          tasks: [
            {
              todo: makeTodo({ id: 'todo-1', task: 'Task with session' }),
              completedAt: new Date(2024, 0, 5),
              totalMinutes: 30,
            },
            {
              todo: makeTodo({ id: 'todo-2', task: 'Task without session' }),
              completedAt: new Date(2024, 0, 6),
              totalMinutes: 0,
            },
          ],
        },
      ],
      prevWeek: vi.fn(),
      nextWeek: vi.fn(),
      weekSessions: [makeSession({ taskId: 'todo-1', note: 'Follow up' })],
    })

    render(<WeeklyReport />)

    expect(screen.queryByText('01/05 10:00 → 01/05 10:30')).not.toBeInTheDocument()

    fireEvent.click(screen.getByText('Task with session'))
    expect(screen.getByText('01/05 10:00 → 01/05 10:30')).toBeInTheDocument()
    expect(screen.getByText('Follow up')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Task with session'))
    expect(screen.queryByText('01/05 10:00 → 01/05 10:30')).not.toBeInTheDocument()
  })
})
