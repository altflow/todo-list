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
  const projectNames = Array.from(
    new Set(todos.flatMap((todo) => (todo.project ? [todo.project] : [])))
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))

  if (projectNames.length === 0) {
    return null
  }

  const filters = [...FILTERS, ...projectNames]

  const getLabel = (filter: ProjectFilterType) => {
    if (filter === 'all') {
      return 'すべて'
    }
    if (filter === 'general') {
      return 'General'
    }
    return filter
  }

  return (
    <div className={styles.container}>
      <span className={styles.label}>プロジェクト:</span>
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
