class APIService {
  async generateApiEndpoints(parsedData) {
    try {
      const { entities, relationships } = parsedData;
      
      const apiSpec = {
        openapi: "3.0.3",
        info: {
          title: "Generated API",
          description: "Auto-generated REST API from natural language description",
          version: "1.0.0",
          contact: {
            name: "API Generator",
            url: "https://github.com/your-repo"
          }
        },
        servers: [
          {
            url: "http://localhost:3000/api",
            description: "Development server"
          },
          {
            url: "https://your-api.com/api",
            description: "Production server"
          }
        ],
        paths: {},
        components: {
          schemas: {},
          responses: {
            NotFound: {
              description: "Resource not found",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string" },
                      message: { type: "string" }
                    }
                  }
                }
              }
            },
            ValidationError: {
              description: "Validation error",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      error: { type: "string" },
                      details: { type: "array", items: { type: "string" } }
                    }
                  }
                }
              }
            }
          }
        },
        tags: []
      };

      // Generate schemas and endpoints for each entity
      entities.forEach(entity => {
        // Add component schema
        apiSpec.components.schemas[entity.name] = this.createComponentSchema(entity);
        
        // Add tag for grouping
        apiSpec.tags.push({
          name: entity.name,
          description: `${entity.description || entity.name} operations`
        });

        // Generate CRUD endpoints
        this.generateCrudEndpoints(apiSpec, entity);
      });

      // Add relationship endpoints if any
      if (relationships && relationships.length > 0) {
        this.generateRelationshipEndpoints(apiSpec, relationships, entities);
      }

      console.log('🔗 API endpoints generated successfully');
      
      return {
        openApiSpec: apiSpec,
        summary: {
          totalEndpoints: Object.keys(apiSpec.paths).length,
          totalSchemas: Object.keys(apiSpec.components.schemas).length,
          entities: entities.map(e => e.name),
          generatedAt: new Date().toISOString()
        },
        codeExamples: this.generateCodeExamples(entities)
      };

    } catch (error) {
      console.error('❌ Error generating API endpoints:', error);
      throw new Error(`API generation failed: ${error.message}`);
    }
  }

  createComponentSchema(entity) {
    const properties = {};
    const required = [];

    entity.fields.forEach(field => {
      properties[field.name] = this.createOpenApiFieldSchema(field);
      if (field.required) {
        required.push(field.name);
      }
    });

    return {
      type: "object",
      properties,
      required,
      example: this.generateExampleData(entity)
    };
  }

  createOpenApiFieldSchema(field) {
    const schema = {
      description: field.description
    };

    switch (field.type.toLowerCase()) {
      case 'string':
      case 'text':
        schema.type = 'string';
        if (field.constraints?.maxLength) {
          schema.maxLength = field.constraints.maxLength;
        }
        break;
      case 'email':
        schema.type = 'string';
        schema.format = 'email';
        break;
      case 'url':
        schema.type = 'string';
        schema.format = 'uri';
        break;
      case 'number':
      case 'integer':
      case 'int':
        schema.type = 'integer';
        break;
      case 'float':
      case 'decimal':
      case 'double':
        schema.type = 'number';
        break;
      case 'boolean':
      case 'bool':
        schema.type = 'boolean';
        break;
      case 'date':
      case 'datetime':
      case 'timestamp':
        schema.type = 'string';
        schema.format = 'date-time';
        break;
      case 'array':
        schema.type = 'array';
        schema.items = { type: 'string' };
        break;
      default:
        schema.type = 'string';
    }

    return schema;
  }

  generateCrudEndpoints(apiSpec, entity) {
    const entityName = entity.name;
    const entityNamePlural = entity.tableName;
    const basePath = `/${entityNamePlural}`;

    // GET /entities - List all
    apiSpec.paths[basePath] = {
      get: {
        tags: [entityName],
        summary: `Get all ${entityNamePlural}`,
        description: `Retrieve a list of all ${entityNamePlural}`,
        parameters: [
          {
            name: "page",
            in: "query",
            description: "Page number for pagination",
            required: false,
            schema: { type: "integer", default: 1 }
          },
          {
            name: "limit",
            in: "query",
            description: "Number of items per page",
            required: false,
            schema: { type: "integer", default: 10 }
          },
          {
            name: "sort",
            in: "query",
            description: "Sort field",
            required: false,
            schema: { type: "string" }
          }
        ],
        responses: {
          "200": {
            description: `List of ${entityNamePlural}`,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    data: {
                      type: "array",
                      items: { $ref: `#/components/schemas/${entityName}` }
                    },
                    pagination: {
                      type: "object",
                      properties: {
                        page: { type: "integer" },
                        limit: { type: "integer" },
                        total: { type: "integer" },
                        pages: { type: "integer" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: [entityName],
        summary: `Create a new ${entityName}`,
        description: `Create a new ${entityName} record`,
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${entityName}` }
            }
          }
        },
        responses: {
          "201": {
            description: `${entityName} created successfully`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${entityName}` }
              }
            }
          },
          "400": { $ref: "#/components/responses/ValidationError" }
        }
      }
    };

    // GET /entities/{id} - Get by ID
    apiSpec.paths[`${basePath}/{id}`] = {
      get: {
        tags: [entityName],
        summary: `Get ${entityName} by ID`,
        description: `Retrieve a specific ${entityName} by its ID`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: `${entityName} ID`,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "200": {
            description: `${entityName} details`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${entityName}` }
              }
            }
          },
          "404": { $ref: "#/components/responses/NotFound" }
        }
      },
      put: {
        tags: [entityName],
        summary: `Update ${entityName}`,
        description: `Update an existing ${entityName}`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: `${entityName} ID`,
            schema: { type: "integer" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: `#/components/schemas/${entityName}` }
            }
          }
        },
        responses: {
          "200": {
            description: `${entityName} updated successfully`,
            content: {
              "application/json": {
                schema: { $ref: `#/components/schemas/${entityName}` }
              }
            }
          },
          "404": { $ref: "#/components/responses/NotFound" },
          "400": { $ref: "#/components/responses/ValidationError" }
        }
      },
      delete: {
        tags: [entityName],
        summary: `Delete ${entityName}`,
        description: `Delete a ${entityName} by ID`,
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            description: `${entityName} ID`,
            schema: { type: "integer" }
          }
        ],
        responses: {
          "204": {
            description: `${entityName} deleted successfully`
          },
          "404": { $ref: "#/components/responses/NotFound" }
        }
      }
    };
  }

  generateRelationshipEndpoints(apiSpec, relationships, entities) {
    relationships.forEach(rel => {
      const fromEntity = entities.find(e => e.name === rel.from);
      const toEntity = entities.find(e => e.name === rel.to);
      
      if (!fromEntity || !toEntity) return;

      const fromPlural = fromEntity.tableName;
      const toPlural = toEntity.tableName;

      // Add relationship endpoint: GET /entities/{id}/relatedEntities
      const relationshipPath = `/${fromPlural}/{id}/${toPlural}`;
      
      if (!apiSpec.paths[relationshipPath]) {
        apiSpec.paths[relationshipPath] = {
          get: {
            tags: [rel.from],
            summary: `Get ${rel.to} related to ${rel.from}`,
            description: `Retrieve ${toPlural} associated with a specific ${rel.from}`,
            parameters: [
              {
                name: "id",
                in: "path",
                required: true,
                description: `${rel.from} ID`,
                schema: { type: "integer" }
              }
            ],
            responses: {
              "200": {
                description: `Related ${toPlural}`,
                content: {
                  "application/json": {
                    schema: {
                      type: "array",
                      items: { $ref: `#/components/schemas/${rel.to}` }
                    }
                  }
                }
              },
              "404": { $ref: "#/components/responses/NotFound" }
            }
          }
        };
      }
    });
  }

  generateExampleData(entity) {
    const example = {};
    
    entity.fields.forEach(field => {
      switch (field.type.toLowerCase()) {
        case 'string':
        case 'text':
          example[field.name] = field.name === 'name' ? 'John Doe' : `Sample ${field.name}`;
          break;
        case 'email':
          example[field.name] = 'user@example.com';
          break;
        case 'number':
        case 'integer':
          example[field.name] = field.name === 'id' ? 1 : 100;
          break;
        case 'boolean':
          example[field.name] = true;
          break;
        case 'date':
        case 'datetime':
          example[field.name] = new Date().toISOString();
          break;
        default:
          example[field.name] = `sample_${field.name}`;
      }
    });

    return example;
  }

  generateCodeExamples(entities) {
    const examples = {
      javascript: {},
      python: {},
      curl: {}
    };

    entities.forEach(entity => {
      const entityName = entity.name;
      const entityPlural = entity.tableName;
      
      // JavaScript/Node.js examples
      examples.javascript[entityName] = {
        getAll: `
// Get all ${entityPlural}
const response = await fetch('/api/${entityPlural}');
const data = await response.json();
console.log(data);`,
        
        getById: `
// Get ${entityName} by ID
const response = await fetch('/api/${entityPlural}/1');
const ${entityName} = await response.json();
console.log(${entityName});`,
        
        create: `
// Create new ${entityName}
const new${entityName.charAt(0).toUpperCase() + entityName.slice(1)} = ${JSON.stringify(this.generateExampleData(entity), null, 2)};

const response = await fetch('/api/${entityPlural}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(new${entityName.charAt(0).toUpperCase() + entityName.slice(1)})
});
const created${entityName.charAt(0).toUpperCase() + entityName.slice(1)} = await response.json();`,
        
        update: `
// Update ${entityName}
const updates = { name: 'Updated Name' };

const response = await fetch('/api/${entityPlural}/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(updates)
});
const updated${entityName.charAt(0).toUpperCase() + entityName.slice(1)} = await response.json();`,
        
        delete: `
// Delete ${entityName}
const response = await fetch('/api/${entityPlural}/1', {
  method: 'DELETE'
});
console.log('${entityName} deleted:', response.ok);`
      };

      // Python examples
      examples.python[entityName] = {
        getAll: `
# Get all ${entityPlural}
import requests

response = requests.get('http://localhost:3000/api/${entityPlural}')
data = response.json()
print(data)`,
        
        create: `
# Create new ${entityName}
import requests

new_${entityName} = ${JSON.stringify(this.generateExampleData(entity), null, 2)}

response = requests.post('http://localhost:3000/api/${entityPlural}', json=new_${entityName})
created_${entityName} = response.json()
print(created_${entityName})`
      };

      // cURL examples
      examples.curl[entityName] = {
        getAll: `# Get all ${entityPlural}
curl -X GET "http://localhost:3000/api/${entityPlural}"`,
        
        create: `# Create new ${entityName}
curl -X POST "http://localhost:3000/api/${entityPlural}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(this.generateExampleData(entity))}'`,
        
        update: `# Update ${entityName}
curl -X PUT "http://localhost:3000/api/${entityPlural}/1" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Updated Name"}'`,
        
        delete: `# Delete ${entityName}
curl -X DELETE "http://localhost:3000/api/${entityPlural}/1"`
      };
    });

    return examples;
  }
}

module.exports = new APIService(); 