import { useState } from 'react'
import { useTodos } from '../../hooks/useTodos'
import styles from './TodoApp.module.css'
import { TodoInput } from '../TodoInput/TodoInput.tsx'
import { TodoList } from '../TodoList/TodoList'

type Tab = 'todo' | 'report'

export const TodoApp = () => {
  const [activeTab, setActiveTab] = useState<Tab>('todo')
  const { todos, addTodo, toggleComplete, deleteTodo, updateTask, clearCompleted } = useTodos()

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
            <TodoList
              todos={todos}
              onToggleComplete={toggleComplete}
              onDelete={deleteTodo}
              onUpdateTask={updateTask}
              onClearCompleted={clearCompleted}
            />
            <p>UndoToast here</p>
          </>
        )}
        {activeTab === 'report' && <p>WeeklyReport here</p>}
      </main>
    </div>
  )
}
