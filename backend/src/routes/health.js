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

module.exports = router; 