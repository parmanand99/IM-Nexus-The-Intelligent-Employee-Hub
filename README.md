# 🛡️ IM-Nexus: The Intelligent Employee Hub

**IM-Nexus** is a professional-grade workspace intelligence platform designed to eliminate "context-switching fatigue." By aggregating signals from across the Google Workspace ecosystem (Gmail, Calendar, Drive, Tasks, Contacts, and Chat), it uses AI to synthesize information into actionable daily briefings and provides a unified conversational interface for employee productivity.

---

## 🚀 Key Features

### 1. AI Daily Briefing (The "Nexus" View)
- **Automatic Synthesis**: Analyzes unread emails, upcoming meetings, and overdue tasks.
- **Urgency Ranking**: Identifies high-priority items that require immediate attention.
- **One-Glance Stats**: Quick counters for meetings (next 48h) and pending tasks.

### 2. Unified Workspace Navigation
- **Gmail**: View recent threads with AI-powered summarization.
- **Calendar**: Manage meetings, view attendee details, and join Google Meet links directly.
- **Drive**: Search files and view recent document activity.
- **Tasks**: Centralized view of all Google Task lists.
- **Contacts**: Search and access employee contact information.
- **Chat Spaces**: Monitor and summarize thread activity (Workspace accounts only).

### 3. Conversational AI Agent
- **Tool-Aware Chat**: The AI can actively search your emails, create calendar events, and update task lists on your behalf.
- **Natural Language Workspace Control**: e.g., "Schedule a meeting with Manoj for tomorrow 11am" or "Summarize the latest emails from Rizwan."

### 4. Premium UI/UX
- **Glassmorphic Design**: Modern, sleek interface using transparency and blur effects.
- **Dynamic Theming**: Seamless transition between sophisticated Dark Mode and high-contrast Light Mode.

---

## 🛠️ Installation & Setup (New System)

Follow these steps to deploy IM-Nexus on a fresh environment.

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **NPM** (v9 or higher)
- **Google Cloud Project**: An active project with Gmail, Calendar, Tasks, Drive, and People APIs enabled.

### 2. Clone and Install
```bash
# Clone the repository
git clone <repository-url>
cd bl-alerting

# Install Backend Dependencies
cd server
npm install

# Install Frontend Dependencies
cd ../client
npm install
```

### 3. Configuration (Critical)
1. **Google Credentials**:
   - Place your `credentials.json` file (OAuth 2.0 Client ID) inside the `server/` directory.
   - **Note**: Ensure `http://localhost:5173` is added as a valid redirect URI in your Google Cloud Console.
2. **Environment Variables**:
   - Create a `.env` file in the `server/` directory:
     ```env
     ANTHROPIC_API_KEY=your_llm_gateway_key
     PORT=5000
     ```

---

## 🚦 Running the Application

You need to run both the backend server and the frontend development server.

### Step 1: Start the Backend
```bash
cd server
node index.js
```
*The server will start on `http://localhost:5000`.*

### Step 2: Start the Frontend
```bash
cd client
npm run dev
```
*The UI will be accessible at `http://localhost:5173`.*

---

## 🧭 Navigation & Usage Guide

### Signing In
1. Open the app and click **"Sign in with Google"**.
2. Complete the OAuth flow. This grants the app read/write access to your workspace (limited to the scopes defined in the project).
3. Once connected, you will be redirected to the **Dashboard**.

### Exploring the Dashboard
- **Top Right**: Toggle between Light/Dark mode using the theme icon.
- **Center Card**: Read your **AI Daily Briefing**. Click the "Refresh" button in individual modules to pull the latest data.
- **Sidebar**: Navigate between different workspace modules.

### Using the Chat Window
1. Navigate to **Chat** from the sidebar.
2. Type requests like:
   - *"What's on my schedule for today?"*
   - *"Search my emails for 'API Key'."*
   - *"Add a task to live the new email template for 10% users."*
3. The AI will use "Tools" to fetch real-time data or perform actions. Watch the terminal logs to see the tool calls in action!

### Setting AI Personality
- Navigate to **AI Personality** in the sidebar.
- Enter custom instructions (e.g., "Be very concise and focus on technical details").
- Save preferences; these will influence all future briefings and chat responses.

---

## ⚠️ Current Limitations
- **Google Chat API**: This section is currently non-functional for personal `@gmail.com` accounts due to Google policy. It requires a Workspace (Enterprise/Education) account.
- **Credentials**: For a demo `credentials.json`, please contact the development team.

---

## 👨‍💻 Developed For
**IndiaMART AI Hackathon 2026**  
*Empowering employees through Intelligent Workspace Integration.*
