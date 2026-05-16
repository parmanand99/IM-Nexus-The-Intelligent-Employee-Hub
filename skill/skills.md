---
name: im-nexus-workspace-intelligence
description: >
  Use this skill when the user asks to generate a daily executive briefing,
  audit workspace productivity, triage overdue tasks, summarize unread emails,
  or produce an actionable work-readiness report from Google Workspace data
  (Gmail, Calendar, Drive, Tasks, Contacts, Chat). Returns a structured
  Markdown report with severity-ranked priorities, time estimates, and
  recommended next actions.
---

# IM-Nexus: The Intelligent Employee Hub

## Purpose

IM-Nexus aggregates an employee's Google Workspace signals — unread emails,
upcoming meetings, overdue tasks, recent Drive activity, and Chat threads —
and synthesizes them into a **structured, actionable intelligence report**.

The pain it solves: employees at IndiaMART spend ~25 minutes each morning
manually checking Gmail, Calendar, Tasks, and Chat to figure out what needs
attention. Multiply by ~4,000 knowledge workers × 250 working days = **416,000
hours/year** lost to manual workspace triage.

This skill reduces that to **< 30 seconds** per employee per day.

---

## ⚠️ Important Note for Evaluators
- **Google Chat API**: Currently, the Chat section is not working because our Google Cloud credentials are on a personal Gmail account (which does not support the Chat API), and the office account did not allow project creation.
- **Demo Credentials**: A `credentials.json` file is required for demo purposes. Please contact us to obtain it.

---

## When to Invoke

Activate this skill when the user says any of:
- "Generate my daily briefing"
- "What should I focus on today?"
- "Summarize my workspace"
- "Triage my overdue tasks"
- "Give me a productivity audit"
- "What emails need my attention?"
- "Prepare my morning report"

