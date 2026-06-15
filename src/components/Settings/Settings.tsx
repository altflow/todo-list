import { useTranslation } from 'react-i18next'
import styles from './Settings.module.css'

export interface SettingsProps {
  onClearAllCompleted: () => void
}

export const Settings = ({ onClearAllCompleted }: SettingsProps) => {
  const { t } = useTranslation()

  const handleClearAllCompleted = () => {
    if (window.confirm(t('settings.clearAllCompletedConfirm'))) {
      onClearAllCompleted()
    }
  }

  return (
    <section className={styles.settings}>
      <h2 className={styles.heading}>{t('settings.dataManagement')}</h2>
      <p className={styles.description}>{t('settings.clearAllCompletedDescription')}</p>
      <button type="button" className={styles.clearButton} onClick={handleClearAllCompleted}>
        {t('settings.clearAllCompletedButton')}
      </button>
    </section>
  )
}
