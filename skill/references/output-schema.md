# Output Schema

Defines the exact structure of data returned by IM-Nexus API endpoints.

---

## `GET /api/overview` — Executive Briefing

This is the primary endpoint the skill uses.

```json
{
  "summary": "## 🎯 Key Focus Points\n1. **Item** — context\n...",
  "user": {
    "name": "string",
    "email": "string",
    "picture": "string (URL)"
  },
  "eventCount": 4,
  "taskCount": 7
}
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `summary` | `string` (Markdown) | AI-generated briefing following the template |
| `user.name` | `string` | Google account display name |
| `user.email` | `string` | Google account email |
| `user.picture` | `string` | Profile photo URL |
| `eventCount` | `integer` | Number of calendar events in the next 48h |
| `taskCount` | `integer` | Number of pending tasks across all lists |

---

## `GET /api/gmail` — Email List

```json
{
  "emails": [
    {
      "id": "string",
      "subject": "string",
      "from": "string",
      "snippet": "string (first ~100 chars)",
      "date": "string (ISO)"
    }
  ]
}
```

---

## `GET /api/calendar` — Events

```json
{
  "events": [
    {
      "id": "string",
      "summary": "string",
      "start": { "dateTime": "string (ISO)" },
      "end": { "dateTime": "string (ISO)" },
      "location": "string | null",
      "attendees": ["email1", "email2"],
      "hangoutLink": "string | null"
    }
  ]
}
```

---

## `GET /api/tasks` — Task List

```json
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "notes": "string | null",
      "due": "string (ISO) | null",
      "status": "needsAction | completed",
      "listName": "string"
    }
  ]
}
```

---

## `POST /api/chat` — AI Chat Response

```json
{
  "reply": "string (Markdown)"
}
```

### Request Body

```json
{
  "message": "string",
  "history": [
    { "role": "user | ai", "text": "string" }
  ]
}
```

---

## Error Response (all endpoints)

```json
{
  "error": "Human-readable error message"
}
```

HTTP Status Codes:
- `401` — Token missing or expired
- `403` — Insufficient OAuth scopes
- `500` — Google API or AI API failure
