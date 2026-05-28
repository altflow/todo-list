import { useState } from 'react'
import { useTodos } from '../../hooks/useTodos'
import styles from './TodoApp.module.css'
import { TodoInput } from '../TodoInput/TodoInput.tsx'

type Tab = 'todo' | 'report'

export const TodoApp = () => {
  const [activeTab, setActiveTab] = useState<Tab>('todo')
  const { addTodo } = useTodos()

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>ToDo List</h1>
        <nav className={styles.nav}>
          <button type="button" onClick={() => setActiveTab('todo')}>
            ToDo
          </button>
          <button type="button" onClick={() => setActiveTab('report')}>
            Report
          </button>
        </nav>
      </header>
      <main className={styles.main}>
        {activeTab === 'todo' && (
          <>
            <TodoInput onAdd={addTodo} />
            <p>TodoList here</p>
            <p>UndoToast here</p>
          </>
        )}
        {activeTab === 'report' && <p>WeeklyReport here</p>}
      </main>
    </div>
  )
}
