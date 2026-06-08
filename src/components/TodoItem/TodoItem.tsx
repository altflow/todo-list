import { useState, type KeyboardEvent } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Todo } from '../../types/todo'
import styles from './TodoItem.module.css'

interface TodoItemProps {
  todo: Todo
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTask: (id: string, task: string) => void
}

function DraggableTodoItem({
  todo,
  onToggleComplete,
  onDelete,
  onEdit,
  displayTask,
}: TodoItemProps & { displayTask: string; onEdit: () => void }) {
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
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id)}
        className={styles.checkbox}
      />
      <span className={todo.completed ? styles.completedTask : styles.task}>
        {displayTask}
      </span>
      <button onClick={onEdit} className={styles.editBtn}>
        編集
      </button>
      <button onClick={() => onDelete(todo.id)} className={styles.deleteBtn}>
        削除
      </button>
    </div>
  )
}

export function TodoItem({
  todo,
  onToggleComplete,
  onDelete,
  onUpdateTask,
}: TodoItemProps) {
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
          保存
        </button>
        <button onClick={handleCancel} className={styles.cancelBtn}>
          キャンセル
        </button>
      </div>
    )
  }

  if (todo.completed) {
    return (
      <div className={styles.todoItem}>
        <input
          type="checkbox"
          checked={todo.completed}
          onChange={() => onToggleComplete(todo.id)}
          className={styles.checkbox}
        />
        <span className={styles.completedTask}>{displayTask}</span>
        <button onClick={handleEdit} className={styles.editBtn}>
          編集
        </button>
        <button onClick={() => onDelete(todo.id)} className={styles.deleteBtn}>
          削除
        </button>
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
      displayTask={displayTask}
    />
  )
}
