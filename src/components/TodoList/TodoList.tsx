import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useTranslation } from 'react-i18next'
import type { ProjectFilter, Todo } from '../../types/todo'
import { TodoItem } from '../TodoItem/TodoItem'
import styles from './TodoList.module.css'

interface TodoListProps {
  todos: Todo[]
  selectedFilter: ProjectFilter
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTask: (id: string, task: string) => void
  onReorder: (activeId: string, overId: string) => void
  onClearCompleted: () => void
}

export function TodoList({
  todos,
  selectedFilter,
  onToggleComplete,
  onDelete,
  onUpdateTask,
  onReorder,
  onClearCompleted,
}: TodoListProps) {
  const { t } = useTranslation()
  const filterBySelectedFilter = (todo: Todo) => {
    if (selectedFilter === 'all') {
      return true
    }
    if (selectedFilter === 'general') {
      return todo.project === null
    }
    return todo.project === selectedFilter
  }

  const incompleteTodos = [...todos]
    .filter((todo) => !todo.completed && filterBySelectedFilter(todo))
    .sort((a, b) => a.order - b.order)

  const completedTodos = [...todos]
    .filter(
      (todo) =>
        todo.completed &&
        todo.completedAt !== null &&
        Date.now() - todo.completedAt.getTime() <= 24 * 60 * 60 * 1000 &&
        filterBySelectedFilter(todo),
    )
    .sort((a, b) => {
      const aTime = a.completedAt?.getTime() ?? 0
      const bTime = b.completedAt?.getTime() ?? 0
      return bTime - aTime
    })

  const handleDragEnd = (event: DragEndEvent) => {
    const activeId = event.active.id as string
    const overId = event.over?.id as string

    if (!overId || activeId === overId) {
      return
    }

    onReorder(activeId, overId)
  }

  return (
    <div className={styles.container}>
      <section className={styles.section}>
        <h2 className={styles.heading}>{t('todoList.todoHeading')}</h2>
        {incompleteTodos.length === 0 ? (
          <p className={styles.emptyText}>{t('todoList.emptyTodo')}</p>
        ) : (
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={incompleteTodos.map((todo) => todo.id)}
              strategy={verticalListSortingStrategy}
            >
              {incompleteTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggleComplete={onToggleComplete}
                  onDelete={onDelete}
                  onUpdateTask={onUpdateTask}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </section>

      <section className={styles.section}>
        <h2 className={styles.heading}>{t('todoList.completedHeading')}</h2>
        {completedTodos.length === 0 ? (
          <p className={styles.emptyText}>{t('todoList.emptyCompleted')}</p>
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
            {t('todoList.clearCompleted')}
          </button>
        )}
      </section>
    </div>
  )
}
