import type { DeletedItem } from '../../types/todo'
import styles from './UndoToast.module.css'

interface UndoToastProps {
  deletedStack: DeletedItem[]
  onUndo: () => void
  onClose: () => void
}

export const UndoToast = ({ deletedStack, onUndo, onClose }: UndoToastProps) => {
  if (deletedStack.length === 0) {
    return null
  }

  const { item } = deletedStack[0]
  const deletedLabel = item.project ? `${item.project}: ${item.task}` : item.task

  return (
    <div className={styles.toast}>
      <span className={styles.message}>
        &quot;{deletedLabel}&quot; を削除しました
      </span>
      <div className={styles.controls}>
        <button type="button" className={styles.undoButton} onClick={onUndo}>
          元に戻す
        </button>
        <button type="button" className={styles.closeButton} onClick={onClose}>
          ×
        </button>
      </div>
    </div>
  )
}
