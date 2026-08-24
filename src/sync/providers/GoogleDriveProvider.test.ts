import { beforeEach, describe, expect, it } from 'vitest'
import { GoogleDriveProvider } from './GoogleDriveProvider'

describe('GoogleDriveProvider', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns true when a valid access token is stored', () => {
    const provider = new GoogleDriveProvider()

    localStorage.setItem('google_access_token', 'token')
    localStorage.setItem('google_token_expiry', String(Date.now() + 60_000))

    expect(provider.isAuthenticated()).toBe(true)
  })

  it('clears stored auth data on logout', async () => {
    const provider = new GoogleDriveProvider()

    localStorage.setItem('google_access_token', 'token')
    localStorage.setItem('google_token_expiry', String(Date.now() + 60_000))

    await provider.logout()

    expect(localStorage.getItem('google_access_token')).toBeNull()
    expect(localStorage.getItem('google_token_expiry')).toBeNull()
  })
})
