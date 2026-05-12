export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'head' | 'options' | 'trace';

export interface OpenApiDocument {
  openapi?: string;
  swagger?: string;
  info?: {
    title?: string;
    version?: string;
  };
  servers?: Array<{ url: string }>;
  host?: string;
  basePath?: string;
  schemes?: string[];
  paths?: Record<string, PathItem>;
  components?: Record<string, unknown>;
  security?: Array<Record<string, string[]>>;
}

export type PathItem = Partial<Record<HttpMethod, Operation>> & {
  parameters?: Parameter[];
};

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: unknown;
  responses?: Record<string, unknown>;
  security?: Array<Record<string, string[]>>;
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  required?: boolean;
  schema?: unknown;
}

export interface OperationEntry {
  path: string;
  method: HttpMethod;
  operation: Operation;
}
