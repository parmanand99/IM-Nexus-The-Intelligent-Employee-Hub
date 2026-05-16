const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const OpenAI = require('openai');
const fs = require('fs').promises;
const path = require('path');
const g = require('./googleAuth');

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://imllm.intermesh.net/v1',
});

const app = express();
const PORT = process.env.PORT || 5000;
const PREFS_PATH = './user_preferences.json';

// Helper to get user prefs
async function getUserPrefs(email) {
  try {
    const data = await fs.readFile(PREFS_PATH, 'utf8');
    const prefs = JSON.parse(data);
    return prefs[email] || {};
  } catch {
    return {};
  }
}

// Helper to save user prefs
async function saveUserPrefs(email, newPrefs) {
  try {
    let prefs = {};
    try {
      const data = await fs.readFile(PREFS_PATH, 'utf8');
      prefs = JSON.parse(data);
    } catch { }
    prefs[email] = { ...(prefs[email] || {}), ...newPrefs };
    await fs.writeFile(PREFS_PATH, JSON.stringify(prefs, null, 2));
  } catch (err) {
    console.error('Save Prefs Error:', err);
  }
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'), (err) => {
    if (err) res.send('<h1>✅ IM-Nexus Server is running</h1><p>Frontend not built yet. Run npm run build in client folder.</p>');
  });
});

// Serve static files from Vite build
app.use(express.static(path.join(__dirname, '../client/dist')));

// ─── LLM Helper ──────────────────────────────────────────────────────────────
async function callLLM(systemPrompt, userContent, maxTokens = 1024) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error('❌ LLM ERROR:', err.message);
    return null;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
