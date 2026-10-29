/**
 * Griha Saathi — Automated Browser Launcher & Server Readiness Watcher
 * 
 * Polls http://localhost:3000 until the Vite development server is ready,
 * then opens http://localhost:3000 in the user's default browser.
 */
const http = require('http');
const { exec } = require('child_process');

const TARGET_URL = 'http://localhost:3000';
const POLL_INTERVAL_MS = 750;
const MAX_ATTEMPTS = 40; // 30 seconds total

let attempts = 0;

function checkServer() {
  attempts++;
  const req = http.get(TARGET_URL, (res) => {
    // If Vite responds with 200 or any non-5xx status, server is ready
    if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
      console.log(`\n[Griha Saathi Launcher] Dev server is active (HTTP ${res.statusCode}).`);
      console.log(`[Griha Saathi Launcher] Opening ${TARGET_URL} in default browser...`);
      
      const openCommand = process.platform === 'win32'
        ? `start ${TARGET_URL}`
        : process.platform === 'darwin'
        ? `open ${TARGET_URL}`
        : `xdg-open ${TARGET_URL}`;

      exec(openCommand, (err) => {
        if (err) {
          console.error('[Griha Saathi Launcher] Could not auto-launch browser:', err.message);
          console.log(`[Griha Saathi Launcher] Please open ${TARGET_URL} manually.`);
        } else {
          console.log('[Griha Saathi Launcher] Browser launch triggered successfully.');
        }
        process.exit(0);
      });
      return;
    }
    scheduleNext();
  });

  req.on('error', () => {
    scheduleNext();
  });

  req.setTimeout(1500, () => {
    req.destroy();
    scheduleNext();
  });
}

function scheduleNext() {
  if (attempts >= MAX_ATTEMPTS) {
    console.log(`\n[Griha Saathi Launcher] Readiness check timed out after ${MAX_ATTEMPTS} attempts.`);
    console.log(`[Griha Saathi Launcher] Please check server logs and open ${TARGET_URL} manually.`);
    process.exit(0);
  }
  setTimeout(checkServer, POLL_INTERVAL_MS);
}

// Start checking
checkServer();
