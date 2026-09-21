import { useEffect, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import styles from './TaskItemActions.module.css'

interface TaskItemActionsProps {
  onEdit: () => void
  onDelete: () => void
  onOpenTimeSession: () => void
}

interface TaskActionMenuProps extends TaskItemActionsProps {
  onClose: () => void
  isFlipped: boolean
  triggerRef: RefObject<HTMLButtonElement | null>
}

function TaskActionMenu({
  onEdit,
  onDelete,
  onOpenTimeSession,
  onClose,
  isFlipped,
  triggerRef,
}: TaskActionMenuProps) {
  const { t } = useTranslation()
  const menuRef = useRef<HTMLDivElement>(null)
  const firstItemRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    firstItemRef.current?.focus()
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (
        !(event.target instanceof Node) ||
        menuRef.current?.contains(event.target) ||
        triggerRef.current?.contains(event.target)
      ) {
        return
      }

      onClose()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose, triggerRef])

  const handleAction = (action: () => void) => {
    action()
    onClose()
  }

  return (
    <div
      ref={menuRef}
      className={`${styles.menu} ${isFlipped ? styles.flipUp : ''}`}
      role="menu"
    >
      <button
        ref={firstItemRef}
        type="button"
        role="menuitem"
        aria-label={t('todoItem.editButton')}
        onClick={() => handleAction(onEdit)}
      >
        <span aria-hidden="true">✎</span>
      </button>
      <button
        type="button"
        role="menuitem"
        aria-label={t('todoItem.deleteButton')}
        onClick={() => handleAction(onDelete)}
      >
        <span aria-hidden="true">🗑</span>
      </button>
      <button
        type="button"
        role="menuitem"
        aria-label={t('todoItem.timeSessionButton')}
        onClick={() => handleAction(onOpenTimeSession)}
      >
        <span aria-hidden="true">⏱</span>
      </button>
    </div>
  )
}

export function TaskItemActions({
  onEdit,
  onDelete,
  onOpenTimeSession,
}: TaskItemActionsProps) {
  const { t } = useTranslation()
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [isOpen, setIsOpen] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const closeMenu = () => {
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const toggleMenu = () => {
    if (isOpen) {
      closeMenu()
      return
    }

    const triggerRect = triggerRef.current?.getBoundingClientRect()
    const menuHeight = 3 * 44
    setIsFlipped(Boolean(triggerRect && triggerRect.bottom + menuHeight > window.innerHeight))
    setIsOpen(true)
  }

  if (!isMobile) {
    return (
      <>
        <button type="button" onClick={onOpenTimeSession} className={styles.timeSessionBtn} aria-label={t('todoItem.timeSessionButton')}>
          ⏱
        </button>
        <button type="button" onClick={onEdit} className={styles.actionButton}>
          {t('todoItem.editButton')}
        </button>
        <button type="button" onClick={onDelete} className={styles.actionButton}>
          {t('todoItem.deleteButton')}
        </button>
      </>
    )
  }

  return (
    <div className={styles.container}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.menuTrigger}
        aria-label={t('todoItem.actionsMenuButton')}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={toggleMenu}
      >
        <span aria-hidden="true">⋮</span>
      </button>
      {isOpen ? (
        <TaskActionMenu
          onEdit={onEdit}
          onDelete={onDelete}
          onOpenTimeSession={onOpenTimeSession}
          onClose={closeMenu}
          isFlipped={isFlipped}
          triggerRef={triggerRef}
        />
      ) : null}
    </div>
  )
}