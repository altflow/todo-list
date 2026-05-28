import { useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'
import styles from './TodoInput.module.css'

interface TodoInputProps {
  onAdd: (task: string) => void
}

export const TodoInput = ({ onAdd }: TodoInputProps) => {
  const [value, setValue] = useState('')

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmed = value.trim()
    if (trimmed === '') {
      return
    }

    onAdd(trimmed)
    setValue('')
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setValue(event.target.value)
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        type="text"
        value={value}
        onChange={handleChange}
        placeholder="タスクを入力（例: ProjectName: タスク内容）"
      />
      <button className={styles.button} type="submit">
        追加
      </button>
    </form>
  )
}
