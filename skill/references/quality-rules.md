# IM-Nexus Quality Rules & Standards

## Code Quality

### Frontend (React/Vite)
- All new UI components **must** use CSS variables (`var(--text-main)`, etc.) instead of hardcoded hex colors.
- Tailwind utility classes like `text-white`, `text-zinc-*` are acceptable but will be overridden by `.light-theme` selectors in `index.css`.
- Every interactive element should have a smooth `transition` (minimum 0.18s ease).
- Glass cards must use the `.glass` and `.glass-hover` CSS classes for consistency.

### Backend (Node.js/Express)
- All Google API calls must go through helper functions in `googleAuth.js`.
- API routes follow the pattern: `GET/POST /api/<module>/<action>`.
- Error responses must return `{ error: "message" }` with appropriate HTTP status codes.
- The AI system prompt in `index.js` must always include the user's name, email, and current time.

## Security Rules
- `credentials.json`, `token.json`, and `.env` must **never** be committed to git.
- API keys must only be stored in `server/.env`.
- OAuth tokens are stored in `server/token.json` (auto-generated, user-specific).

## Google OAuth Scopes
The following scopes are required for full functionality:

| Scope | Module |
|-------|--------|
| `gmail.readonly` | Gmail View |
| `calendar.readonly`, `calendar.events` | Calendar View |
| `drive` | Drive View |
| `documents` | Docs (via Drive) |
| `spreadsheets` | Sheets (via Drive) |
| `forms.responses.readonly`, `forms.body.readonly` | Forms |
| `contacts.readonly` | Contacts View |
| `tasks` | Tasks View |
| `chat.messages.readonly`, `chat.spaces.readonly` | Chat Spaces View |
| `userinfo.profile`, `userinfo.email` | User Info |
| `analytics.readonly` | Analytics |

## Theme Variables Reference

### Dark Theme (`:root`)
| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-main` | `#080809` | Page background |
| `--bg-sidebar` | `rgba(255,255,255,0.01)` | Sidebar background |
| `--text-main` | `#e4e4e7` | Primary text |
| `--text-muted` | `#71717a` | Secondary text |
| `--text-sub` | `#a1a1aa` | Tertiary text |
| `--glass-bg` | `rgba(255,255,255,0.03)` | Card backgrounds |
| `--glass-border` | `rgba(255,255,255,0.07)` | Card borders |

### Light Theme (`.light-theme`)
| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-main` | `#f8fafc` | Page background |
| `--bg-sidebar` | `#ffffff` | Sidebar background |
| `--text-main` | `#0f172a` | Primary text |
| `--text-muted` | `#64748b` | Secondary text |
| `--text-sub` | `#475569` | Tertiary text |
| `--glass-bg` | `rgba(255,255,255,0.7)` | Card backgrounds |
| `--glass-border` | `rgba(0,0,0,0.06)` | Card borders |
