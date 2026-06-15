import { useEffect, useRef, useState } from 'react'
import type { ProjectFilter } from '../../types/todo'
import { useTranslation } from 'react-i18next'
import { useTodos } from '../../hooks/useTodos'
import styles from './TodoApp.module.css'
import { TodoInput } from '../TodoInput/TodoInput.tsx'
import { TodoList } from '../TodoList/TodoList'
import { UndoToast } from '../UndoToast/UndoToast'
import { ProjectFilter as ProjectFilterComponent } from '../ProjectFilter/ProjectFilter.tsx'
import { WeeklyReport } from '../WeeklyReport/WeeklyReport'
import { Settings } from '../Settings/Settings'

type Tab = 'todo' | 'report' | 'settings'

const languages = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
]

export const TodoApp = () => {
  const [activeTab, setActiveTab] = useState<Tab>('todo')
  const [selectedFilter, setSelectedFilter] = useState<ProjectFilter>('all')
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement | null>(null)
  const { t, i18n } = useTranslation()
  const {
    todos,
    deletedStack,
    addTodo,
    toggleComplete,
    deleteTodo,
    undoDelete,
    dismissDelete,
    updateTask,
    reorder,
    clearCompleted,
  } = useTodos()

  useEffect(() => {
    if (!isLangMenuOpen) {
      return undefined
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLangMenuOpen])

  const handleLanguageSelect = (code: string) => {
    i18n.changeLanguage(code)
    setIsLangMenuOpen(false)
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>{t('app.title')}</h1>
        <nav className={styles.nav}>
          <button type="button" onClick={() => setActiveTab('todo')}>
            {t('tabs.todo')}
          </button>
          <button type="button" onClick={() => setActiveTab('report')}>
            {t('tabs.report')}
          </button>
          <button type="button" onClick={() => setActiveTab('settings')}>
            {t('settings.title')}
          </button>
          <div className={styles.languageMenu} ref={langMenuRef}>
            <button
              type="button"
              className={styles.languageTrigger}
              onClick={() => setIsLangMenuOpen((prev) => !prev)}
            >
              Language
            </button>
            {isLangMenuOpen && (
              <div className={styles.languageDropdown}>
                {languages.map((language) => (
                  <button
                    key={language.code}
                    type="button"
                    className={styles.languageOption}
                    onClick={() => handleLanguageSelect(language.code)}
                  >
                    {i18n.language === language.code ? '✓ ' : ''}
                    {language.label}
                  </button>
                ))}
              </div>
            )}
          </div>
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
              onReorder={reorder}
              onClearCompleted={clearCompleted}
            />
            <UndoToast deletedStack={deletedStack} onUndo={undoDelete} onClose={dismissDelete} />
          </>
        )}
        {activeTab === 'report' && <WeeklyReport todos={todos} />}
        {activeTab === 'settings' && <Settings onClearAllCompleted={clearCompleted} />}
      </main>
    </div>
  )
}
