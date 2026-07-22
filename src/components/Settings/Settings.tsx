import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../../db/database'
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

export const Settings = ({ onClearAllCompleted }: SettingsProps) => {
  const { t } = useTranslation()
  const [selectedProject, setSelectedProject] = useState('')
  const [startDate, setStartDate] = useState(getFirstDayOfCurrentMonth())
  const [endDate, setEndDate] = useState(getTodayString())
  const [copyFeedback, setCopyFeedback] = useState(false)

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

  return (
    <section className={styles.settings}>
      <section className={styles.dataSection}>
        <h2 className={styles.heading}>{t('settings.dataManagement')}</h2>
        <p className={styles.description}>{t('settings.clearAllCompletedDescription')}</p>
        <button type="button" className={styles.clearButton} onClick={handleClearAllCompleted}>
          {t('settings.clearAllCompletedButton')}
        </button>
      </section>

      <section className={styles.exportSection}>
        <h2 className={styles.heading}>{t('export.title')}</h2>
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
    </section>
  )
}
