# Render Keep-Alive Script

## Overview

This script prevents Render's free tier from sleeping by automatically pinging your deployed application every 14 minutes. This bypasses Render's 15-minute inactivity timeout that causes free tier instances to sleep.

## Problem

Render's free tier has a 15-minute inactivity timeout. If your application doesn't receive any requests for 15 minutes, it goes to sleep and the next request will have a cold start delay (5-30 seconds). This script solves this by sending a request every 14 minutes to keep your instance awake.

## Solution

The `keep-alive.js` script makes HTTP requests to your application at regular intervals to prevent it from sleeping.

## Installation

### Option 1: Run as Separate Process

1. Install the script:

```bash
npm install
```

2. Run the keep-alive script:

```bash
node scripts/keep-alive.js
```

### Option 2: Integrate into Your Application

Add this to your main server file (e.g., `server.js` or `index.js`):

```javascript
// Add this to your existing server file
if (process.env.NODE_ENV === "production" && process.env.RENDER_EXTERNAL_URL) {
  const { exec } = require("child_process");
  exec("node scripts/keep-alive.js &", (error, stdout, stderr) => {
    if (error) {
      console.error(`[KeepAlive] Failed to start: ${error.message}`);
      return;
    }
    console.log(`[KeepAlive] Started: ${stdout}`);
  });
}
```

### Option 3: Use PM2 Process Manager

1. Install PM2:

```bash
npm install -g pm2
```

2. Create an ecosystem file `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: "infographic-generator",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
      },
    },
    {
      name: "keep-alive",
      script: "node",
      args: "scripts/keep-alive.js",
      env: {
        RENDER_EXTERNAL_URL: process.env.RENDER_EXTERNAL_URL,
      },
    },
  ],
};
```

3. Start both processes:

```bash
pm2 start ecosystem.config.js
```

## Configuration

The script uses environment variables for configuration:

- `RENDER_EXTERNAL_URL`: Your Render application URL (e.g., `https://your-app.onrender.com`)
- `PING_INTERVAL`: Ping interval in milliseconds (default: 840000 = 14 minutes)

## Environment Variables

Create a `.env` file in your project root:

```
RENDER_EXTERNAL_URL=https://your-app.onrender.com
```

## Render Deployment

1. Add the script to your `package.json`:

```json
{
  "scripts": {
    "start": "next start",
    "keep-alive": "node scripts/keep-alive.js",
    "start:prod": "npm run start & npm run keep-alive"
  }
}
```

2. Update your Render service start command to:

```
npm run start:prod
```

## Alternative Solutions

### UptimeRobot (External Service)

1. Go to [UptimeRobot](https://uptimerobot.com/) and create a free account
2. Add a new monitor for your Render URL
3. Set the monitoring interval to 5 minutes
4. Save the monitor

### Cron-job.org (External Service)

```bash
curl https://cron-job.org/en/
```

Create a cron job that hits your URL every 14 minutes.

## Notes

- The script logs all ping attempts and responses for debugging
- It handles errors gracefully and continues running
- Uses minimal resources (one HTTP request every 14 minutes)
- Works with both HTTP and HTTPS URLs
- Automatically detects the protocol and port

## License

MIT
