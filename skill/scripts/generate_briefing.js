#!/usr/bin/env node

/**
 * generate_briefing.js
 * Standalone CLI script that generates an AI executive briefing
 * without requiring the browser or frontend.
 *
 * Usage: node scripts/generate_briefing.js
 * Output: Structured Markdown briefing printed to stdout
 *
 * This script:
 * 1. Loads Google OAuth credentials
 * 2. Fetches Gmail, Calendar, Tasks data in parallel
 * 3. Sends the raw data to the AI for synthesis
 * 4. Outputs a structured Markdown report
 */

const path = require('path');
const http = require('http');

const SERVER_URL = 'http://127.0.0.1:5000';

function httpGet(urlPath) {
  return new Promise((resolve, reject) => {
    http.get(`${SERVER_URL}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ error: 'Invalid JSON response' }); }
      });
    }).on('error', reject);
  });
}

function httpPost(urlPath, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const req = http.request(`${SERVER_URL}${urlPath}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({ error: 'Invalid JSON response' }); }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     IM-Nexus · AI Executive Briefing Generator  ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log(`  Generated: ${timestamp}`);
  console.log('');

  // Step 1: Check server & auth
  const status = await httpGet('/api/auth/status').catch(() => null);
  if (!status || !status.authenticated) {
    console.error('❌ Not authenticated. Please sign in via http://localhost:5173 first.');
    process.exit(1);
  }

  console.log(`  👤 User: ${status.user?.name} (${status.user?.email})`);
  console.log('  ⏳ Fetching workspace data...');
  console.log('');

  // Step 2: Fetch the overview (triggers the AI briefing generation)
  const overview = await httpGet('/api/overview').catch((err) => {
    console.error(`❌ Failed to fetch overview: ${err.message}`);
    process.exit(1);
  });

  if (overview.error) {
    console.error(`❌ Server error: ${overview.error}`);
    process.exit(1);
  }

  // Step 3: Output the report
  console.log('─'.repeat(50));
  console.log('');

  // Stats header
  console.log(`📅 Meetings (next 48h): ${overview.eventCount || 0}`);
  console.log(`✅ Pending Tasks: ${overview.taskCount || 0}`);
  console.log('');
  console.log('─'.repeat(50));
  console.log('');

  // AI Briefing
  if (overview.summary) {
    console.log(overview.summary);
  } else {
    console.log('⚠️  No briefing data available.');
  }

  console.log('');
  console.log('─'.repeat(50));
  console.log(`  ✅ Briefing complete · ${timestamp}`);
  console.log('');
}

main().catch((err) => {
  console.error(`Fatal error: ${err.message}`);
  process.exit(1);
});
