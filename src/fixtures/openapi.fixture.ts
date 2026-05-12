import { test as base } from '@playwright/test';
import { env } from '../config/env';
import { ApiClient } from '../clients/api-client';
import { CognitoClient } from '../clients/cognito-client';
import { loadOpenApiDocument, resolveBaseUrl } from '../openapi/loader';
import { OpenApiDocument } from '../openapi/types';

interface OpenApiFixtures {
  openApi: OpenApiDocument;
  apiBaseUrl: string;
  authToken: string | undefined;
  api: ApiClient;
}

export const test = base.extend<OpenApiFixtures>({
  openApi: async ({}, use) => {
    await use(await loadOpenApiDocument());
  },

  apiBaseUrl: async ({ openApi }, use) => {
    await use(resolveBaseUrl(openApi));
  },

  authToken: async ({}, use) => {
    const hasCognitoConfig = Boolean(env.cognitoRegion && env.cognitoClientId && env.testUsername && env.testPassword);
    if (!hasCognitoConfig) {
      await use(undefined);
      return;
    }

    const tokens = await new CognitoClient().login();
    await use(tokens.idToken);
  },

  api: async ({ apiBaseUrl, authToken }, use) => {
    const client = await ApiClient.create(apiBaseUrl, authToken);
    await use(client);
    await client.dispose();
  },
});

export { expect } from '@playwright/test';
