import { test, expect } from '../fixtures/openapi.fixture';
import { hasRequiredPathOrQueryParameters, isSecuredOperation, listOperations } from '../openapi/loader';

test.describe('documented read-only API smoke @smoke @readonly', () => {
  test('documented GET endpoints without required input respond with an acceptable status', async ({
    api,
    authToken,
    openApi,
  }, testInfo) => {
    const smokeOperations = listOperations(openApi).filter(
      (entry) => entry.method === 'get' && !hasRequiredPathOrQueryParameters(entry, openApi),
    );

    test.skip(smokeOperations.length === 0, 'No documented GET operations without required path/query parameters were found.');

    for (const entry of smokeOperations) {
      if (!authToken && isSecuredOperation(entry, openApi)) {
        testInfo.annotations.push({
          type: 'skip',
          description: `${entry.method.toUpperCase()} ${entry.path} requires auth and no Cognito credentials were configured.`,
        });
        continue;
      }

      const response = await api.request(entry.method, entry.path);
      const documentedStatuses = Object.keys(entry.operation.responses ?? {});
      const actualStatus = String(response.status());

      if (!authToken && ['401', '403'].includes(actualStatus)) {
        testInfo.annotations.push({
          type: 'warning',
          description: `${entry.method.toUpperCase()} ${entry.path} returned ${actualStatus} without auth; configure Cognito secrets to validate it.`,
        });
        continue;
      }

      expect(
        documentedStatuses.includes(actualStatus) || documentedStatuses.includes('default'),
        `${entry.method.toUpperCase()} ${entry.path} returned ${actualStatus}; documented statuses: ${documentedStatuses.join(', ')}`,
      ).toBeTruthy();
    }
  });
});