Do NOT invoke when:
- The user asks to compose or send an email (that's a write action, not intelligence)
- The user asks about non-workspace topics

---

## Inputs

| Input | Required | Description |
|-------|----------|-------------|
| Google OAuth token | Yes | Stored in `server/token.json` after first auth |
| User email | Auto | Extracted from OAuth profile |
| Lookback window | No | Default: emails from last 24h, events for next 48h |
| Custom AI instructions | No | User-defined personality from `server/user_preferences.json` |

---

## Workflow Steps

When invoked, follow these steps:

### Step 1 — Authenticate & Validate
Verify the user has a valid Google OAuth token. If not, direct them to sign in.
```
Run: node scripts/health_check.js
Expected: All checks ✅
```

### Step 2 — Gather Workspace Signals
The server fetches data in parallel from 6 Google APIs:
1. **Gmail** — Last 15 emails from the past 24 hours
2. **Calendar** — All events in the next 48 hours
3. **Tasks** — All pending tasks across every task list
4. **Drive** — Recent file modifications
5. **Contacts** — Available for cross-referencing meeting attendees
6. **Chat Spaces** — Recent messages and threads

This happens via `GET /api/overview` which calls:
```javascript
const [emails, events, tasks, user] = await Promise.all([
  g.getGmailMessages(15, 'newer_than:1d'),
  g.getCalendarEvents(2),
  g.getTasks(),
  g.getUserInfo(),
]);
```

### Step 3 — AI Synthesis
The raw workspace data is passed to an LLM with a structured prompt:
```
Generate a comprehensive daily briefing.
Start with a "🎯 Key Focus Points" section for the most urgent/important items.
Then provide a detailed breakdown of emails, meetings, and tasks.
Use clear markdown headings, bold text, and bullet points.
Be very specific with names and times.
```

### Step 4 — Produce the Report
The AI generates a structured Markdown report following the template in
`assets/briefing-template.md`. The report includes:
- **🎯 Key Focus Points** — Top 3 priorities ranked by urgency
- **📧 Email Triage** — Unread emails grouped by sender/urgency
- **📅 Today's Schedule** — Meetings with attendees, times, and prep notes
- **✅ Task Status** — Overdue items flagged red, upcoming items listed
- **📊 Productivity Score** — A 0–100 score based on task completion rate

### Step 5 — Deliver & Act
The report is rendered in the dashboard's AI Briefing card. The user can:
- Click into any module (Gmail, Calendar, Tasks) for details
- Ask follow-up questions via the AI Chat interface
- Create tasks or meetings directly from recommendations

---

## Outputs

| Output | Format | Description |
|--------|--------|-------------|
| Executive Briefing | Markdown | Structured daily report (see `assets/briefing-template.md`) |
| Productivity Score | Integer (0–100) | Task completion rate × meeting prep readiness |
| Priority List | Markdown list | Top 3 items ranked by urgency with time estimates |
| Event Count | Integer | Number of meetings in the next 48 hours |
| Task Count | Integer | Number of pending tasks |

---

## Environment Variables

| Variable | Required | Location | Description |
|----------|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | `server/.env` | API key for AI synthesis (Claude or compatible) |
| Google OAuth `client_id` | Yes | `server/credentials.json` | Google Cloud OAuth 2.0 client ID |
| Google OAuth `client_secret` | Yes | `server/credentials.json` | Google Cloud OAuth 2.0 client secret |
| `redirect_uris` | Yes | `server/credentials.json` | Must include `http://localhost:5173` |

---

## Architecture

```
┌──────────────────────────────────────────────────┐
│  Client (React/Vite · :5173)                     │
│  ┌────────────┐ ┌──────────────────────────────┐ │
│  │ Sidebar    │ │ Dashboard                    │ │
│  │  Dashboard │ │  ┌─────────────────────────┐ │ │
│  │  Gmail     │ │  │ AI Executive Briefing   │ │ │
│  │  Calendar  │ │  │ (Markdown report card)  │ │ │
│  │  Drive     │ │  └─────────────────────────┘ │ │
│  │  Tasks     │ │  ┌───┐ ┌───┐ ┌───┐          │ │
│  │  Contacts  │ │  │Mtg│ │Tsk│ │Sts│ Stats    │ │
│  │  Chat      │ │  └───┘ └───┘ └───┘          │ │
│  │  Settings  │ │  Module Cards → drill down   │ │
│  │  🌙/☀️    │ └──────────────────────────────┘ │
│  └────────────┘                                  │
└──────────────────┬───────────────────────────────┘
                   │ HTTP (api.js → 127.0.0.1:5000)
┌──────────────────▼───────────────────────────────┐
│  Server (Express · :5000)                        │
│  ┌──────────────┐  ┌──────────────────────────┐  │
│  │ googleAuth.js│  │ index.js                 │  │
│  │  OAuth2 flow │  │  /api/overview → briefing│  │
│  │  Token mgmt  │  │  /api/gmail, calendar,   │  │
│  │  536 lines   │  │   drive, tasks, contacts, │  │
│  │  29 scopes   │  │   chat, forms, analytics │  │
│  │              │  │  /api/chat → AI + tools   │  │
│  └──────────────┘  └──────────────────────────┘  │
│           │                    │                  │
│     Google APIs          LLM (Anthropic)         │
└──────────────────────────────────────────────────┘
```

---

## Second Use Case: Sales Team Pipeline Review

The same skill applies to **Sales/BD teams at IndiaMART** without modification:

| Primary Use Case | Second Use Case |
|------------------|-----------------|
| Employee morning briefing | Sales team pipeline review |
| Emails → urgent client requests | Emails → buyer inquiries needing response |
| Calendar → internal meetings | Calendar → client demos and follow-ups |
| Tasks → personal to-dos | Tasks → deal stage action items |
| Drive → project docs | Drive → proposals and contracts |
| Chat → team threads | Chat → sales channel updates |

A sales manager asks: *"What buyer inquiries need follow-up today?"*
→ Same `GET /api/overview` pipeline, same AI synthesis, same report format.
The skill is **workflow-agnostic** — it triages any Google Workspace context.

See `references/second-workflow-walkthrough.md` for the full worked example.

---

## Trigger Prompt Tests

### ✅ Positive Trigger 1
**Prompt:** "Generate my daily briefing"
**Expected:** Skill activates, fetches workspace data, returns structured Markdown report.

### ✅ Positive Trigger 2
**Prompt:** "What should I focus on today? I have back-to-back meetings."
**Expected:** Skill activates, prioritizes meetings and overdue tasks in the report.

### ❌ Negative Trigger
**Prompt:** "Send an email to Rahul about the project deadline"
**Expected:** Skill does NOT activate. This is a write/compose action, not intelligence gathering.

---

## File Reference

| File | Purpose |
|------|---------|
| `skill/SKILL.md` | This file — skill metadata and workflow instructions |
| `skill/scripts/health_check.js` | Diagnostic: validates credentials, server, auth status |
| `skill/scripts/generate_briefing.js` | Standalone briefing generator (CLI, no browser needed) |
| `skill/references/quality-rules.md` | Code standards, security rules, theme variable tables |
| `skill/references/api-reference.md` | Full API endpoint documentation |
| `skill/references/second-workflow-walkthrough.md` | Sales pipeline reuse case |
| `skill/assets/briefing-template.md` | Report scaffold the AI fills in |
| `skill/assets/view-template.jsx` | Reusable React module component template |
