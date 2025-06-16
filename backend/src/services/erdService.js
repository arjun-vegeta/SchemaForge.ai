class ERDService {
  async generateErdDiagram(parsedData) {
    try {
      const { entities, relationships } = parsedData;
      
      // Generate Mermaid ERD syntax
      const mermaidCode = this.generateMermaidERD(entities, relationships || []);
      
      // Also generate PlantUML as alternative
      const plantUMLCode = this.generatePlantUMLERD(entities, relationships || []);
      
      // Generate textual description
      const textualDescription = this.generateTextualDescription(entities, relationships || []);

      console.log('🎨 ERD diagram generated successfully');
      
      return {
        mermaid: mermaidCode,
        plantUML: plantUMLCode,
        textual: textualDescription,
        metadata: {
          totalEntities: entities.length,
          totalRelationships: (relationships || []).length,
          generatedAt: new Date().toISOString(),
          diagramType: 'Entity Relationship Diagram'
        }
      };

    } catch (error) {
      console.error('❌ Error generating ERD diagram:', error);
      throw new Error(`ERD generation failed: ${error.message}`);
    }
  }

  generateMermaidERD(entities, relationships) {
    let mermaidCode = 'erDiagram\n';
    
    // Add entities with their attributes
    entities.forEach(entity => {
      mermaidCode += `\n    ${entity.tableName.toUpperCase()} {\n`;
      
      entity.fields.forEach(field => {
        const type = this.mapTypeToMermaidType(field.type);
        const constraint = this.generateMermaidConstraints(field);
        
        mermaidCode += `        ${type} ${field.name}${constraint}\n`;
      });
      
      mermaidCode += '    }\n';
    });

    // Add relationships
    if (relationships && relationships.length > 0) {
      mermaidCode += '\n    %% Relationships\n';
      
      relationships.forEach(rel => {
        const fromEntity = entities.find(e => e.name === rel.from);
        const toEntity = entities.find(e => e.name === rel.to);
        
        if (fromEntity && toEntity) {
          const relationshipSymbol = this.getMermaidRelationshipSymbol(rel.type);
          const fromTable = fromEntity.tableName.toUpperCase();
          const toTable = toEntity.tableName.toUpperCase();
          
          mermaidCode += `    ${fromTable} ${relationshipSymbol} ${toTable} : "${rel.description || rel.type}"\n`;
        }
      });
    }

    return mermaidCode;
  }

  generatePlantUMLERD(entities, relationships) {
    let plantUMLCode = '@startuml\n!define RECTANGLE class\n\n';
    
    // Add entities
    entities.forEach(entity => {
      plantUMLCode += `entity "${entity.tableName}" as ${entity.name} {\n`;
      
      entity.fields.forEach(field => {
        const keyIndicator = this.getPlantUMLKeyIndicator(field);
        const type = this.mapTypeToPlantUMLType(field.type);
        
        plantUMLCode += `  ${keyIndicator}${field.name} : ${type}\n`;
      });
      
      plantUMLCode += '}\n\n';
    });

    // Add relationships
    if (relationships && relationships.length > 0) {
      relationships.forEach(rel => {
        const fromEntity = entities.find(e => e.name === rel.from);
        const toEntity = entities.find(e => e.name === rel.to);
        
        if (fromEntity && toEntity) {
          const relationshipSymbol = this.getPlantUMLRelationshipSymbol(rel.type);
          plantUMLCode += `${rel.from} ${relationshipSymbol} ${rel.to} : ${rel.description || rel.type}\n`;
        }
      });
    }

    plantUMLCode += '\n@enduml';
    return plantUMLCode;
  }

  generateTextualDescription(entities, relationships) {
    let description = 'Database Schema Description\n';
    description += '============================\n\n';
    
    // Describe entities
    description += 'Entities:\n';
    description += '---------\n';
    
    entities.forEach((entity, index) => {
      description += `${index + 1}. ${entity.name.toUpperCase()} (Table: ${entity.tableName})\n`;
      description += `   Description: ${entity.description || 'No description provided'}\n`;
      description += '   Fields:\n';
      
      entity.fields.forEach(field => {
        const requiredText = field.required ? ' (Required)' : ' (Optional)';
        const constraintText = this.getConstraintDescription(field.constraints);
        
        description += `   - ${field.name}: ${field.type}${requiredText}\n`;
        description += `     ${field.description}${constraintText}\n`;
      });
      
      description += '\n';
    });

    // Describe relationships
    if (relationships && relationships.length > 0) {
      description += 'Relationships:\n';
      description += '-------------\n';
      
      relationships.forEach((rel, index) => {
        description += `${index + 1}. ${rel.from} ${this.getRelationshipText(rel.type)} ${rel.to}\n`;
        description += `   ${rel.description || 'No description provided'}\n\n`;
      });
    }

    // Add summary
    description += 'Summary:\n';
    description += '--------\n';
    description += `Total Entities: ${entities.length}\n`;
    description += `Total Relationships: ${relationships ? relationships.length : 0}\n`;
    description += `Generated: ${new Date().toISOString()}\n`;

    return description;
  }

  mapTypeToMermaidType(type) {
    const typeMap = {
      'string': 'varchar',
      'text': 'text',
      'email': 'varchar',
      'url': 'varchar',
      'number': 'int',
      'integer': 'int',
      'int': 'int',
      'float': 'float',
      'decimal': 'decimal',
      'double': 'double',
      'boolean': 'boolean',
      'bool': 'boolean',
      'date': 'date',
      'datetime': 'datetime',
      'timestamp': 'timestamp',
      'array': 'json',
      'json': 'json',
      'object': 'json'
    };
    
    return typeMap[type.toLowerCase()] || 'varchar';
  }

  mapTypeToPlantUMLType(type) {
    const typeMap = {
      'string': 'VARCHAR',
      'text': 'TEXT',
      'email': 'VARCHAR',
      'url': 'VARCHAR',
      'number': 'INTEGER',
      'integer': 'INTEGER',
      'int': 'INTEGER',
      'float': 'FLOAT',
      'decimal': 'DECIMAL',
      'double': 'DOUBLE',
      'boolean': 'BOOLEAN',
      'bool': 'BOOLEAN',
      'date': 'DATE',
      'datetime': 'DATETIME',
      'timestamp': 'TIMESTAMP',
      'array': 'JSON',
      'json': 'JSON',
      'object': 'JSON'
    };
    
    return typeMap[type.toLowerCase()] || 'VARCHAR';
  }

  generateMermaidConstraints(field) {
    const constraints = [];
    
    if (field.constraints?.primary) {
      constraints.push('PK');
    }
    
    if (field.constraints?.unique) {
      constraints.push('UK');
    }
    
    if (field.required) {
      constraints.push('NOT NULL');
    }
    
    if (field.constraints?.autoIncrement) {
      constraints.push('AUTO_INCREMENT');
    }
    
    return constraints.length > 0 ? ` "${constraints.join(', ')}"` : '';
  }

  getPlantUMLKeyIndicator(field) {
    if (field.constraints?.primary) {
      return '* ';
    } else if (field.constraints?.unique) {
      return '+ ';
    } else if (field.required) {
      return '- ';
    }
    return '  ';
  }

  getMermaidRelationshipSymbol(relType) {
    const symbolMap = {
      'oneToOne': '||--||',
      'oneToMany': '||--o{',
      'manyToOne': 'o{--||',
      'manyToMany': 'o{--o{'
    };
    
    return symbolMap[relType] || '||--o{';
  }

  getPlantUMLRelationshipSymbol(relType) {
    const symbolMap = {
      'oneToOne': '||--||',
      'oneToMany': '||--o{',
      'manyToOne': 'o{--||',
      'manyToMany': 'o{--o{'
    };
    
    return symbolMap[relType] || '||--o{';
  }

  getRelationshipText(relType) {
    const textMap = {
      'oneToOne': 'has one',
      'oneToMany': 'has many',
      'manyToOne': 'belongs to',
      'manyToMany': 'has many'
    };
    
    return textMap[relType] || 'relates to';
  }

  getConstraintDescription(constraints) {
    if (!constraints) return '';
    
    const descriptions = [];
    
    if (constraints.primary) {
      descriptions.push('Primary Key');
    }
    
    if (constraints.unique) {
      descriptions.push('Unique');
    }
    
    if (constraints.autoIncrement) {
      descriptions.push('Auto Increment');
    }
    
    if (constraints.maxLength) {
      descriptions.push(`Max Length: ${constraints.maxLength}`);
    }
    
    if (constraints.minLength) {
      descriptions.push(`Min Length: ${constraints.minLength}`);
    }
    
    if (constraints.minimum !== undefined) {
      descriptions.push(`Min Value: ${constraints.minimum}`);
    }
    
    if (constraints.maximum !== undefined) {
      descriptions.push(`Max Value: ${constraints.maximum}`);
    }
    
    if (constraints.default !== undefined) {
      descriptions.push(`Default: ${constraints.default}`);
    }
    
    if (constraints.enum) {
      descriptions.push(`Options: ${constraints.enum.join(', ')}`);
    }
    
    return descriptions.length > 0 ? ` (${descriptions.join(', ')})` : '';
  }

  // Generate different diagram styles
  generateAlternativeDiagrams(entities, relationships) {
    return {
      // Simple box diagram
      simple: this.generateSimpleDiagram(entities, relationships),
      
      // Detailed technical diagram
      detailed: this.generateDetailedDiagram(entities, relationships),
      
      // Conceptual diagram (high-level)
      conceptual: this.generateConceptualDiagram(entities, relationships)
    };
  }

  generateSimpleDiagram(entities, relationships) {
    let diagram = 'graph TD\n';
    
    entities.forEach(entity => {
      diagram += `    ${entity.name}[${entity.name}]\n`;
    });
    
    if (relationships && relationships.length > 0) {
      relationships.forEach(rel => {
        diagram += `    ${rel.from} --> ${rel.to}\n`;
      });
    }
    
    return diagram;
  }

  generateDetailedDiagram(entities, relationships) {
    let diagram = 'classDiagram\n';
    
    entities.forEach(entity => {
      diagram += `    class ${entity.name} {\n`;
      
      entity.fields.forEach(field => {
        const visibility = field.constraints?.primary ? '+' : field.required ? '#' : '-';
        diagram += `        ${visibility}${field.type} ${field.name}\n`;
      });
      
      diagram += '    }\n';
    });
    
    if (relationships && relationships.length > 0) {
      relationships.forEach(rel => {
        const cardinality = this.getClassDiagramCardinality(rel.type);
        diagram += `    ${rel.from} ${cardinality} ${rel.to} : ${rel.description || rel.type}\n`;
      });
    }
    
    return diagram;
  }

  generateConceptualDiagram(entities, relationships) {
    let diagram = 'mindmap\n';
    diagram += '  root((Database))\n';
    
    entities.forEach(entity => {
      diagram += `    ${entity.name}\n`;
      
      // Show only key fields in conceptual view
      const keyFields = entity.fields.filter(f => f.constraints?.primary || f.required);
      keyFields.slice(0, 3).forEach(field => {
        diagram += `      ${field.name}\n`;
      });
    });
    
    return diagram;
  }

  getClassDiagramCardinality(relType) {
    const cardinalityMap = {
      'oneToOne': '1 --> 1',
      'oneToMany': '1 --> "*"',
      'manyToOne': '"*" --> 1',
      'manyToMany': '"*" --> "*"'
    };
    
    return cardinalityMap[relType] || '1 --> "*"';
  }
}

module.exports = new ERDService(); 