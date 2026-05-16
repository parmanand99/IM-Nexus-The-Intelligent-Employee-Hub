const { google } = require('googleapis');
const path = require('path');
const fs = require('fs').promises;

const TOKEN_PATH = path.join(__dirname, 'token.json');
const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');

// ─── Comprehensive Google Workspace Scopes ───────────────────────────────────
const SCOPES = [
  // Gmail
  'https://www.googleapis.com/auth/gmail.readonly',
  // Calendar
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  // Drive
  'https://www.googleapis.com/auth/drive',
  // Docs
  'https://www.googleapis.com/auth/documents',
  // Sheets
  'https://www.googleapis.com/auth/spreadsheets',
  // Forms (Drive-based)
  'https://www.googleapis.com/auth/forms.responses.readonly',
  'https://www.googleapis.com/auth/forms.body.readonly',
  // Contacts
  'https://www.googleapis.com/auth/contacts.readonly',
  // Tasks
  'https://www.googleapis.com/auth/tasks',
  // Chat
  'https://www.googleapis.com/auth/chat.messages.readonly',
  'https://www.googleapis.com/auth/chat.spaces.readonly',
  // Groups
  'https://www.googleapis.com/auth/admin.directory.group.readonly',
  'https://www.googleapis.com/auth/admin.directory.group.member.readonly',
  // User Info
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email',
  // Analytics (GA4)
  'https://www.googleapis.com/auth/analytics.readonly',
];

// ─── Auth Client ─────────────────────────────────────────────────────────────
async function getOAuth2Client(redirectUri) {
  try {
    const content = await fs.readFile(CREDENTIALS_PATH);
    const keys = JSON.parse(content);
    const web = keys.web || keys.installed;
    if (!web) throw new Error("Invalid credentials format. Expected 'web' or 'installed' key.");
    const { client_secret, client_id, redirect_uris } = web;
    return new google.auth.OAuth2(client_id, client_secret, redirectUri || redirect_uris[0]);
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error("Missing 'server/credentials.json'. Please follow the instructions to download it from Google Cloud Console.");
    }
    throw err;
  }
}

async function getAuthUrl(origin) {
  const redirectUri = origin || 'http://localhost:5173';
  const client = await getOAuth2Client(redirectUri);
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
}

async function saveToken(code, redirectUri) {
  const client = await getOAuth2Client(redirectUri || 'http://localhost:5173');
  const { tokens } = await client.getToken(code);
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
  return tokens;
}

async function getAuthenticatedClient() {
  try {
    const client = await getOAuth2Client();
    const token = await fs.readFile(TOKEN_PATH);
    client.setCredentials(JSON.parse(token));
    return client;
  } catch {
    return null;
  }
}

// ─── User Info ───────────────────────────────────────────────────────────────
async function getUserInfo() {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const oauth2 = google.oauth2({ version: 'v2', auth });
    const res = await oauth2.userinfo.get();
    return res.data;
  } catch {
    return null;
  }
}

// ─── Gmail ───────────────────────────────────────────────────────────────────
async function getGmailMessages(maxResults = 10, query = '') {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const gmail = google.gmail({ version: 'v1', auth });
    const listRes = await gmail.users.messages.list({ userId: 'me', maxResults, q: query });
    if (!listRes.data.messages) return [];

    const messages = [];
    for (const msg of listRes.data.messages) {
      const detail = await gmail.users.messages.get({ userId: 'me', id: msg.id, format: 'metadata', metadataHeaders: ['Subject', 'From', 'Date'] });
      const headers = detail.data.payload?.headers || [];
      const get = (name) => headers.find(h => h.name === name)?.value || '';
      messages.push({
        id: msg.id,
        subject: get('Subject'),
        from: get('From'),
        date: get('Date'),
        snippet: detail.data.snippet,
      });
    }
    return messages;
  } catch (err) {
    console.error('Gmail Error:', err.message);
    return [];
  }
}

// ─── Calendar ────────────────────────────────────────────────────────────────
async function getCalendarEvents(daysAhead = 7) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const calendar = google.calendar({ version: 'v3', auth });
    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + daysAhead);

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return (res.data.items || []).map(e => ({
      id: e.id,
      summary: e.summary || '(No title)',
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      location: e.location || null,
      description: e.description || null,
      attendees: (e.attendees || []).map(a => a.email),
      meetLink: e.hangoutLink || null,
    }));
  } catch (err) {
    console.error('Calendar Error:', err.message);
    return [];
  }
}

