import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
import { exportAllData, importAllData, type ConflictStrategy } from '../../utils/dataTransfer'
import { copyToClipboard, downloadMarkdown, generateProjectMarkdown } from '../../utils/exportMarkdown'
import styles from './Settings.module.css'

export interface SettingsProps {
  onClearAllCompleted: () => void
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

export const Settings = ({ onClearAllCompleted }: SettingsProps) => {
  const { t } = useTranslation()
  const [selectedProject, setSelectedProject] = useState('')
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth())
  const [endDate, setEndDate] = useState(getTodayString())
  const [copyFeedback, setCopyFeedback] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [conflictStrategy, setConflictStrategy] = useState<ConflictStrategy>('skip')
  const [importFeedback, setImportFeedback] = useState('')
  const [importError, setImportError] = useState('')

  const projects = useLiveQuery(async () => {
    const todos = await db.todos.toArray()
    return Array.from(new Set(todos.map((todo) => todo.project).filter((project): project is string => Boolean(project))))
      .sort((left, right) => left.localeCompare(right))
  }, [])

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
      <section className={styles.dataSection}>
        <h2 className={styles.heading}>{t('settings.dataManagement')}</h2>
        <p className={styles.description}>{t('settings.clearAllCompletedDescription')}</p>
        <button type="button" className={styles.clearButton} onClick={handleClearAllCompleted}>
          {t('settings.clearAllCompletedButton')}
        </button>
      </section>

      <section className={`${styles.exportSection} ${styles.sectionDivider}`}>
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
