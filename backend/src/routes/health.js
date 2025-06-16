const express = require('express');
const router = express.Router();

// Track server startup time and request count
const serverStartTime = Date.now();
let requestCount = 0;
let lastActivityTime = Date.now();

// Middleware to track activity
router.use((req, res, next) => {
  requestCount++;
  lastActivityTime = Date.now();
  next();
});

// Enhanced health check endpoint
router.get('/', (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  const uptime = Date.now() - serverStartTime;
  const uptimeSeconds = Math.floor(uptime / 1000);
  const timeSinceLastActivity = Date.now() - lastActivityTime;
  
  // Determine server state
  const getServerState = () => {
    if (uptime < 30000) { // Less than 30 seconds
      return 'STARTING';
    } else if (timeSinceLastActivity > 300000) { // More than 5 minutes since last activity
      return 'IDLE';
    } else {
      return 'ACTIVE';
    }
  };

  const serverState = getServerState();
  
  res.json({
    status: 'ok',
    message: 'Schema API Generator is running',
    server: {
      state: serverState,
      uptime: {
        milliseconds: uptime,
        seconds: uptimeSeconds,
        formatted: formatUptime(uptimeSeconds)
      },
      activity: {
        totalRequests: requestCount,
        lastActivityAgo: timeSinceLastActivity,
        lastActivityFormatted: formatTimeSince(timeSinceLastActivity)
      },
      hosting: {
        platform: process.env.RENDER ? 'RENDER' : 'OTHER',
        isFreeHosting: !!process.env.RENDER,
        sleepWarning: process.env.RENDER ? 'Server may sleep after 15 minutes of inactivity' : null
      }
    },
    ai: {
      status: hasApiKey ? 'CONFIGURED' : 'NOT CONFIGURED',
      message: hasApiKey ? 'AI features are enabled' : 'AI features are disabled'
    },
    timestamp: new Date().toISOString()
  });
});

// Quick ping endpoint for wake-up detection
router.get('/ping', (req, res) => {
  res.json({
    status: 'pong',
    timestamp: Date.now(),
    uptime: Date.now() - serverStartTime
  });
});

// Helper functions
function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

function formatTimeSince(milliseconds) {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ago`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s ago`;
  } else {
    return `${seconds}s ago`;
  }
}

// Debug endpoint to check environment variables
router.get('/debug', (req, res) => {
  // Only allow in development or if explicitly enabled
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEBUG) {
    return res.status(403).json({ error: 'Debug endpoint disabled in production' });
  }

  res.json({
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? '✅ set' : '❌ not set',
      ENABLE_DEBUG: process.env.ENABLE_DEBUG || 'false'
    },
    paths: {
      root: process.cwd(),
      __dirname: __dirname,
      __filename: __filename
    }
  });
});

module.exports = router; 