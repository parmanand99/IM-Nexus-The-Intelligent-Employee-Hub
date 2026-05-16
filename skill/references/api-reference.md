# IM-Nexus API Reference

## Authentication Endpoints

### `GET /api/auth/url`
Returns the Google OAuth2 authorization URL.
- **Response:** `{ url: "https://accounts.google.com/o/oauth2/..." }`
- **Error:** `{ error: "message" }`

### `GET /api/auth/callback?code=<code>`
Handles the OAuth2 callback, exchanges the code for tokens, and saves them.
- **Query Params:** `code` — the authorization code from Google.
- **Response:** `{ success: true }`

### `GET /api/auth/status`
Checks if the user is currently authenticated.
- **Response:** `{ authenticated: true, user: { name, email, picture } }`

### `POST /api/auth/logout`
Deletes the stored token and logs the user out.
- **Response:** `{ success: true }`

---

## Workspace Data Endpoints

### `GET /api/gmail`
Fetches recent emails from the user's Gmail inbox.
- **Response:** `{ emails: [{ id, subject, from, snippet, date }] }`

### `GET /api/calendar`
Fetches upcoming calendar events (next 48 hours).
- **Response:** `{ events: [{ id, summary, start, end, location, attendees }] }`

### `GET /api/drive`
Lists recent files from Google Drive.
- **Response:** `{ files: [{ id, name, mimeType, modifiedTime, webViewLink }] }`

### `GET /api/tasks`
Fetches pending tasks across all task lists.
- **Response:** `{ tasks: [{ id, title, notes, due, status, listName }] }`

### `POST /api/tasks`
Creates a new task.
- **Body:** `{ title, notes?, due?, listId? }`
- **Response:** `{ task: { id, title, ... } }`

### `GET /api/contacts`
Fetches the user's Google Contacts.
- **Response:** `{ contacts: [{ name, email, phone, org }] }`

### `GET /api/chat/spaces`
Lists Google Chat spaces the user is a member of.
- **Response:** `{ spaces: [{ name, displayName, type }] }`

---

## AI Endpoints

### `GET /api/briefing`
Generates an AI-powered daily briefing based on the user's Gmail, Calendar, and Tasks data.
- **Response:** `{ summary: "markdown string" }`

### `POST /api/chat`
Sends a message to the AI assistant with full workspace tool access.
- **Body:** `{ message: "string", history: [{ role, text }] }`
- **Response:** `{ reply: "markdown string" }`

### `GET /api/preferences`
Retrieves user's AI personality preferences.
- **Response:** `{ instructions: "string" }`

### `POST /api/preferences`
Saves user's AI personality preferences.
- **Body:** `{ instructions: "string" }`
- **Response:** `{ success: true }`

---

## Error Handling

All error responses follow the format:
```json
{ "error": "Human-readable error message" }
```

Common HTTP status codes:
- `401` — Not authenticated (token missing or expired)
- `403` — Insufficient scopes
- `500` — Server error (Google API failure, AI API failure, etc.)
