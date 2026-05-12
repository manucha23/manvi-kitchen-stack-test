import { test, expect } from '../fixtures/openapi.fixture';
import { env } from '../config/env';

test.describe('authentication setup @smoke @readonly', () => {
  test('Cognito test credentials can produce an ID token when configured', async ({ authToken }) => {
    const hasCognitoConfig = Boolean(env.cognitoRegion && env.cognitoClientId && env.testUsername && env.testPassword);
    test.skip(!hasCognitoConfig, 'Cognito settings are not configured for this run.');

    expect(authToken).toBeTruthy();
  });
});
