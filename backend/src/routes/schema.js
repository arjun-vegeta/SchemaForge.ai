const express = require('express');
const router = express.Router();
const schemaController = require('../controllers/schemaController');

// Generate schema from natural language description
router.post('/generate', schemaController.generateSchema);

// Validate a schema
router.post('/validate', schemaController.validateSchema);

// Generate API endpoints from schema
router.post('/api-endpoints', schemaController.generateApiEndpoints);

// Generate ERP diagram from schema
router.post('/erd', schemaController.generateErdDiagram);

module.exports = router; 