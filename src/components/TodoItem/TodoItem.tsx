import { useState } from 'react'
import type { Todo } from '../../types/todo'
import styles from './TodoItem.module.css'

interface TodoItemProps {
  todo: Todo
  onToggleComplete: (id: string) => void
  onDelete: (id: string) => void
  onUpdateTask: (id: string, task: string) => void
}

export function TodoItem({
  todo,
  onToggleComplete,
  onDelete,
  onUpdateTask,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(todo.task)

  const handleSave = () => {
    if (editValue.trim() === '') return
    onUpdateTask(todo.id, editValue.trim())
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  return (
    <div className={styles.todoItem}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggleComplete(todo.id)}
        className={styles.checkbox}
      />
      <span
        className={
          todo.completed ? styles.completedTask : styles.task
        }
      >
        {todo.task}
      </span>
      <button
        onClick={() => setIsEditing(true)}
        className={styles.editBtn}
      >
        編集
      </button>
      <button onClick={() => onDelete(todo.id)} className={styles.deleteBtn}>
        削除
      </button>
    </div>
  )
}
