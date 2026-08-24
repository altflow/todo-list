import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { exportAllData, importAllData, type ConflictStrategy } from '../../utils/dataTransfer'
import { copyToClipboard, downloadMarkdown, generateProjectMarkdown } from '../../utils/exportMarkdown'
import { GoogleDriveProvider } from '../../sync/providers/GoogleDriveProvider'
import { syncToDrive } from '../../sync/syncManager'
import styles from './Settings.module.css'

export interface SettingsProps {
  onClearAllCompleted: () => void
  syncVersion?: number
}

const formatInputDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getTodayString = () => formatInputDate(new Date())

const getFirstDayOfCurrentMonth = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`
}

export const getImportConfirmMessage = (t: (key: string) => string, conflictStrategy: ConflictStrategy) => {
  if (conflictStrategy === 'overwrite') {
    return t('dataManagement.confirmImportOverwrite')
  }

  return t('dataManagement.confirmImportSkip')
}

export const Settings = ({ onClearAllCompleted, syncVersion = 0 }: SettingsProps) => {
  const { t } = useTranslation()
  const [selectedProject, setSelectedProject] = useState('')
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth())
  const [endDate, setEndDate] = useState(getTodayString())
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('skip')
  const [importFeedback, setImportFeedback] = useState('')
  const [importError, setImportError] = useState('')
  const [syncEnabled, setSyncEnabled] = useState<boolean>(() => localStorage.getItem('sync_enabled') === 'true')
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => new GoogleDriveProvider().isAuthenticated())
  const [lastSynced, setLastSynced] = useState<string | null>(() => localStorage.getItem('sync_last_synced'))
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncError, setSyncError] = useState<string | null>(null)

  const projects = useLiveQuery(async () => {
    const todos = await db.todos.toArray()
    return Array.from(new Set(todos.map((todo) => todo.project).filter((project): project is string => Boolean(project))))
      .sort((left, right) => left.localeCompare(right))
  }, [syncVersion])

  useEffect(() => {
    if (!projects || projects.length === 0) {
      setSelectedProject('')
      return
    }

    if (!selectedProject || !projects.includes(selectedProject)) {
      setSelectedProject(projects[0])
    }
  }, [projects, selectedProject])

  const filename = useMemo(() => {
    if (!selectedProject) {
      return ''
    }

    return `${selectedProject}_${startDate}_${endDate}.md`
  }, [selectedProject, startDate, endDate])

  const handleClearAllCompleted = () => {
    if (window.confirm(t('settings.clearAllCompletedConfirm'))) {
      onClearAllCompleted()
    }
  }

  const handleLogin = async () => {
    const provider = new GoogleDriveProvider()
    await provider.login(() => {
      setIsAuthenticated(true)
    })
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncError(null)

    try {
      const provider = new GoogleDriveProvider()
      await syncToDrive(provider)
      const now = new Date().toLocaleString()
      localStorage.setItem('sync_last_synced', now)
      setLastSynced(now)
    } catch {
      setSyncError(t('cloudSync.syncError'))
    } finally {
      setIsSyncing(false)
    }
  }

  const handleLogout = () => {
    const provider = new GoogleDriveProvider()
    void provider.logout()
    setIsAuthenticated(false)
  }

  const handleProviderChange = (value: 'disabled' | 'googleDrive') => {
    if (value === 'disabled') {
      const provider = new GoogleDriveProvider()
      void provider.logout()
      setIsAuthenticated(false)
      setLastSynced(null)
      localStorage.removeItem('sync_last_synced')
      localStorage.setItem('sync_enabled', 'false')
    } else {
      localStorage.setItem('sync_enabled', 'true')
    }
    setSyncEnabled(value !== 'disabled')
    setSyncError(null)
  }

  const handleExport = async () => {
    if (!selectedProject) {
      return
    }

    const markdown = await generateProjectMarkdown(0, selectedProject, new Date(startDate), new Date(endDate))
    return markdown
  }

  const handleCopyToClipboard = async () => {
    const markdown = await handleExport()
    if (!markdown) {
      return
    }

    await copyToClipboard(markdown)
    setCopyFeedback(true)
    window.setTimeout(() => setCopyFeedback(false), 2000)
  }

  const handleDownload = async () => {
    const markdown = await handleExport()
    if (!markdown) {
      return
    }

    downloadMarkdown(markdown, filename)
  }

  const handleImportFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null
    setSelectedFile(file)
    setImportFeedback('')
    setImportError('')
  }

  const handleImport = async () => {
    if (!selectedFile) {
      return
    }

    if (!window.confirm(getImportConfirmMessage(t, conflictStrategy))) {
      return
    }

    try {
      const result = await importAllData(selectedFile, conflictStrategy)
      setImportFeedback(t('dataManagement.importSuccess', { taskCount: result.taskCount, sessionCount: result.sessionCount }))
      setImportError('')
      setSelectedFile(null)
      const input = document.getElementById('data-import-file') as HTMLInputElement | null
      if (input) {
        input.value = ''
      }
    } catch {
      setImportFeedback('')
      setImportError(t('dataManagement.importError'))
    }
  }

  return (
    <section className={styles.settings}>
      <section className={styles.syncSection}>
        <h2 className={styles.heading}>{t('cloudSync.title')}</h2>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>{t('cloudSync.provider')}</span>
          <div className={styles.radioGroup}>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="sync-provider"
                value="disabled"
                checked={!syncEnabled}
                onChange={() => handleProviderChange('disabled')}
              />
              <span>{t('cloudSync.disabled')}</span>
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="sync-provider"
                value="googleDrive"
                checked={syncEnabled}
                onChange={() => handleProviderChange('googleDrive')}
              />
              <span>{t('cloudSync.googleDrive')}</span>
            </label>
          </div>
        </div>

        {syncEnabled ? (
          <div className={styles.syncBox}>
            {!isAuthenticated ? (
              <button type="button" className={styles.exportButton} onClick={() => void handleLogin()}>
                {t('cloudSync.login')}
              </button>
            ) : (
              <>
                <p className={styles.syncStatus}>
                  ✅ {t('cloudSync.connected')}
                </p>
                <p className={styles.description}>
                  {t('cloudSync.lastSynced', { time: lastSynced ?? '-' })}
                </p>
                <div className={styles.buttonRow}>
                  <button type="button" className={styles.exportButton} onClick={() => void handleSync()} disabled={isSyncing}>
                    {isSyncing ? t('cloudSync.syncing') : t('cloudSync.syncNow')}
                  </button>
                  <button type="button" className={styles.clearButton} onClick={handleLogout}>
                    {t('cloudSync.logout')}
                  </button>
                </div>
              </>
            )}

            {syncError ? <p className={styles.errorMessage}>{syncError}</p> : null}
          </div>
        ) : null}

        {syncEnabled ? <p className={styles.helperText}>{t('cloudSync.note')}</p> : null}
      </section>

      <section className={styles.dataSection}>
        <h2 className={styles.heading}>{t('settings.dataManagement')}</h2>
        <p className={styles.description}>{t('settings.clearAllCompletedDescription')}</p>
        <button type="button" className={styles.clearButton} onClick={handleClearAllCompleted}>
          {t('settings.clearAllCompletedButton')}
        </button>
      </section>

      <section className={styles.dataSection}>
        <h2 className={styles.heading}>{t('settings.markdownExport.title')}</h2>
        <p className={styles.description}>{t('settings.markdownExport.description')}</p>
        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="project-select">
            {t('export.project')}
          </label>
          <select
            id="project-select"
            className={styles.select}
            value={selectedProject}
            onChange={(event) => setSelectedProject(event.target.value)}
          >
            <option value="">{t('export.project')}</option>
            {projects?.map((project) => (
              <option key={project} value={project}>
                {project}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="export-start-date">
            {t('export.startDate')}
          </label>
          <input
            id="export-start-date"
            className={styles.input}
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
          />
        </div>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="export-end-date">
            {t('export.endDate')}
          </label>
          <input
            id="export-end-date"
            className={styles.input}
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
          />
        </div>

        <div className={styles.buttonRow}>
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleCopyToClipboard}
            disabled={!selectedProject}
          >
            {copyFeedback ? t('export.copied') : t('export.copyToClipboard')}
          </button>
          <button
            type="button"
            className={styles.exportButton}
            onClick={handleDownload}
            disabled={!selectedProject}
          >
            {t('export.download')}
          </button>
        </div>
      </section>

      <section className={`${styles.backupSection} ${styles.sectionDivider}`}>
        <h2 className={styles.heading}>{t('settings.backup.title')}</h2>
        <p className={styles.description}>{t('settings.backup.description')}</p>

        <div className={styles.buttonRow}>
          <button type="button" className={styles.exportButton} onClick={() => void exportAllData()}>
            {t('dataManagement.export')}
          </button>
        </div>
      </section>

      <section className={`${styles.restoreSection} ${styles.sectionDivider}`}>
        <h2 className={styles.heading}>{t('settings.restore.title')}</h2>
        <p className={styles.description}>{t('settings.restore.description')}</p>

        <div className={styles.fieldGroup}>
          <label className={styles.label} htmlFor="data-import-file">
            {t('dataManagement.selectFile')}
          </label>
          <input
            id="data-import-file"
            className={styles.fileInput}
            type="file"
            accept=".json"
            onChange={handleImportFileChange}
          />
        </div>

        <div className={styles.fieldGroup}>
          <span className={styles.label}>{t('dataManagement.conflictStrategy')}</span>
          <div className={styles.radioGroup}>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="conflict-strategy"
                value="skip"
                checked={conflictStrategy === 'skip'}
                onChange={() => setConflictStrategy('skip')}
              />
              <span>{t('dataManagement.skip')}</span>
            </label>
            <label className={styles.radioOption}>
              <input
                type="radio"
                name="conflict-strategy"
                value="overwrite"
                checked={conflictStrategy === 'overwrite'}
                onChange={() => setConflictStrategy('overwrite')}
              />
              <span>{t('dataManagement.overwrite')}</span>
            </label>
          </div>
        </div>

        <div className={styles.buttonRow}>
          <button type="button" className={styles.exportButton} onClick={() => void handleImport()} disabled={!selectedFile}>
            {t('dataManagement.import')}
          </button>
        </div>

        {importFeedback ? <p className={styles.successMessage}>{importFeedback}</p> : null}
        {importError ? <p className={styles.errorMessage}>{importError}</p> : null}
      </section>
    </section>
  )
}
