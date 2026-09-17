import { useEffect, useRef, useState, useMemo } from 'react'
import type { ProjectFilter } from '../../types/todo'
import { useTranslation } from 'react-i18next'
import { useTodos } from '../../hooks/useTodos'
import { useTheme } from '../../hooks/useTheme'
import { GoogleDriveProvider } from '../../sync/providers/GoogleDriveProvider'
import { syncToDrive, syncFromDrive } from '../../sync/syncManager'
import debounce from 'lodash/debounce'
import styles from './TodoApp.module.css'
import { TodoInput } from '../TodoInput/TodoInput.tsx'
import { TodoList } from '../TodoList/TodoList'
import { UndoToast } from '../UndoToast/UndoToast'
import { ProjectFilter as ProjectFilterComponent } from '../ProjectFilter/ProjectFilter.tsx'
import { WeeklyReport } from '../WeeklyReport/WeeklyReport'
import { Settings } from '../Settings/Settings'
import { TimeSessionModal } from '../TimeSessionModal/TimeSessionModal'

type Tab = 'todo' | 'report' | 'settings'

const languages = [
  { code: 'ja', label: '日本語' },
  { code: 'en', label: 'English' },
]

export const TodoApp = () => {
  const [activeTab, setActiveTab] = useState<Tab>('todo')
  const [selectedFilter, setSelectedFilter] = useState<ProjectFilter>('all')
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false)
  const [syncVersion, setSyncVersion] = useState(0)
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null)
  const langMenuRef = useRef<HTMLDivElement | null>(null)
  const { t, i18n } = useTranslation()
  useTheme()
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
  } = useTodos(syncVersion)

  useEffect(() => {
    const handleSyncCompleted = () => {
      setSyncVersion((value) => value + 1)
    }

    window.addEventListener('sync-completed', handleSyncCompleted)
    return () => {
      window.removeEventListener('sync-completed', handleSyncCompleted)
    }
  }, [])

  useEffect(() => {
    const syncOnStartup = async () => {
      const syncEnabled = localStorage.getItem('sync_enabled') === 'true'
      if (!syncEnabled) return

      const provider = new GoogleDriveProvider()
      if (!provider.isAuthenticated()) return

      try {
        await syncFromDrive(provider)
        const now = new Date().toLocaleString()
        localStorage.setItem('sync_last_synced', now)
      } catch (e) {
        // 起動時の同期エラーはログに出すのみ
        // eslint-disable-next-line no-console
        console.error('起動時の同期に失敗しました', e)
      }
    }

    void syncOnStartup()
  }, [])

  const debouncedSyncToDrive = useMemo(
    () =>
      debounce(async () => {
        const syncEnabled = localStorage.getItem('sync_enabled') === 'true'
        if (!syncEnabled) return

        const provider = new GoogleDriveProvider()
        if (!provider.isAuthenticated()) return

        try {
          await syncToDrive(provider)
          const now = new Date().toLocaleString()
          localStorage.setItem('sync_last_synced', now)
        } catch (e) {
          // 同期エラーはログに出すのみ
          // eslint-disable-next-line no-console
          console.error('同期に失敗しました', e)
        }
      }, 3000),
    [],
  )

  const handleAddTodo = (task: string) => {
    void (async () => {
      await addTodo(task)
      void debouncedSyncToDrive()
    })()
  }

  const handleToggleComplete = (id: string) => {
    void (async () => {
      await toggleComplete(id)
      void debouncedSyncToDrive()
    })()
  }

  const handleDelete = (id: string) => {
    void (async () => {
      await deleteTodo(id)
      void debouncedSyncToDrive()
    })()
  }

  const handleUpdateTask = (id: string, task: string) => {
    void (async () => {
      await updateTask(id, task)
      void debouncedSyncToDrive()
    })()
  }

  const handleReorder = (activeId: string, overId: string) => {
    void (async () => {
      await reorder(activeId, overId)
      void debouncedSyncToDrive()
    })()
  }

  const handleClearCompleted = () => {
    void (async () => {
      await clearCompleted()
      void debouncedSyncToDrive()
    })()
  }

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

  const detailTask = todos.find((todo) => todo.id === detailTaskId)

  if (detailTaskId !== null && detailTask) {
    return (
      <TimeSessionModal
        taskId={detailTask.id}
        taskTitle={detailTask.project ? `${detailTask.project}: ${detailTask.task}` : detailTask.task}
        onBack={() => setDetailTaskId(null)}
        syncVersion={syncVersion}
      />
    )
  }

  return (
    <div className={styles.app} data-sync-version={syncVersion}>
      <header className={styles.header}>
        <nav className={styles.nav}>
          <button
            type="button"
            onClick={() => setActiveTab('todo')}
            className={`${styles.navItem} ${activeTab === 'todo' ? styles.active : ''}`}
          >
            {t('tabs.todo')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`${styles.navItem} ${activeTab === 'report' ? styles.active : ''}`}
          >
            {t('tabs.report')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
          >
            {t('settings.title')}
          </button>
          <div className={styles.languageMenu} ref={langMenuRef}>
            <button
              type="button"
              className={`${styles.navItem} ${styles.languageTrigger}`}
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
            <TodoInput onAdd={handleAddTodo} />
            <ProjectFilterComponent
              selectedFilter={selectedFilter}
              onFilterChange={setSelectedFilter}
            />
            <TodoList
              todos={todos}
              selectedFilter={selectedFilter}
              onToggleComplete={handleToggleComplete}
              onDelete={handleDelete}
              onUpdateTask={handleUpdateTask}
              onOpenTimeSession={setDetailTaskId}
              onReorder={handleReorder}
              syncVersion={syncVersion}
            />
            <UndoToast deletedStack={deletedStack} onUndo={undoDelete} onClose={dismissDelete} />
          </>
        )}
        {activeTab === 'report' && <WeeklyReport />}
        {activeTab === 'settings' && <Settings onClearAllCompleted={handleClearCompleted} />}
      </main>
    </div>
  )
}
