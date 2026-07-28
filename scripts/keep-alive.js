/**
 * Render Keep-Alive Script
 *
 * This script prevents Render's free tier from sleeping by pinging the server
 * every 14 minutes (840,000 milliseconds). This bypasses the 15-minute inactivity
 * timeout that causes free tier instances to sleep.
 *
 * Usage:
 * - Run this script alongside your main application
 * - Can be executed as a separate process or integrated into your main server
 * - Works with any Node.js application deployed on Render
 */

const http = require("http");
const https = require("https");

// Configuration
const TARGET_URL = process.env.RENDER_EXTERNAL_URL || "http://localhost:3000";
const PING_INTERVAL = 840000; // 14 minutes in milliseconds
const USER_AGENT = "Render-KeepAlive/1.0";

console.log(`[KeepAlive] Starting Render keep-alive script`);
console.log(`[KeepAlive] Target URL: ${TARGET_URL}`);
console.log(`[KeepAlive] Ping interval: ${PING_INTERVAL / 1000 / 60} minutes`);

// Function to ping the target URL
function pingTarget() {
  const url = new URL(TARGET_URL);
  const protocol = url.protocol === "https:" ? https : http;

  console.log(`[KeepAlive] Ping ${new Date().toISOString()}: ${TARGET_URL}`);

  const req = protocol.request(
    {
      hostname: url.hostname,
      port: url.port || (url.protocol === "https:" ? 443 : 80),
      path: url.pathname || "/",
      method: "GET",
      headers: {
        "User-Agent": USER_AGENT,
        "X-KeepAlive": "true",
      },
      timeout: 10000, // 10 second timeout
    },
    (res) => {
      console.log(
        `[KeepAlive] Response: ${res.statusCode} ${res.statusMessage}`,
      );
    },
  );

  req.on("error", (error) => {
    console.error(`[KeepAlive] Ping error: ${error.message}`);
  });

  req.on("timeout", () => {
    console.warn(`[KeepAlive] Ping timeout after 10 seconds`);
    req.destroy();
  });

  req.end();
}

// Start the keep-alive pinging
setInterval(pingTarget, PING_INTERVAL);

// Initial ping after 1 minute delay to allow server to start
setTimeout(() => {
  pingTarget();
}, 60000);

// Handle process termination gracefully
process.on("SIGINT", () => {
  console.log("\n[KeepAlive] Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n[KeepAlive] Terminated");
  process.exit(0);
});

console.log("[KeepAlive] Script running. Press Ctrl+C to stop.");