app.get('/api/auth/url', async (req, res) => {
  try {
    const url = await g.getAuthUrl(req.query.origin);
    res.json({ url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/callback', async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    if (!code) return res.status(400).send('No code provided');
    await g.saveToken(code, redirectUri);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/status', async (req, res) => {
  const client = await g.getAuthenticatedClient();
  const user = client ? await g.getUserInfo() : null;
  res.json({ authenticated: !!client, user });
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    await g.logout();
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/preferences', async (req, res) => {
  try {
    const user = await g.getUserInfo();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    const prefs = await getUserPrefs(user.email);
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/preferences', async (req, res) => {
  try {
    const user = await g.getUserInfo();
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    await saveUserPrefs(user.email, req.body);
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Dashboard Overview ───────────────────────────────────────────────────────
app.get('/api/overview', async (req, res) => {
  try {
    const [emails, events, tasks, user] = await Promise.all([
      g.getGmailMessages(15, 'newer_than:1d'),
      g.getCalendarEvents(2),
      g.getTasks(),
      g.getUserInfo(),
    ]);

    const rawData = `
User: ${user?.name} (${user?.email})
Emails (Last 24h): ${JSON.stringify(emails)}
Events (Next 48h): ${JSON.stringify(events)}
Pending Tasks: ${JSON.stringify(tasks?.slice(0, 15))}
    `;

    const prefs = await getUserPrefs(user.email);
    const customInstructions = prefs.instructions || '';

    const aiResponse = await callLLM(
      `You are a personal workspace assistant. ${customInstructions}
      Generate a comprehensive daily briefing. 
      Start with a "🎯 Key Focus Points" section for the most urgent/important items.
      Then provide a detailed breakdown of emails, meetings, and tasks.
      Use clear markdown headings, bold text, and bullet points. Be very specific with names and times.`,
      rawData
    );

    res.json({ summary: aiResponse, user, eventCount: events?.length || 0, taskCount: tasks?.length || 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Gmail ────────────────────────────────────────────────────────────────────
app.get('/api/gmail', async (req, res) => {
  try {
    const emails = await g.getGmailMessages(parseInt(req.query.limit) || 15);
    res.json({ emails: emails || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gmail/summarize', async (req, res) => {
  try {
    const emails = await g.getGmailMessages(10);
    if (!emails?.length) return res.json({ summary: 'No emails to summarize.' });
    const aiResponse = await callLLM(
      'Summarize these emails in a structured way: list sender, subject, and a one-line key point for each.',
      JSON.stringify(emails), 1500
    );
    res.json({ summary: aiResponse });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Calendar ─────────────────────────────────────────────────────────────────
app.get('/api/calendar', async (req, res) => {
  try {
    const events = await g.getCalendarEvents(parseInt(req.query.days) || 7);
    res.json({ events: events || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/calendar/create', async (req, res) => {
  try {
    const event = await g.createCalendarEvent(req.body);
    if (!event) return res.status(500).json({ error: 'Failed to create event' });
    res.json({ event, meetLink: event.hangoutLink || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Drive ────────────────────────────────────────────────────────────────────
app.get('/api/drive', async (req, res) => {
  try {
    const files = await g.getDriveFiles(req.query.q || '', parseInt(req.query.limit) || 20);
    res.json({ files: files || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Docs ──────────────────────────────────────────────────────────────────────
app.get('/api/docs/:id', async (req, res) => {
  try {
    const doc = await g.getDocContent(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Doc not found' });

    const summary = await callLLM(
      'Summarize this Google Doc concisely. Mention key points, decisions, and action items.',
      `Title: ${doc.title}\n\n${doc.text}`
    );
    res.json({ ...doc, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/docs/create', async (req, res) => {
  try {
    const { title, content } = req.body;
    const doc = await g.createDoc(title, content);
    if (!doc) return res.status(500).json({ error: 'Failed to create doc' });
    res.json({ doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Sheets ───────────────────────────────────────────────────────────────────
app.get('/api/sheets/:id', async (req, res) => {
  try {
    const sheet = await g.getSheetContent(req.params.id, req.query.range);
    if (!sheet) return res.status(404).json({ error: 'Sheet not found' });

    const summary = await callLLM(
      'Analyze this spreadsheet data and provide key insights, trends, and notable values.',
      `Title: ${sheet.title}\nData:\n${sheet.values.map(r => r.join('\t')).join('\n')}`
    );
    res.json({ ...sheet, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Contacts ─────────────────────────────────────────────────────────────────
app.get('/api/contacts', async (req, res) => {
  try {
    const contacts = await g.getContacts(req.query.q || '');
    res.json({ contacts: contacts || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Tasks ────────────────────────────────────────────────────────────────────
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await g.getTasks();
    res.json({ tasks: tasks || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tasks/create', async (req, res) => {
  try {
    const { title, notes, due } = req.body;
    const task = await g.createTask(title, notes, due);
    if (!task) return res.status(500).json({ error: 'Failed to create task' });
    res.json({ task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Chat ──────────────────────────────────────────────────────────────────────
app.get('/api/chat/spaces', async (req, res) => {
  try {
    const spaces = await g.getChatSpaces();
    res.json({ spaces: spaces || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chat/spaces/:name/messages', async (req, res) => {
  try {
    const spaceName = decodeURIComponent(req.params.name);
    const messages = await g.getChatMessages(spaceName);
    if (!messages) return res.json({ messages: [] });

    const summary = await callLLM(
      'Summarize these Google Chat messages into key discussion points and any decisions or action items.',
      JSON.stringify(messages)
    );
    res.json({ messages, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Forms ────────────────────────────────────────────────────────────────────
app.get('/api/forms/:id', async (req, res) => {
  try {
    const data = await g.getFormResponses(req.params.id);
    if (!data) return res.status(404).json({ error: 'Form not found' });

    const summary = await callLLM(
      'Analyze these Google Form responses and provide a summary with key insights and patterns.',
      JSON.stringify(data)
    );
    res.json({ ...data, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Analytics ────────────────────────────────────────────────────────────────
app.get('/api/analytics/:propertyId', async (req, res) => {
  try {
    const data = await g.getAnalyticsSummary(req.params.propertyId);
    if (!data) return res.status(404).json({ error: 'Analytics data not found' });

    const summary = await callLLM(
      'Analyze this Google Analytics GA4 data. Provide a performance summary with trends, top metrics, and recommendations.',
      JSON.stringify(data), 1500
    );
    res.json({ data, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Universal AI Chat with Function Calling ──────────────────────────────────
const tools = [
  {
    type: 'function',
    function: {
      name: 'search_emails',
      description: 'Search across Gmail messages using a query string.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Gmail search query (e.g. from:boss "important")' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_files',
      description: 'Search for files in Google Drive by name or content.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'Search term for file name or content' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_calendar',
      description: 'Get upcoming calendar events.',
      parameters: {
        type: 'object',
        properties: { days: { type: 'integer', description: 'Number of days to look ahead' } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_meeting',
      description: 'Schedule a new meeting on Google Calendar.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          start: { type: 'string', description: 'ISO format datetime' },
          end: { type: 'string', description: 'ISO format datetime' },
          attendees: { type: 'array', items: { type: 'string' }, description: 'List of emails' },
          addMeet: { type: 'boolean' }
        },
        required: ['title', 'start', 'end'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task in Google Tasks.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          notes: { type: 'string' },
          due: { type: 'string', description: 'ISO date' }
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_note',
      description: 'Create a new Google Doc (useful for saving notes).',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string' }
        },
        required: ['title', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_contacts',
      description: 'Search or list Google Contacts.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
      },
    },
  }
];

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) return res.status(400).json({ error: 'Empty message' });

    const user = await g.getUserInfo();
    const prefs = await getUserPrefs(user?.email);
    const customInstructions = prefs.instructions || '';

    const systemPrompt = `
You are IM-Nexus — a powerful Google Workspace assistant.
${customInstructions}

Current Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
User: ${user?.name} (${user?.email})

You have access to multiple tools to search, create, update, and summarize data across Gmail, Drive, Docs, Sheets, Calendar, Contacts, Tasks, and more.

**When the user asks for any information, always try to use the appropriate tool first.**
Examples of user queries you should handle:
- "Find all emails from @boss about the Q2 report."
- "Show me the latest version of the project proposal document."
- "Create a new task: 'Prepare slides' due tomorrow."
- "Schedule a meeting with the team on Friday at 3pm."
- "Summarize the Google Doc titled 'Marketing Plan' and list the key action items."
- "Search Drive for files containing the phrase 'budget 2026'."
- "Add a note to the Google Doc 'Sprint Retrospective' with today's observations."
- "List my contacts who have a @example.com email."
- "Give me analytics insights for property ID 123456."

**Always respond in markdown and include actionable links when possible.**
`;

    let messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10).map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text })),
      { role: 'user', content: message }
    ];

    // AI thinking/calling loop
    let response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      tools,
      tool_choice: 'auto',
    });

    let assistantMessage = response.choices[0].message;

    if (assistantMessage.tool_calls) {
      messages.push(assistantMessage);

      for (const toolCall of assistantMessage.tool_calls) {
        const name = toolCall.function.name;
        const args = JSON.parse(toolCall.function.arguments);
        let result;

        console.log(`🛠️ TOOL CALL: ${name}`, args);

        if (name === 'search_emails') result = await g.getGmailMessages(10, args.query);
        else if (name === 'search_files') result = await g.getDriveFiles(args.query, 10);
        else if (name === 'get_calendar') result = await g.getCalendarEvents(args.days || 7);
        else if (name === 'create_meeting') result = await g.createCalendarEvent(args);
        else if (name === 'create_task') result = await g.createTask(args.title, args.notes, args.due);
        else if (name === 'create_note') result = await g.createDoc(args.title, args.content);
        else if (name === 'get_contacts') result = await g.getContacts(args.query || '');
        else if (name === 'get_file_content') result = await g.getDocContent(args.fileId);
        else if (name === 'update_note') result = await g.updateDoc(args.fileId, args.content);


        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          name: name,
          content: JSON.stringify(result || { status: 'success' }),
        });
      }

      // Final response after tool execution
      response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
      });
      res.json({ response: response.choices[0].message.content });
    } else {
      res.json({ response: assistantMessage.content });
    }

  } catch (err) {
    console.error('❌ CHAT ERROR:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Meeting Debrief ───────────────────────────────────────────────────────────
app.post('/api/debrief', async (req, res) => {
  try {
    const { transcript } = req.body;
    const aiResponse = await callLLM(
      'Analyze this meeting transcript. Return valid JSON: {"summary": "...", "decisions": ["..."], "nextSteps": ["..."], "participants": ["..."]}',
      transcript, 1500
    );
    if (aiResponse) {
      const json = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      return res.json(JSON.parse(json));
    }
    res.status(500).json({ error: 'AI did not respond' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('🔥 SERVER ERROR:', err);
  res.status(500).json({ error: err.message });
});

// Catch-all for React Routing
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'), (err) => {
    if (err) res.status(404).send('Not found');
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ IM-Nexus Server running on http://127.0.0.1:${PORT}`);
});
