import { request } from '@playwright/test';
import { env } from '../config/env';
import { HttpMethod, OpenApiDocument, OperationEntry, PathItem } from './types';

const OPENAPI_METHODS: HttpMethod[] = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'];

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function resolveUrl(baseUrl: string, candidate: string): string {
  return new URL(candidate, baseUrl).toString();
}

function candidateSpecUrls(docsUrl: string): string[] {
  const base = docsUrl.endsWith('/') ? docsUrl : `${docsUrl}/`;
  return unique([
    docsUrl,
    resolveUrl(base, 'openapi.json'),
    resolveUrl(base, 'swagger.json'),
    resolveUrl(base, 'api-docs'),
    resolveUrl(base, 'api-docs.json'),
    resolveUrl(base, 'api-json'),
    resolveUrl(base, 'docs-json'),
    resolveUrl(base, 'swagger-json'),
    resolveUrl(base, 'v3/api-docs'),
    resolveUrl(base, 'swagger/v1/swagger.json'),
  ]);
}

function extractSpecUrlsFromHtml(html: string, docsUrl: string): string[] {
  const matches = [...html.matchAll(/(?:url|configUrl)\s*[:=]\s*["']([^"']+)["']/g)].map((match) =>
    resolveUrl(docsUrl, match[1]),
  );
  const linkMatches = [...html.matchAll(/(?:href|src)=["']([^"']*(?:openapi|swagger|api-docs)[^"']*)["']/gi)].map((match) =>
    resolveUrl(docsUrl, match[1]),
  );
  return unique([...matches, ...linkMatches]);
}

function isOpenApiDocument(value: unknown): value is OpenApiDocument {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const candidate = value as OpenApiDocument;
  return Boolean((candidate.openapi || candidate.swagger) && candidate.paths && typeof candidate.paths === 'object');
}

function normalizeOpenApiDocument(document: OpenApiDocument, sourceUrl: string): OpenApiDocument {
  if (env.apiBaseUrl || document.servers?.length || document.host) {
    return document;
  }

  return {
    ...document,
    servers: [{ url: new URL('/', sourceUrl).origin }],
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const context = await request.newContext();
  try {
    const response = await context.get(url, { timeout: 30_000 });
    const contentType = response.headers()['content-type'] ?? '';
    const body = await response.text();

    if (!response.ok()) {
      throw new Error(`${response.status()} ${response.statusText()}`);
    }

    if (!contentType.toLowerCase().includes('json') && body.trimStart().startsWith('<')) {
      throw new Error(`Expected JSON but received ${contentType || 'unknown content type'}`);
    }

    try {
      return JSON.parse(body);
    } catch (error) {
      throw new Error(`Invalid JSON from ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  } finally {
    await context.dispose();
  }
}

async function fetchText(url: string): Promise<string> {
  const context = await request.newContext();
  try {
    const response = await context.get(url, { timeout: 30_000 });
    if (!response.ok()) {
      throw new Error(`${response.status()} ${response.statusText()}`);
    }
    return response.text();
  } finally {
    await context.dispose();
  }
}

export async function loadOpenApiDocument(docsUrl = env.apiDocsUrl): Promise<OpenApiDocument> {
  const errors: string[] = [];
  const initialCandidates = candidateSpecUrls(docsUrl);

  for (const url of initialCandidates) {
    try {
      const body = await fetchJson(url);
      if (isOpenApiDocument(body)) {
        return normalizeOpenApiDocument(body, url);
      }
      errors.push(`${url}: response was JSON but not an OpenAPI document`);
    } catch (error) {
      errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  try {
    const html = await fetchText(docsUrl);
    for (const url of extractSpecUrlsFromHtml(html, docsUrl)) {
      try {
        const body = await fetchJson(url);
        if (isOpenApiDocument(body)) {
          return normalizeOpenApiDocument(body, url);
        }
        errors.push(`${url}: response was JSON but not an OpenAPI document`);
      } catch (error) {
        errors.push(`${url}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  } catch (error) {
    errors.push(`${docsUrl}: unable to parse docs HTML: ${error instanceof Error ? error.message : String(error)}`);
  }

  throw new Error(`Unable to locate an OpenAPI document from ${docsUrl}. Attempts:\n${errors.join('\n')}`);
}

export function listOperations(document: OpenApiDocument): OperationEntry[] {
  return Object.entries(document.paths ?? {}).flatMap(([path, item]) => {
    const pathItem = item as PathItem;
    return OPENAPI_METHODS.flatMap((method) => {
      const operation = pathItem[method];
      return operation ? [{ path, method, operation }] : [];
    });
  });
}

export function resolveBaseUrl(document: OpenApiDocument): string {
  if (env.apiBaseUrl) {
    return env.apiBaseUrl;
  }

  const firstServer = document.servers?.[0]?.url;
  if (firstServer) {
    return firstServer.replace(/\/$/, '');
  }

  if (document.host) {
    const scheme = document.schemes?.[0] ?? 'https';
    return `${scheme}://${document.host}${document.basePath ?? ''}`.replace(/\/$/, '');
  }

  throw new Error('API_BASE_URL is required because the OpenAPI document does not define a server URL.');
}

export function hasRequiredPathOrQueryParameters(entry: OperationEntry, document: OpenApiDocument): boolean {
  if (entry.path.includes('{') || entry.path.includes('}')) {
    return true;
  }

  const pathParameters = (document.paths?.[entry.path]?.parameters ?? []) as unknown[];
  const operationParameters = entry.operation.parameters ?? [];
  return [...pathParameters, ...operationParameters].some((parameter) => {
    const candidate = parameter as { in?: string; required?: boolean };
    return candidate.required && (candidate.in === 'path' || candidate.in === 'query');
  });
}

export function isSecuredOperation(entry: OperationEntry, document: OpenApiDocument): boolean {
  const operationSecurity = entry.operation.security;
  if (Array.isArray(operationSecurity)) {
    return operationSecurity.length > 0;
  }

  return Array.isArray(document.security) && document.security.length > 0;
}
