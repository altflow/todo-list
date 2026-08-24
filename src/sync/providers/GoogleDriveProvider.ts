import type { ExportData, SyncProvider } from '../SyncProvider'

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (response: { access_token?: string; error?: string; expires_in?: number }) => void
          }) => {
            requestAccessToken: () => void
          }
        }
      }
    }
  }
}

export class GoogleDriveProvider implements SyncProvider {
  readonly name = 'Google Drive'

  private readonly clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''
  private readonly scope = 'https://www.googleapis.com/auth/drive.appdata'
  private readonly tokenStorageKey = 'google_access_token'
  private readonly expiryStorageKey = 'google_token_expiry'
  private readonly fileName = 'todo-sync.json'

  async login(onSuccess?: () => void): Promise<void> {
    if (!this.clientId) {
      throw new Error('VITE_GOOGLE_CLIENT_ID is not configured')
    }

    await this.loadGoogleIdentityServices()

    const tokenClient = window.google?.accounts.oauth2.initTokenClient({
      client_id: this.clientId,
      scope: this.scope,
      callback: (response) => {
        if (response.error) {
          throw new Error(response.error)
        }

        if (response.access_token) {
          localStorage.setItem(this.tokenStorageKey, response.access_token)

          const expiry = response.expires_in
            ? Math.floor(Date.now() / 1000) + response.expires_in
            : Math.floor(Date.now() / 1000) + 3600

          localStorage.setItem(this.expiryStorageKey, String(expiry))
          onSuccess?.()
        }
      },
    })

    if (!tokenClient) {
      throw new Error('Google Identity Services is unavailable')
    }

    tokenClient.requestAccessToken()
  }

  async logout(): Promise<void> {
    localStorage.removeItem(this.tokenStorageKey)
    localStorage.removeItem(this.expiryStorageKey)
  }

  async upload(data: ExportData): Promise<void> {
    const token = this.getStoredToken()

    if (!token) {
      throw new Error('Not authenticated')
    }

    const existingFile = await this.findFile(token)

    const metadata: Record<string, unknown> = existingFile
      ? { name: this.fileName }
      : { name: this.fileName, parents: ['appDataFolder'] }

    const formData = new FormData()
    formData.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    formData.append('file', new Blob([JSON.stringify(data)], { type: 'application/json' }))

    const url = existingFile
      ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
      : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'

    const response = await fetch(url, {
      method: existingFile ? 'PATCH' : 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (response.ok) {
      return
    }

    if (response.status === 401) {
      await this.logout()
      throw new Error('Not authenticated')
    }

    // If the PATCH to an existing file failed due to insufficient permissions,
    // try creating a new file instead of modifying the existing one. This can
    // happen when the existing file belongs to a different app/client.
    if (response.status === 403 && existingFile) {
      const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart'
      const createResp = await fetch(createUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (createResp.ok) {
        return
      }

      if (createResp.status === 401) {
        await this.logout()
        throw new Error('Not authenticated')
      }

      throw new Error(`Upload failed: ${createResp.status}`)
    }

    throw new Error(`Upload failed: ${response.status}`)
  }

  async download(): Promise<ExportData | null> {
    const token = this.getStoredToken()

    if (!token) {
      return null
    }

    const file = await this.findFile(token)

    if (!file) {
      return null
    }

    const response = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }

      if (response.status === 401) {
        await this.logout()
        throw new Error('Not authenticated')
      }

      throw new Error(`Download failed: ${response.status}`)
    }

    return (await response.json()) as ExportData
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenStorageKey)
    const expiry = Number(localStorage.getItem(this.expiryStorageKey))

    return Boolean(token && expiry && expiry > Math.floor(Date.now() / 1000))
  }

  private async loadGoogleIdentityServices(): Promise<void> {
    if (typeof window === 'undefined' || window.google?.accounts?.oauth2) {
      return
    }

    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load Google Identity Services'))
      document.head.appendChild(script)
    })
  }

  private async findFile(token: string): Promise<{ id: string } | null> {
    const listResponse = await fetch(
      'https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name)',
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    )

    if (!listResponse.ok) {
      if (listResponse.status === 401) {
        await this.logout()
        throw new Error('Not authenticated')
      }

      throw new Error(`Failed to list files: ${listResponse.status}`)
    }

    const listData = (await listResponse.json()) as { files?: Array<{ id: string; name: string }> }
    const file = listData.files?.find((f) => f.name === this.fileName)
    return file ?? null
  }

  private getStoredToken(): string | null {
    const token = localStorage.getItem(this.tokenStorageKey)
    const expiry = Number(localStorage.getItem(this.expiryStorageKey))

    if (!token || !expiry || expiry <= Math.floor(Date.now() / 1000)) {
      return null
    }

    return token
  }
}
