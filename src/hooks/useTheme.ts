import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'auto'

const getStoredTheme = (): Theme => {
  try {
    const savedTheme = window.localStorage.getItem('theme')
    if (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto') {
      return savedTheme
    }
  } catch {
    // localStorage may be unavailable in some environments
  }

  return 'auto'
}

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => getStoredTheme())

  useEffect(() => {
    try {
      window.localStorage.setItem('theme', theme)
    } catch {
      // ignore localStorage write failures
    }

    if (theme === 'auto') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }, [theme])

  return { theme, setTheme }
}
