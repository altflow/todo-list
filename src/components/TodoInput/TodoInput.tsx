import { useState } from 'react'
import type { ChangeEvent, SubmitEvent } from 'react'
import { useTranslation } from 'react-i18next'
import styles from './TodoInput.module.css'

interface TodoInputProps {
  onAdd: (task: string) => void
}

export const TodoInput = ({ onAdd }: TodoInputProps) => {
  const { t } = useTranslation()
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
        placeholder={t('todoInput.placeholder')}
      />
      <button className={styles.button} type="submit">
        {t('todoInput.addButton')}
      </button>
    </form>
  )
}
