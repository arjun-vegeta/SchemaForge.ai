const aiService = require('../services/aiService');
const schemaService = require('../services/schemaService');
const apiService = require('../services/apiService');
const erdService = require('../services/erdService');

class SchemaController {
  async generateSchema(req, res) {
    try {
      const { description } = req.body;

      if (!description || description.trim() === '') {
        return res.status(400).json({
          error: 'Description is required'
        });
      }

      console.log('📝 Processing description:', description);

      // Step 1: Parse natural language with AI
      const parsedData = await aiService.parseNaturalLanguage(description);
      
      // Step 2: Generate JSON Schema
      const jsonSchema = await schemaService.generateJsonSchema(parsedData);
      
      // Step 3: Generate API endpoints
      const apiEndpoints = await apiService.generateApiEndpoints(parsedData);
      
      // Step 4: Generate ERP diagram
      const erdDiagram = await erdService.generateErdDiagram(parsedData);

      console.log('✅ Schema generation completed successfully');

      res.json({
        success: true,
        data: {
          originalDescription: description,
          parsedEntities: parsedData,
          jsonSchema,
          apiEndpoints,
          erdDiagram,
          generatedAt: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('❌ Error generating schema:', error);
      
      // Check if it's an AI service overloaded error
      if (error.message && error.message.includes('AI service is currently overloaded')) {
        return res.status(503).json({
          error: 'AI service temporarily unavailable',
          message: error.message,
          retryAfter: 'Please try again in a few minutes'
        });
      }
      
      res.status(500).json({
        error: 'Failed to generate schema',
        message: error.message
      });
    }
  }

  async validateSchema(req, res) {
    try {
      const { schema } = req.body;

      if (!schema) {
        return res.status(400).json({
          error: 'Schema is required'
        });
      }

      const validation = await schemaService.validateSchema(schema);

      res.json({
        success: true,
        validation
      });

    } catch (error) {
      console.error('❌ Error validating schema:', error);
      res.status(500).json({
        error: 'Failed to validate schema',
        message: error.message
      });
    }
  }

  async generateApiEndpoints(req, res) {
    try {
      const { entities } = req.body;

      if (!entities) {
        return res.status(400).json({
          error: 'Entities are required'
        });
      }

      const apiEndpoints = await apiService.generateApiEndpoints(entities);

      res.json({
        success: true,
        apiEndpoints
      });

    } catch (error) {
      console.error('❌ Error generating API endpoints:', error);
      res.status(500).json({
        error: 'Failed to generate API endpoints',
        message: error.message
      });
    }
  }

  async generateErdDiagram(req, res) {
    try {
      const { entities } = req.body;

      if (!entities) {
        return res.status(400).json({
          error: 'Entities are required'
        });
      }

      const erdDiagram = await erdService.generateErdDiagram(entities);

      res.json({
        success: true,
        erdDiagram
      });

    } catch (error) {
      console.error('❌ Error generating ERD diagram:', error);
      res.status(500).json({
        error: 'Failed to generate ERD diagram',
        message: error.message
      });
    }
  }
}

module.exports = new SchemaController(); 