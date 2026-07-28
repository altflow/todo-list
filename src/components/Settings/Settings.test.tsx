import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getImportConfirmMessage, Settings } from './Settings'

const translate = (key: string) => key

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: translate })
}))

vi.mock('dexie-react-hooks', () => ({
  useLiveQuery: () => []
}))

vi.mock('../../db/database', () => ({
  db: {
    todos: {
      toArray: vi.fn(async () => [])
    }
  }
}))

describe('getImportConfirmMessage', () => {
  it('returns the skip confirmation message when skip is selected', () => {
    expect(getImportConfirmMessage(translate, 'skip')).toBe('dataManagement.confirmImportSkip')
  })

  it('returns the overwrite confirmation message when overwrite is selected', () => {
    expect(getImportConfirmMessage(translate, 'overwrite')).toBe('dataManagement.confirmImportOverwrite')
  })
})

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the new settings sections and descriptions', () => {
    render(<Settings onClearAllCompleted={() => undefined} />)

    expect(screen.getByText('settings.markdownExport.title')).toBeInTheDocument()
    expect(screen.getByText('settings.markdownExport.description')).toBeInTheDocument()
    expect(screen.getByText('settings.backup.title')).toBeInTheDocument()
    expect(screen.getByText('settings.backup.description')).toBeInTheDocument()
    expect(screen.getByText('settings.restore.title')).toBeInTheDocument()
    expect(screen.getByText('settings.restore.description')).toBeInTheDocument()
  })
})
