import type { Todo } from '../../types/todo'
import { TodoItem } from '../TodoItem/TodoItem'
import styles from './TodoList.module.css'

interface TodoListProps {
  todos: Todo[]
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTask: (id: string, task: string) => void
  onClearCompleted: () => void
}

export function TodoList({
  todos,
  onToggleComplete,
  onDelete,
  onUpdateTask,
  onClearCompleted,
}: TodoListProps) {
  const incompleteTodos = [...todos]
    .filter((todo) => !todo.completed)
    .sort((a, b) => a.order - b.order)

  const completedTodos = [...todos]
    .filter((todo) => todo.completed)
    .sort((a, b) => {
      const aTime = a.completedAt?.getTime() ?? 0
      const bTime = b.completedAt?.getTime() ?? 0
      return bTime - aTime
    })

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.heading}>ToDo</h2>
        {incompleteTodos.length === 0 ? (
          <p className={styles.emptyText}>タスクはありません</p>
        ) : (
          incompleteTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onUpdateTask={onUpdateTask}
            />
          ))
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>完了済み</h2>
        {completedTodos.length === 0 ? (
          <p className={styles.emptyText}>完了済みのタスクはありません</p>
        ) : (
          completedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggleComplete={onToggleComplete}
              onDelete={onDelete}
              onUpdateTask={onUpdateTask}
            />
          ))
        )}
        {completedTodos.length > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClearCompleted}
          >
            完了済みを削除
          </button>
        )}
      </section>
    </div>
  )
}
