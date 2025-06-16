const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class SchemaService {
  constructor() {
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
  }

  async generateJsonSchema(parsedData) {
    try {
      const { entities, relationships } = parsedData;
      const schemas = {};

      // Generate schema for each entity
      entities.forEach(entity => {
        schemas[entity.name] = this.createEntitySchema(entity);
      });

      // Add relationship information as metadata
      const schemaWithRelationships = {
        $schema: "https://json-schema.org/draft/2020-12/schema",
        $id: "generated-schema",
        title: "Generated Schema",
        description: "Auto-generated schema from natural language description",
        type: "object",
        definitions: schemas,
        relationships: relationships || [],
        metadata: {
          generatedAt: new Date().toISOString(),
          totalEntities: entities.length,
          totalRelationships: (relationships || []).length
        }
      };

      console.log('📊 JSON Schema generated successfully');
      return schemaWithRelationships;

    } catch (error) {
      console.error('❌ Error generating JSON Schema:', error);
      throw new Error(`Schema generation failed: ${error.message}`);
    }
  }

  createEntitySchema(entity) {
    const properties = {};
    const required = [];

    entity.fields.forEach(field => {
      properties[field.name] = this.createFieldSchema(field);
      
      if (field.required) {
        required.push(field.name);
      }
    });

    return {
      type: "object",
      title: entity.description || entity.name,
      description: `Schema for ${entity.name} entity`,
      properties,
      required,
      additionalProperties: false,
      metadata: {
        tableName: entity.tableName,
        entity: entity.name
      }
    };
  }

  createFieldSchema(field) {
    const schema = {
      description: field.description
    };

    // Map field types to JSON Schema types
    switch (field.type.toLowerCase()) {
      case 'string':
      case 'text':
        schema.type = 'string';
        if (field.constraints?.maxLength) {
          schema.maxLength = field.constraints.maxLength;
        }
        if (field.constraints?.minLength) {
          schema.minLength = field.constraints.minLength;
        }
        if (field.constraints?.pattern) {
          schema.pattern = field.constraints.pattern;
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
        if (field.constraints?.minimum !== undefined) {
          schema.minimum = field.constraints.minimum;
        }
        if (field.constraints?.maximum !== undefined) {
          schema.maximum = field.constraints.maximum;
        }
        break;

      case 'float':
      case 'decimal':
      case 'double':
        schema.type = 'number';
        if (field.constraints?.minimum !== undefined) {
          schema.minimum = field.constraints.minimum;
        }
        if (field.constraints?.maximum !== undefined) {
          schema.maximum = field.constraints.maximum;
        }
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
        if (field.constraints?.items) {
          schema.items = field.constraints.items;
        }
        break;

      case 'json':
      case 'object':
        schema.type = 'object';
        break;

      default:
        schema.type = 'string';
    }

    // Add default value if specified
    if (field.constraints?.default !== undefined) {
      schema.default = field.constraints.default;
    }

    // Add enum values if specified
    if (field.constraints?.enum) {
      schema.enum = field.constraints.enum;
    }

    // Add metadata
    schema.metadata = {
      fieldName: field.name,
      originalType: field.type,
      constraints: field.constraints || {}
    };

    return schema;
  }

  async validateSchema(schema) {
    try {
      // Validate that the schema itself is valid JSON Schema
      const metaSchema = this.ajv.getSchema('https://json-schema.org/draft/2020-12/schema');
      
      if (!metaSchema) {
        // Add meta schema if not present
        this.ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-07.json'));
      }

      const isValid = this.ajv.validateSchema(schema);
      
      const validation = {
        valid: isValid,
        errors: this.ajv.errors || [],
        summary: {
          totalDefinitions: schema.definitions ? Object.keys(schema.definitions).length : 0,
          totalRelationships: schema.relationships ? schema.relationships.length : 0,
          validatedAt: new Date().toISOString()
        }
      };

      if (isValid) {
        console.log('✅ Schema validation passed');
      } else {
        console.log('❌ Schema validation failed:', this.ajv.errors);
      }

      return validation;

    } catch (error) {
      console.error('❌ Error validating schema:', error);
      return {
        valid: false,
        errors: [{ message: error.message }],
        summary: {
          validatedAt: new Date().toISOString()
        }
      };
    }
  }

  // Utility method to convert schema to different formats
  convertSchemaFormat(schema, format) {
    switch (format.toLowerCase()) {
      case 'typescript':
        return this.convertToTypeScript(schema);
      case 'mongoose':
        return this.convertToMongoose(schema);
      case 'sql':
        return this.convertToSQL(schema);
      default:
        return schema;
    }
  }

  convertToTypeScript(schema) {
    // Basic TypeScript interface generation
    let typescript = '// Auto-generated TypeScript interfaces\n\n';
    
    if (schema.definitions) {
      Object.entries(schema.definitions).forEach(([entityName, entitySchema]) => {
        typescript += `export interface ${entityName.charAt(0).toUpperCase() + entityName.slice(1)} {\n`;
        
        if (entitySchema.properties) {
          Object.entries(entitySchema.properties).forEach(([propName, propSchema]) => {
            const optional = !entitySchema.required?.includes(propName) ? '?' : '';
            const tsType = this.jsonSchemaToTypeScript(propSchema);
            typescript += `  ${propName}${optional}: ${tsType};\n`;
          });
        }
        
        typescript += '}\n\n';
      });
    }
    
    return typescript;
  }

  jsonSchemaToTypeScript(schema) {
    switch (schema.type) {
      case 'string':
        return 'string';
      case 'number':
      case 'integer':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'array':
        return `${this.jsonSchemaToTypeScript(schema.items || { type: 'any' })}[]`;
      case 'object':
        return 'object';
      default:
        return 'any';
    }
  }

  convertToMongoose(schema) {
    // Basic Mongoose schema generation
    let mongoose = '// Auto-generated Mongoose schemas\nconst mongoose = require(\'mongoose\');\n\n';
    
    if (schema.definitions) {
      Object.entries(schema.definitions).forEach(([entityName, entitySchema]) => {
        mongoose += `const ${entityName}Schema = new mongoose.Schema({\n`;
        
        if (entitySchema.properties) {
          Object.entries(entitySchema.properties).forEach(([propName, propSchema]) => {
            if (propName === 'id') return; // Skip ID as Mongoose handles it
            
            const mongooseType = this.jsonSchemaToMongoose(propSchema);
            const required = entitySchema.required?.includes(propName);
            
            mongoose += `  ${propName}: {\n`;
            mongoose += `    type: ${mongooseType},\n`;
            if (required) mongoose += `    required: true,\n`;
            mongoose += `  },\n`;
          });
        }
        
        mongoose += '}, { timestamps: true });\n\n';
        mongoose += `module.exports.${entityName.charAt(0).toUpperCase() + entityName.slice(1)} = mongoose.model('${entityName.charAt(0).toUpperCase() + entityName.slice(1)}', ${entityName}Schema);\n\n`;
      });
    }
    
    return mongoose;
  }

  jsonSchemaToMongoose(schema) {
    switch (schema.type) {
      case 'string':
        return 'String';
      case 'number':
      case 'integer':
        return 'Number';
      case 'boolean':
        return 'Boolean';
      case 'array':
        return '[String]'; // Simplified
      case 'object':
        return 'mongoose.Schema.Types.Mixed';
      default:
        return 'String';
    }
  }

  convertToSQL(schema) {
    // Basic SQL DDL generation
    let sql = '-- Auto-generated SQL DDL\n\n';
    
    if (schema.definitions) {
      Object.entries(schema.definitions).forEach(([entityName, entitySchema]) => {
        const tableName = entitySchema.metadata?.tableName || `${entityName}s`;
        sql += `CREATE TABLE ${tableName} (\n`;
        
        if (entitySchema.properties) {
          const columns = [];
          Object.entries(entitySchema.properties).forEach(([propName, propSchema]) => {
            const sqlType = this.jsonSchemaToSQL(propSchema);
            const nullable = !entitySchema.required?.includes(propName) ? '' : ' NOT NULL';
            const isPrimary = propSchema.metadata?.constraints?.primary ? ' PRIMARY KEY' : '';
            const autoIncrement = propSchema.metadata?.constraints?.autoIncrement ? ' AUTO_INCREMENT' : '';
            
            columns.push(`  ${propName} ${sqlType}${nullable}${isPrimary}${autoIncrement}`);
          });
          
          sql += columns.join(',\n');
        }
        
        sql += '\n);\n\n';
      });
    }
    
    return sql;
  }

  jsonSchemaToSQL(schema) {
    switch (schema.type) {
      case 'string':
        const maxLength = schema.maxLength || 255;
        return `VARCHAR(${maxLength})`;
      case 'integer':
        return 'INT';
      case 'number':
        return 'DECIMAL(10,2)';
      case 'boolean':
        return 'BOOLEAN';
      default:
        return 'TEXT';
    }
  }
}

module.exports = new SchemaService(); 