async function createCalendarEvent(eventData) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const calendar = google.calendar({ version: 'v3', auth });
    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventData.title,
        description: eventData.description || '',
        start: { dateTime: eventData.start, timeZone: 'Asia/Kolkata' },
        end: { dateTime: eventData.end, timeZone: 'Asia/Kolkata' },
        attendees: (eventData.attendees || []).map(email => ({ email })),
        conferenceData: eventData.addMeet ? {
          createRequest: { requestId: `meet-${Date.now()}`, conferenceSolutionKey: { type: 'hangoutsMeet' } }
        } : undefined,
      },
      conferenceDataVersion: eventData.addMeet ? 1 : 0,
    });
    return res.data;
  } catch (err) {
    console.error('Create Event Error:', err.message);
    return null;
  }
}

// ─── Google Drive ─────────────────────────────────────────────────────────────
async function getDriveFiles(query = '', maxResults = 20) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const drive = google.drive({ version: 'v3', auth });
    const q = query
      ? `name contains '${query}' and trashed = false`
      : `trashed = false`;
    const res = await drive.files.list({
      q,
      pageSize: maxResults,
      fields: 'files(id, name, mimeType, modifiedTime, size, webViewLink, owners)',
      orderBy: 'modifiedTime desc',
    });
    return (res.data.files || []).map(f => ({
      id: f.id,
      name: f.name,
      type: f.mimeType,
      modified: f.modifiedTime,
      size: f.size,
      link: f.webViewLink,
      owner: f.owners?.[0]?.displayName || 'Unknown',
    }));
  } catch (err) {
    console.error('Drive Error:', err.message);
    return [];
  }
}

// ─── Google Docs ──────────────────────────────────────────────────────────────
async function getDocContent(docId) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const docs = google.docs({ version: 'v1', auth });
    const res = await docs.documents.get({ documentId: docId });
    const doc = res.data;
    // Extract plain text from structural elements
    let text = '';
    (doc.body?.content || []).forEach(elem => {
      (elem.paragraph?.elements || []).forEach(pe => {
        text += pe.textRun?.content || '';
      });
    });
    return { title: doc.title, text: text.slice(0, 5000) }; // cap at 5000 chars for AI
  } catch (err) {
    console.error('Docs Error:', err.message);
    return null;
  }
}

async function createDoc(title, content) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const docs = google.docs({ version: 'v1', auth });
    
    // Create empty doc
    const createRes = await docs.documents.create({
      requestBody: { title }
    });
    
    const documentId = createRes.data.documentId;
    
    // Insert content
    if (content) {
      await docs.documents.batchUpdate({
        documentId,
        requestBody: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: content
              }
            }
          ]
        }
      });
    }
    
    return createRes.data;
  } catch (err) {
    console.error('Create Doc Error:', err.message);
    return null;
  }
}

async function updateDoc(docId, content) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const docs = google.docs({ version: 'v1', auth });

    // Append to end
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [
          {
            insertText: {
              endOfSegmentLocation: {},
              text: `\n\n${content}`
            }
          }
        ]
      }
    });
    return { status: 'success' };
  } catch (err) {
    console.error('Update Doc Error:', err.message);
    return null;
  }
}

// ─── Google Sheets ────────────────────────────────────────────────────────────
async function getSheetContent(spreadsheetId, range = 'Sheet1!A1:Z50') {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const sheets = google.sheets({ version: 'v4', auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    return {
      title: meta.data.properties?.title,
      values: res.data.values || [],
    };
  } catch (err) {
    console.error('Sheets Error:', err.message);
    return null;
  }
}

// ─── Google Contacts ──────────────────────────────────────────────────────────
async function getContacts(query = '') {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const people = google.people({ version: 'v1', auth });
    let contacts = [];

    if (query) {
      const res = await people.people.searchContacts({
        query,
        readMask: 'names,emailAddresses,phoneNumbers,organizations,photos',
      });
      contacts = res.data.results || [];
      return contacts.map(r => formatContact(r.person));
    } else {
      const res = await people.people.connections.list({
        resourceName: 'people/me',
        pageSize: 30,
        personFields: 'names,emailAddresses,phoneNumbers,organizations,photos',
      });
      return (res.data.connections || []).map(formatContact);
    }
  } catch (err) {
    console.error('Contacts Error:', err.message);
    return [];
  }
}

