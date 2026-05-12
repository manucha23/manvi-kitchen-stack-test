export type TestMode = 'readonly' | 'contract' | 'smoke';

export interface TestEnv {
  apiBaseUrl?: string;
  apiDocsUrl: string;
  cognitoRegion?: string;
  cognitoClientId?: string;
  testUsername?: string;
  testPassword?: string;
  testMode: TestMode;
  runId: string;
  isReadOnly: boolean;
}

function optional(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

function readMode(): TestMode {
  const mode = process.env.TEST_MODE ?? 'contract';
  if (!['readonly', 'contract', 'smoke'].includes(mode)) {
    throw new Error(`Unsupported TEST_MODE "${mode}". Use readonly, contract, or smoke.`);
  }
  return mode as TestMode;
}

function createRunId(): string {
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${timestamp}_${random}`;
}

const testMode = readMode();

export const env: TestEnv = {
  apiBaseUrl: optional('API_BASE_URL')?.replace(/\/$/, ''),
  apiDocsUrl: optional('API_DOCS_URL') ?? 'https://api-doc.test.cravnest.in/',
  cognitoRegion: optional('COGNITO_REGION'),
  cognitoClientId: optional('COGNITO_CLIENT_ID'),
  testUsername: optional('TEST_USERNAME'),
  testPassword: optional('TEST_PASSWORD'),
  testMode,
  runId: process.env.API_TEST_RUN_ID ?? createRunId(),
  isReadOnly: testMode === 'readonly' || testMode === 'contract',
};
