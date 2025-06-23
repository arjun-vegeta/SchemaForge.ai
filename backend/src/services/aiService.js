const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIService {
  constructor() {
    // Check for API key in either environment variable
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ GEMINI_API_KEY not found. AI features will be limited.');
      console.log('📝 To enable AI features:');
      console.log('   1. Get API key from: https://makersuite.google.com/app/apikey');
      console.log('   2. Add to backend/.env: GEMINI_API_KEY=your_key_here');
      console.log('   3. Restart the server');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      console.log('✅ AI service initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing AI service:', error.message);
    }
  }

  async testApiKey() {
    try {
      // Try Gemini 2.0 Flash first (latest and free tier available)
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent("Hello");
      console.log('🔑 API key test successful with Gemini 2.0 Flash - AI features enabled');
    } catch (error) {
      console.error('❌ Gemini 2.0 Flash test failed:', error.message);
      console.log('🔍 Trying fallback models...');
      
      // Try Gemini 1.5 Flash as backup
      try {
        const altModel = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await altModel.generateContent("Hello");
        console.log('🔑 API key test successful with Gemini 1.5 Flash - AI features enabled');
      } catch (altError) {
        console.error('❌ All model tests failed. Checking available models...');
        console.log('💡 Available models: gemini-2.0-flash, gemini-1.5-flash, gemini-1.5-pro');
        console.log('🆓 Free tier: Gemini 2.0 Flash and 1.5 Flash available');
        this.genAI = null;
      }
    }
  }

  async parseNaturalLanguage(description) {
    try {
      if (!this.genAI) {
        // Fallback: Use basic parsing without AI
        return this.basicParsing(description);
      }

      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
        You are a database schema expert. Analyze the following natural language description and extract structured data information.
        
        Description: "${description}"
        
        Please respond with a JSON object that contains:
        1. entities: An array of entities/tables identified
        2. For each entity, include:
           - name: entity name (singular, camelCase)
           - tableName: database table name (plural, snake_case)
           - description: brief description
           - fields: array of field objects with:
             - name: field name (camelCase)
             - type: data type (string, number, boolean, date, email, etc.)
             - required: boolean
             - description: field description
             - constraints: any special constraints (max length, format, etc.)
        3. relationships: array of relationships between entities with:
           - from: source entity name
           - to: target entity name
           - type: relationship type (oneToOne, oneToMany, manyToMany)
           - description: relationship description

        Important: Respond ONLY with valid JSON, no other text or markdown.
        
        Example format:
        {
          "entities": [
            {
              "name": "user",
              "tableName": "users",
              "description": "System users",
              "fields": [
                {
                  "name": "id",
                  "type": "number",
                  "required": true,
                  "description": "Unique identifier",
                  "constraints": { "primary": true, "autoIncrement": true }
                },
                {
                  "name": "name",
                  "type": "string",
                  "required": true,
                  "description": "User's full name",
                  "constraints": { "maxLength": 100 }
                }
              ]
            }
          ],
          "relationships": [
            {
              "from": "user",
              "to": "profile",
              "type": "oneToOne",
              "description": "User has one profile"
            }
          ]
        }
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Clean the response and parse JSON
      const cleanedText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      try {
        const parsedData = JSON.parse(cleanedText);
        
        // Validate the parsed data structure
        if (!parsedData.entities || !Array.isArray(parsedData.entities)) {
          throw new Error('Invalid entities structure');
        }

        // Add ID fields to entities that don't have them
        parsedData.entities.forEach(entity => {
          const hasIdField = entity.fields.some(field => field.name === 'id');
          if (!hasIdField) {
            entity.fields.unshift({
              name: 'id',
              type: 'number',
              required: true,
              description: 'Unique identifier',
              constraints: { primary: true, autoIncrement: true }
            });
          }
        });

        console.log('🤖 AI successfully parsed description');
        return parsedData;

      } catch (parseError) {
        console.error('❌ Failed to parse AI response as JSON:', parseError);
        console.log('Raw AI response:', text);
        // Fallback to basic parsing
        return this.basicParsing(description);
      }

    } catch (error) {
      console.error('❌ AI Service Error:', error);
      
      // Check if it's a service overloaded error
      if (error.message && error.message.includes('The model is overloaded')) {
        console.log('🔧 Using basic parsing fallback');
        throw new Error('AI service is currently overloaded. Please try again later.');
      }
      
      // For other errors, fallback to basic parsing
      console.log('🔧 Using basic parsing fallback');
      return this.basicParsing(description);
    }
  }

  basicParsing(description) {
    console.log('🔧 Using basic parsing fallback');
    
    // Simple keyword-based parsing as fallback
    const entities = [];
    const words = description.toLowerCase().split(/\s+/);
    
    // Look for common entity patterns
    const entityPatterns = [
      'user', 'users', 'customer', 'customers', 'client', 'clients',
      'product', 'products', 'item', 'items',
      'order', 'orders', 'purchase', 'purchases',
      'profile', 'profiles', 'account', 'accounts',
      'book', 'books', 'author', 'authors',
      'post', 'posts', 'article', 'articles', 'blog',
      'category', 'categories', 'tag', 'tags'
    ];

    const foundEntities = [];
    entityPatterns.forEach(pattern => {
      if (words.includes(pattern)) {
        const singular = pattern.endsWith('s') ? pattern.slice(0, -1) : pattern;
        const plural = pattern.endsWith('s') ? pattern : pattern + 's';
        
        if (!foundEntities.find(e => e.name === singular)) {
          foundEntities.push({
            name: singular,
            tableName: plural,
            description: `${singular.charAt(0).toUpperCase() + singular.slice(1)} entity`,
            fields: [
              {
                name: 'id',
                type: 'number',
                required: true,
                description: 'Unique identifier',
                constraints: { primary: true, autoIncrement: true }
              },
              {
                name: 'name',
                type: 'string',
                required: true,
                description: `${singular} name`,
                constraints: { maxLength: 255 }
              },
              {
                name: 'createdAt',
                type: 'date',
                required: true,
                description: 'Creation timestamp',
                constraints: { default: 'CURRENT_TIMESTAMP' }
              },
              {
                name: 'updatedAt',
                type: 'date',
                required: true,
                description: 'Last update timestamp',
                constraints: { default: 'CURRENT_TIMESTAMP' }
              }
            ]
          });
        }
      }
    });

    // If no entities found, create a generic one
    if (foundEntities.length === 0) {
      foundEntities.push({
        name: 'item',
        tableName: 'items',
        description: 'Generic data item',
        fields: [
          {
            name: 'id',
            type: 'number',
            required: true,
            description: 'Unique identifier',
            constraints: { primary: true, autoIncrement: true }
          },
          {
            name: 'name',
            type: 'string',
            required: true,
            description: 'Item name',
            constraints: { maxLength: 255 }
          },
          {
            name: 'description',
            type: 'string',
            required: false,
            description: 'Item description',
            constraints: { maxLength: 1000 }
          },
          {
            name: 'createdAt',
            type: 'date',
            required: true,
            description: 'Creation timestamp',
            constraints: { default: 'CURRENT_TIMESTAMP' }
          }
        ]
      });
    }

    return {
      entities: foundEntities,
      relationships: []
    };
  }
}

module.exports = new AIService(); 