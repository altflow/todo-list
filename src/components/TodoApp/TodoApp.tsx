import { useEffect, useRef, useState } from 'react'
import type { ProjectFilter } from '../../types/todo'
import { useTranslation } from 'react-i18next'
import { useTodos } from '../../hooks/useTodos'
import { useTheme, type Theme } from '../../hooks/useTheme'
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
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false)
  const langMenuRef = useRef<HTMLDivElement | null>(null)
  const themeMenuRef = useRef<HTMLDivElement | null>(null)
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
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
    if (!isLangMenuOpen && !isThemeMenuOpen) {
      return undefined
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setIsLangMenuOpen(false)
      }

      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setIsThemeMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isLangMenuOpen, isThemeMenuOpen])

  const handleLanguageSelect = (code: string) => {
    i18n.changeLanguage(code)
    setIsLangMenuOpen(false)
  }

  const handleThemeSelect = (selectedTheme: Theme) => {
    setTheme(selectedTheme)
    setIsThemeMenuOpen(false)
  }

  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <h1>{t('app.title')}</h1>
        <nav className={styles.nav}>
          <button
            type="button"
            onClick={() => setActiveTab('todo')}
            className={activeTab === 'todo' ? styles.active : undefined}
          >
            {t('tabs.todo')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={activeTab === 'report' ? styles.active : undefined}
          >
            {t('tabs.report')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={activeTab === 'settings' ? styles.active : undefined}
          >
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
          <div className={styles.themeMenu} ref={themeMenuRef}>
            <button
              type="button"
              className={styles.themeTrigger}
              onClick={() => setIsThemeMenuOpen((prev) => !prev)}
            >
              Theme
            </button>
            {isThemeMenuOpen && (
              <div className={styles.themeDropdown}>
                {(['light', 'dark', 'auto'] as Theme[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={styles.themeOption}
                    onClick={() => handleThemeSelect(option)}
                  >
                    {theme === option ? '✓ ' : ''}
                    {option === 'light' ? 'Light' : option === 'dark' ? 'Dark' : 'Auto'}
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
        {activeTab === 'report' && <WeeklyReport />}
        {activeTab === 'settings' && <Settings onClearAllCompleted={clearCompleted} />}
      </main>
    </div>
  )
}
