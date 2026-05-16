#!/usr/bin/env node

/**
 * health_check.js
 * Quick diagnostic script for IM-Nexus.
 * Checks: server reachability, auth status, credentials file, token file, env vars.
 *
 * Usage: node scripts/health_check.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const SERVER_URL = 'http://127.0.0.1:5000';
const SERVER_DIR = path.join(__dirname, '..', '..', 'server');

const results = [];

function log(icon, label, detail) {
  const line = `${icon}  ${label}: ${detail}`;
  results.push(line);
  console.log(line);
}

async function checkFile(name, filePath, required) {
  try {
    await fs.promises.access(filePath);
    const stat = await fs.promises.stat(filePath);
    log('✅', name, `Found (${stat.size} bytes)`);
    return true;
  } catch {
    log(required ? '❌' : '⚠️', name, 'Not found');
    return false;
  }
}

function httpGet(urlPath) {
  return new Promise((resolve) => {
    const req = http.get(`${SERVER_URL}${urlPath}`, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', () => resolve(null));
    req.setTimeout(3000, () => { req.destroy(); resolve(null); });
  });
}

async function main() {
  console.log('\n🔍 IM-Nexus Health Check\n' + '─'.repeat(40));

  // 1. Check credentials.json
  await checkFile('credentials.json', path.join(SERVER_DIR, 'credentials.json'), true);

  // 2. Check token.json
  await checkFile('token.json', path.join(SERVER_DIR, 'token.json'), false);

  // 3. Check .env
  const hasEnv = await checkFile('.env', path.join(SERVER_DIR, '.env'), true);
  if (hasEnv) {
    const envContent = await fs.promises.readFile(path.join(SERVER_DIR, '.env'), 'utf8');
    const hasKey = envContent.includes('ANTHROPIC_API_KEY') || envContent.includes('OPENAI_API_KEY');
    log(hasKey ? '✅' : '⚠️', 'API Key in .env', hasKey ? 'Present' : 'No AI API key found');
  }

  // 4. Check server reachability
  const serverRes = await httpGet('/api/auth/status');
  if (serverRes) {
    log('✅', 'Server', `Reachable (HTTP ${serverRes.status})`);
    try {
      const parsed = JSON.parse(serverRes.body);
      log(parsed.authenticated ? '✅' : '⚠️', 'Auth Status',
        parsed.authenticated ? `Logged in as ${parsed.user?.name}` : 'Not authenticated');
    } catch {
      log('⚠️', 'Auth Status', 'Could not parse response');
    }
  } else {
    log('❌', 'Server', `Not reachable at ${SERVER_URL}. Is it running?`);
  }

  // 5. Check auth URL endpoint
  const authRes = await httpGet('/api/auth/url');
  if (authRes) {
    try {
      const parsed = JSON.parse(authRes.body);
      if (parsed.url) {
        log('✅', 'OAuth URL', 'Generated successfully');
      } else if (parsed.error) {
        log('❌', 'OAuth URL', parsed.error);
      }
    } catch {
      log('⚠️', 'OAuth URL', 'Unexpected response');
    }
  }

  console.log('\n' + '─'.repeat(40));
  const failures = results.filter(r => r.startsWith('❌')).length;
  console.log(failures === 0
    ? '🎉 All checks passed! IM-Nexus is healthy.'
    : `⚠️  ${failures} issue(s) found. See above for details.`
  );
  console.log('');
}

main();
