import { useState } from 'react'
import type { ProjectFilter } from '../../types/todo'
import { useTodos } from '../../hooks/useTodos'
import styles from './TodoApp.module.css'
import { TodoInput } from '../TodoInput/TodoInput.tsx'
import { TodoList } from '../TodoList/TodoList'
import { UndoToast } from '../UndoToast/UndoToast'
import { ProjectFilter as ProjectFilterComponent } from '../ProjectFilter/ProjectFilter.tsx'

type Tab = 'todo' | 'report'

export const TodoApp = () => {
  const [activeTab, setActiveTab] = useState<Tab>('todo')
  const [selectedFilter, setSelectedFilter] = useState<ProjectFilter>('all')
  const {
    todos,
    deletedStack,
    addTodo,
    toggleComplete,
    deleteTodo,
    undoDelete,
    dismissDelete,
    updateTask,
    clearCompleted,
  } = useTodos()

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
            <ProjectFilterComponent
              todos={todos}
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
            <TodoList
              todos={todos}
              selectedFilter={selectedFilter}
              onToggleComplete={toggleComplete}
              onDelete={deleteTodo}
              onUpdateTask={updateTask}
              onClearCompleted={clearCompleted}
            />
            <UndoToast deletedStack={deletedStack} onUndo={undoDelete} onClose={dismissDelete} />
          </>
        )}
        {activeTab === 'report' && <p>WeeklyReport here</p>}
      </main>
    </div>
  )
}
