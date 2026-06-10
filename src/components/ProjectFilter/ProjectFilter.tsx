import { useTranslation } from 'react-i18next'
import type { Todo, ProjectFilter as ProjectFilterType } from '../../types/todo'
import styles from './ProjectFilter.module.css'

interface ProjectFilterProps {
  todos: Todo[]
  selectedFilter: ProjectFilterType
  onFilterChange: (filter: ProjectFilterType) => void
}

const FILTERS: ProjectFilterType[] = ['all', 'general']

export function ProjectFilter({
  todos,
  selectedFilter,
  onFilterChange,
}: ProjectFilterProps) {
  const { t } = useTranslation()
  const projectNames = Array.from(
    new Set(todos.flatMap((todo) => (todo.project ? [todo.project] : [])))
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  if (projectNames.length === 0) {
    return null
  }

  const filters = [...FILTERS, ...projectNames]

  const getLabel = (filter: ProjectFilterType) => {
    if (filter === 'all') {
      return t('projectFilter.all')
    }
    if (filter === 'general') {
      return t('projectFilter.general')
    }
    return filter
  }

  return (
    <div className={styles.container}>
      <span className={styles.label}>{t('projectFilter.label')}</span>
      <div className={styles.filterList}>
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={`${styles.filterButton} ${
              selectedFilter === filter ? styles.active : ''
            }`}
            onClick={() => onFilterChange(filter)}
          >
            {getLabel(filter)}
          </button>
        ))}
      </div>
    </div>
  )
}
