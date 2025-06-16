const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  const hasApiKey = !!(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    aiEnabled: hasApiKey
  });
});

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