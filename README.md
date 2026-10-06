# Todo List

A personal productivity app for task management and time tracking, built with modern web technologies and designed as a Progressive Web App (PWA).

## Features

- **Task Management** — Add, edit, delete, and complete tasks
- **Project Filtering** — Organize tasks by project
- **Drag & Drop** — Reorder tasks intuitively
- **Delete Undo** — Restore the last deleted task
- **Time Tracking** — Log work sessions manually with start/end times and notes
- **Weekly Report** — View completed tasks and time spent, grouped by project, with expandable session details
- **Markdown Export** — Export project work history as Markdown (great for use with NotebookLM and other AI tools)
- **Backup & Restore** — Export and import all data as JSON
- **Cloud Sync** *(optional)* — Sync across devices via Google Drive
- **PWA** — Install as a native-like app on desktop and mobile
- **Themes** — Light, Dark, and Auto
- **Internationalization** — Japanese and English

## Tech Stack

- TypeScript / React 19 / Vite
- Dexie.js (IndexedDB)
- date-fns
- react-i18next
- @dnd-kit
- Vitest
- CSS Modules
- vite-plugin-pwa

## Live Demo

[https://todo-list.altf.workers.dev](https://todo-list.altf.workers.dev)

> Cloud sync is disabled in the public demo. To enable it, set up your own Google Client ID (see below).

## Getting Started

### Prerequisites

- Node.js 20+
- npm

### Installation

```bash
git clone https://github.com/altflow/todo-list.git
cd todo-list
npm install
npm run dev
```

## Google Drive Sync (Optional)

Cloud sync is disabled by default. To enable it, you need to obtain your own Google OAuth Client ID.

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)

### Step 2: Enable the Google Drive API

```
APIs & Services → Library → Search "Google Drive API" → Enable
```

### Step 3: Configure the OAuth Consent Screen

```
APIs & Services → OAuth consent screen
- User type: External
- App name: Todo List (or any name)
- Scopes: https://www.googleapis.com/auth/drive.appdata
- Test users: Add your own Google account
```

> The `drive.appdata` scope only accesses a hidden app-specific folder in Drive. It cannot read or modify any of your personal Drive files.

### Step 4: Create an OAuth 2.0 Client ID

```
APIs & Services → Credentials → Create Credentials → OAuth client ID
- Application type: Web application
- Authorized JavaScript origins:
    http://localhost:5173 (for local development)
    https://your-domain.com (for production)
```

### Step 5: Configure the Environment Variable

Create a `.env.local` file in the project root:

```
VITE_GOOGLE_CLIENT_ID=your-client-id-here
```

Restart the dev server. The Google Drive sync option will appear in Settings.

## Running Tests

```bash
npx vitest run
```

## Building for Production

```bash
npm run build
```

## License

MIT
