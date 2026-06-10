import { useTranslation } from 'react-i18next'
import type { DeletedItem } from '../../types/todo'
import styles from './UndoToast.module.css'

interface UndoToastProps {
  deletedStack: DeletedItem[]
  onUndo: () => void
  onClose: () => void
}

export const UndoToast = ({ deletedStack, onUndo, onClose }: UndoToastProps) => {
  const { t } = useTranslation()

  if (deletedStack.length === 0) {
    return null
  }

  const { item } = deletedStack[0]
  const deletedLabel = item.project ? `${item.project}: ${item.task}` : item.task

  return (
    <div className={styles.toast}>
      <span className={styles.message}>
        {t('undoToast.message', { task: deletedLabel })}
      </span>
      <div className={styles.controls}>
        <button type="button" className={styles.undoButton} onClick={onUndo}>
          {t('undoToast.undoButton')}
        </button>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          {t('undoToast.closeButton')}
        </button>
      </div>
    </div>
  )
}