function formatContact(person) {
  return {
    name: person?.names?.[0]?.displayName || 'Unknown',
    email: person?.emailAddresses?.[0]?.value || null,
    phone: person?.phoneNumbers?.[0]?.value || null,
    org: person?.organizations?.[0]?.name || null,
    photo: person?.photos?.[0]?.url || null,
  };
}

// ─── Google Tasks ─────────────────────────────────────────────────────────────
async function getTasks() {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const tasksApi = google.tasks({ version: 'v1', auth });
    const listsRes = await tasksApi.tasklists.list({ maxResults: 5 });
    const taskLists = listsRes.data.items || [];

    const allTasks = [];
    for (const list of taskLists) {
      const tasksRes = await tasksApi.tasks.list({
        tasklist: list.id,
        showCompleted: false,
        maxResults: 20,
      });
      (tasksRes.data.items || []).forEach(t => {
        allTasks.push({
          id: t.id,
          title: t.title,
          due: t.due || null,
          status: t.status,
          notes: t.notes || null,
          listName: list.title,
        });
      });
    }
    return allTasks;
  } catch (err) {
    console.error('Tasks Error:', err.message);
    return [];
  }
}

async function createTask(title, notes, due) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const tasksApi = google.tasks({ version: 'v1', auth });
    
    // Get default task list
    const listsRes = await tasksApi.tasklists.list({ maxResults: 1 });
    const tasklistId = listsRes.data.items[0].id;
    
    const res = await tasksApi.tasks.insert({
      tasklist: tasklistId,
      requestBody: {
        title,
        notes,
        due: due ? new Date(due).toISOString() : undefined
      }
    });
    
    return res.data;
  } catch (err) {
    console.error('Create Task Error:', err.message);
    return null;
  }
}

// ─── Google Chat ─────────────────────────────────────────────────────────────
async function getChatSpaces() {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const chat = google.chat({ version: 'v1', auth });
    const res = await chat.spaces.list({ pageSize: 20 });
    return (res.data.spaces || []).map(s => ({
      name: s.name,
      displayName: s.displayName || '(Direct Message)',
      type: s.type,
      spaceType: s.spaceType,
    }));
  } catch (err) {
    console.error('Chat Spaces Error:', err.message);
    return [];
  }
}

async function getChatMessages(spaceName, pageSize = 20) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const chat = google.chat({ version: 'v1', auth });
    const res = await chat.spaces.messages.list({ parent: spaceName, pageSize });
    return (res.data.messages || []).map(m => ({
      sender: m.sender?.displayName || 'Unknown',
      text: m.text || m.formattedText || '',
      createTime: m.createTime,
    }));
  } catch (err) {
    console.error('Chat Messages Error:', err.message);
    return [];
  }
}

// ─── Google Forms ─────────────────────────────────────────────────────────────
async function getFormResponses(formId) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const forms = google.forms({ version: 'v1', auth });
    const [formMeta, responses] = await Promise.all([
      forms.forms.get({ formId }),
      forms.forms.responses.list({ formId }),
    ]);
    return {
      title: formMeta.data.info?.title,
      responseCount: formMeta.data.responderUri ? responses.data.responses?.length || 0 : 0,
      responses: (responses.data.responses || []).slice(0, 10),
    };
  } catch (err) {
    console.error('Forms Error:', err.message);
    return null;
  }
}

// ─── Google Analytics (GA4) ───────────────────────────────────────────────────
async function getAnalyticsSummary(propertyId) {
  try {
    const auth = await getAuthenticatedClient();
    if (!auth) return null;
    const analyticsData = google.analyticsdata({ version: 'v1beta', auth });
    const res = await analyticsData.properties.runReport({
      property: `properties/${propertyId}`,
      requestBody: {
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'bounceRate' },
          { name: 'averageSessionDuration' },
        ],
      },
    });
    return res.data;
  } catch (err) {
    console.error('Analytics Error:', err.message);
    return null;
  }
}

async function logout() {
  try {
    await fs.unlink(TOKEN_PATH);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

module.exports = {
  getAuthUrl,
  saveToken,
  getAuthenticatedClient,
  getUserInfo,
  getGmailMessages,
  getCalendarEvents,
  createCalendarEvent,
  getDriveFiles,
  getDocContent,
  getSheetContent,
  getContacts,
  getTasks,
  createTask,
  getChatSpaces,
  getChatMessages,
  getFormResponses,
  getAnalyticsSummary,
  createDoc,
  updateDoc,
  logout,
};
