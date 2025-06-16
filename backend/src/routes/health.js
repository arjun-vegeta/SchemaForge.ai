const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/', (req, res) => {
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    ai: {
      enabled: hasApiKey,
      provider: 'Google Gemini',
      status: hasApiKey ? 'configured' : 'missing_api_key'
    }
  });
});

module.exports = router; 