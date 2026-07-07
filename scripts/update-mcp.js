#!/usr/bin/env node

/**
 * scripts/update-mcp.js
 *
 * Zero-dependency updater for the innfo-mcp server.
 * Compares local version with remote version on GitHub main branch
 * and downloads the precompiled bundle if an update is available.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const REMOTE_PKG_URL = 'https://raw.githubusercontent.com/innV0/cogNNitive/main/packages/innfo-mcp/package.json';
const REMOTE_BUNDLE_URL = 'https://raw.githubusercontent.com/innV0/cogNNitive/main/packages/innfo-mcp/bin/innfo-mcp.bundle.js';

const ROOT_DIR = path.resolve(__dirname, '..');
const STATE_DIR = path.join(ROOT_DIR, '.innv0');
const VERSION_FILE = path.join(STATE_DIR, 'mcp-version.json');
const BIN_DIR = path.join(ROOT_DIR, 'scripts', 'bin');
const BUNDLE_FILE = path.join(BIN_DIR, 'innfo-mcp.bundle.js');

/**
 * Perform HTTPS GET request returning response body as string
 */
function fetchString(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'iNNv0-Skills-Updater' } }, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

/**
 * Downloads a file to a local destination path
 */
function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, { headers: { 'User-Agent': 'iNNv0-Skills-Updater' } }, (res) => {
      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`Failed to download ${url}, status: ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

/**
 * Compare two semantic version strings (simple parsing)
 * Returns true if remote is newer than local
 */
function isNewerVersion(local, remote) {
  if (!local) return true;
  
  const localParts = local.split('.').map(Number);
  const remoteParts = remote.split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    const l = localParts[i] || 0;
    const r = remoteParts[i] || 0;
    if (r > l) return true;
    if (l > r) return false;
  }
  return false;
}

async function main() {
  console.log('[MCP Updater] Checking for updates...');
  
  // Ensure directories exist
  if (!fs.existsSync(STATE_DIR)) {
    fs.mkdirSync(STATE_DIR, { recursive: true });
  }
  if (!fs.existsSync(BIN_DIR)) {
    fs.mkdirSync(BIN_DIR, { recursive: true });
  }

  // Load local version info
  let localVersion = null;
  if (fs.existsSync(VERSION_FILE) && fs.existsSync(BUNDLE_FILE)) {
    try {
      const cache = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf-8'));
      localVersion = cache.version;
      console.log(`[MCP Updater] Local version: ${localVersion}`);
    } catch (e) {
      console.warn('[MCP Updater] Failed to parse local version cache, forcing update');
    }
  } else {
    console.log('[MCP Updater] No local bundle found, forcing initial download');
  }

  try {
    // Fetch remote package.json
    const remotePkgStr = await fetchString(REMOTE_PKG_URL);
    const remotePkg = JSON.parse(remotePkgStr);
    const remoteVersion = remotePkg.version;
    console.log(`[MCP Updater] Remote version: ${remoteVersion}`);

    if (isNewerVersion(localVersion, remoteVersion)) {
      console.log(`[MCP Updater] Update available! Downloading ${remoteVersion}...`);
      await downloadFile(REMOTE_BUNDLE_URL, BUNDLE_FILE);
      
      // Update local version cache
      fs.writeFileSync(VERSION_FILE, JSON.stringify({
        version: remoteVersion,
        updated_at: new Date().toISOString()
      }, null, 2), 'utf-8');
      
      console.log('[MCP Updater] Update completed successfully!');
    } else {
      console.log('[MCP Updater] MCP server is already up to date.');
    }
  } catch (err) {
    console.error(`[MCP Updater] Error during update check: ${err.message}`);
    // Do not crash the entire process if offline/network fails, log and proceed
    if (!fs.existsSync(BUNDLE_FILE)) {
      console.error('[MCP Updater] WARNING: No local MCP server bundle is available.');
    } else {
      console.log('[MCP Updater] Proceeding with current cached version.');
    }
  }
}

// Run if executed directly
if (require.main === module) {
  main();
}
