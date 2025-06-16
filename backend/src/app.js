const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');

// Try to load .env from all possible locations
const envPaths = [
  path.resolve(__dirname, '../../../.env'),  // Project root
  path.resolve(__dirname, '../../.env'),     // Backend directory
  path.resolve(__dirname, '../.env')         // Backend/src directory
];

envPaths.forEach(envPath => {
  dotenv.config({ path: envPath });
  console.log(`📝 Checking for .env at: ${envPath}`);
});

// Debug logging for environment variables
console.log('\n🔍 Environment Variables Status:');
console.log('--------------------------------');
console.log(`NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
console.log(`PORT: ${process.env.PORT || 'not set'}`);
console.log(`CORS_ORIGIN: ${process.env.CORS_ORIGIN || 'not set'}`);
console.log(`GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? '✅ set' : '❌ not set'}`);
console.log('--------------------------------\n');

const schemaRoutes = require('./routes/schema');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = process.env.PORT || 5002;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://schemaforge-ai.netlify.app',
      'http://localhost:3000'
    ];
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Remove trailing slash if present
    const normalizedOrigin = origin.replace(/\/$/, '');
    
    if (allowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Schema API Generator is running' });
});

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/schema', schemaRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = app; 