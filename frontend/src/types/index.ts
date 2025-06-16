export interface Entity {
  name: string;
  tableName: string;
  description: string;
  fields: Field[];
}

export interface Field {
  name: string;
  type: string;
  required: boolean;
  description: string;
  constraints?: FieldConstraints;
}

export interface FieldConstraints {
  primary?: boolean;
  unique?: boolean;
  autoIncrement?: boolean;
  maxLength?: number;
  minLength?: number;
  minimum?: number;
  maximum?: number;
  default?: any;
  enum?: string[];
  pattern?: string;
}

export interface Relationship {
  from: string;
  to: string;
  type: 'oneToOne' | 'oneToMany' | 'manyToOne' | 'manyToMany';
  description?: string;
}

export interface ParsedData {
  entities: Entity[];
  relationships: Relationship[];
}

export interface JsonSchema {
  $schema: string;
  $id: string;
  title: string;
  description: string;
  type: string;
  definitions: Record<string, any>;
  relationships: Relationship[];
  metadata: {
    generatedAt: string;
    totalEntities: number;
    totalRelationships: number;
  };
}

export interface ApiEndpoint {
  openApiSpec: OpenApiSpec;
  summary: {
    totalEndpoints: number;
    totalSchemas: number;
    entities: string[];
    generatedAt: string;
  };
  codeExamples: CodeExamples;
}

export interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact: {
      name: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
    responses: Record<string, any>;
  };
  tags: Array<{
    name: string;
    description: string;
  }>;
}

export interface CodeExamples {
  javascript: Record<string, Record<string, string>>;
  python: Record<string, Record<string, string>>;
  curl: Record<string, Record<string, string>>;
}

export interface ErdDiagram {
  mermaid: string;
  plantUML: string;
  textual: string;
  metadata: {
    totalEntities: number;
    totalRelationships: number;
    generatedAt: string;
    diagramType: string;
  };
}

export interface GenerationResult {
  success: boolean;
  data: {
    originalDescription: string;
    parsedEntities: ParsedData;
    jsonSchema: JsonSchema;
    apiEndpoints: ApiEndpoint;
    erdDiagram: ErdDiagram;
    generatedAt: string;
  };
}

export interface ApiError {
  error: string;
  message: string;
  details?: string[];
}

export interface LoadingState {
  isLoading: boolean;
  stage: 'parsing' | 'schema' | 'api' | 'diagram' | 'complete' | null;
  progress: number;
}

export type TabType = 'input' | 'schema' | 'api' | 'diagram' | 'export';

export interface ExportOptions {
  format: 'json' | 'yaml' | 'typescript' | 'sql' | 'mongoose';
  includeComments: boolean;
  minified: boolean;
} 