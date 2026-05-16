# Second Workflow: Sales Team Pipeline Review

This document demonstrates how the **same IM-Nexus skill** solves a completely
different IndiaMART workflow without any code modification.

---

## The Problem

IndiaMART's sales and business development teams spend **~30 minutes each morning**
manually checking:
- Gmail for new buyer inquiries and supplier responses
- Calendar for scheduled client demos and follow-up calls
- Tasks for deal-stage action items (send proposal, schedule demo, close deal)
- Drive for the latest versions of proposals and contracts
- Chat for updates from sales channels

This is identical to the general employee triage problem — just with different
domain context.

---

## How IM-Nexus Solves It (Zero Modifications)

### Same Skill, Different Context

| Skill Step | Employee Briefing | Sales Pipeline Review |
|------------|-------------------|----------------------|
| **Step 2: Gather Signals** | Fetch emails, events, tasks | Fetch emails, events, tasks |
| **Step 3: AI Synthesis** | "Summarize my day" | "What buyer inquiries need follow-up?" |
| **Step 4: Report** | Morning briefing | Pipeline status report |

The AI adapts its output automatically based on the **content** of the workspace
data — not based on any hardcoded business logic.

### Example: Sales Manager Morning

**User prompt:** "What should I focus on today?"

**IM-Nexus fetches:**
- 📧 3 new buyer inquiries from gmail (from: leads@indiamart.com)
- 📅 2 client demos scheduled at 11am and 3pm
- ✅ 1 overdue task: "Send revised proposal to ABC Corp"
- 📁 Latest proposal doc modified yesterday in Drive

**AI generates:**
```markdown
## 🎯 Key Focus Points

1. **Send revised proposal to ABC Corp** — Overdue by 2 days.
   The latest version is in Drive (modified yesterday). · *15 min*
2. **Prepare for 11am demo with XYZ Ltd** — Review their
   inquiry email from Tuesday. · *20 min*
3. **Respond to 3 new buyer inquiries** — All received in
   the last 24h, none replied to yet. · *30 min*
```

### Why This Works Without Modification

1. **No hardcoded roles.** The skill doesn't know if you're an engineer, a sales
   rep, or a support agent. It reads your actual workspace data.
2. **AI-driven context.** The LLM understands domain context from email subjects
   like "buyer inquiry", "proposal", "demo schedule" — no rules engine needed.
3. **Same API endpoints.** `GET /api/overview` works identically for any user.
4. **Custom AI instructions.** A sales manager can set their AI personality to:
   *"Prioritize buyer inquiries and deal-stage tasks. Flag any demo in the next
   4 hours."* — via the Settings page.

---

## Broader Reuse Potential

| IM Team | How They'd Use IM-Nexus |
|---------|------------------------|
| **Engineering** | Sprint tasks, code review emails, standup prep |
| **Sales/BD** | Buyer inquiries, demo prep, proposal tracking |
| **Customer Support** | Ticket escalation emails, SLA deadlines |
| **HR** | Interview scheduling, onboarding task tracking |
| **Marketing** | Campaign docs, analytics reports, content calendar |
| **Finance** | Invoice emails, approval tasks, budget spreadsheets |

All use the **same skill**, the **same API**, the **same briefing pipeline**.
The AI handles the domain differentiation.

---

## Portability Statement

This skill works as-is in:
- ✅ **Claude Code** — drop the `skill/` folder into `.claude/skills/`
- ✅ **Claude UI** — upload via Customize → Skills → +
- ✅ **Cursor / VS Code Copilot** — recognized as an Agent Skill
- ✅ **CLI** — run `node skill/scripts/generate_briefing.js` directly
