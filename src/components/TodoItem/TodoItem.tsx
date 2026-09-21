import { useState, type KeyboardEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useTranslation } from 'react-i18next'
import type { Todo } from '../../types/todo'
import { useTimeSessions, formatDuration } from '../../hooks/useTimeSessions'
import { TaskItemActions } from '../TaskItemActions/TaskItemActions'
import styles from './TodoItem.module.css'

interface TodoItemProps {
  todo: Todo
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTask: (id: string, task: string) => void
  onOpenTimeSession: (id: string) => void
  syncVersion: number
}

function DraggableTodoItem({
  todo,
  onToggleComplete,
  onDelete,
  onEdit,
  onOpenTimeSession,
  displayTask,
  syncVersion,
}: TodoItemProps & { displayTask: string; onEdit: () => void }) {
  const { totalMinutes } = useTimeSessions(todo.id, syncVersion)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} className={styles.todoItem} style={style}>
      <button
        type="button"
        className={styles.dragHandle}
        {...attributes}
        {...listeners}
      >
        ⠿
      </button>
      <label className={styles.checkboxTarget}>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggleComplete(todo.id)}
          className={styles.checkbox}
        />
      </label>
      <span className={todo.completed ? styles.completedTask : styles.task}>
        {displayTask}
      </span>
      {totalMinutes > 0 ? (
        <span className={styles.timeBadge}>{formatDuration(totalMinutes)}</span>
      ) : null}
      <TaskItemActions
        onEdit={onEdit}
        onDelete={() => onDelete(todo.id)}
        onOpenTimeSession={() => onOpenTimeSession(todo.id)}
      />
    </div>
  )
}

export function TodoItem({
  todo,
  onToggleComplete,
  onDelete,
  onUpdateTask,
  onOpenTimeSession,
  syncVersion,
}: TodoItemProps) {
  const { t } = useTranslation()
  const { totalMinutes } = useTimeSessions(todo.id, syncVersion)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(
    todo.project ? `${todo.project}: ${todo.task}` : todo.task
  )

  const displayTask = todo.project
    ? `${todo.project}: ${todo.task}`
    : todo.task

  const handleSave = () => {
    if (editValue.trim() === '') return
    onUpdateTask(todo.id, editValue.trim())
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleEdit = () => {
    setEditValue(
      todo.project ? `${todo.project}: ${todo.task}` : todo.task
    )
    setIsEditing(true)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  if (isEditing) {
    return (
      <div className={styles.todoItem}>
        <input
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={styles.editInput}
          autoFocus
        />
        <button onClick={handleSave} className={styles.saveBtn}>
          {t('todoItem.saveButton')}
        </button>
        <button onClick={handleCancel} className={styles.cancelBtn}>
          {t('todoItem.cancelButton')}
        </button>
      </div>
    )
  }

  if (todo.completed) {
    return (
      <div className={styles.todoItem}>
        <label className={styles.checkboxTarget}>
          <input
            type="checkbox"
            checked={todo.completed}
            onChange={() => onToggleComplete(todo.id)}
            className={styles.checkbox}
          />
        </label>
        <span className={styles.completedTask}>{displayTask}</span>
        {totalMinutes > 0 ? (
          <span className={styles.timeBadge}>{formatDuration(totalMinutes)}</span>
        ) : null}
        <TaskItemActions
          onEdit={handleEdit}
          onDelete={() => onDelete(todo.id)}
          onOpenTimeSession={() => onOpenTimeSession(todo.id)}
        />
      </div>
    )
  }

  return (
    <DraggableTodoItem
      todo={todo}
      onToggleComplete={onToggleComplete}
      onDelete={onDelete}
      onEdit={handleEdit}
      onUpdateTask={onUpdateTask}
      onOpenTimeSession={onOpenTimeSession}
      displayTask={displayTask}
      syncVersion={syncVersion}
    />
  )
}
