import { test, expect } from '../fixtures/openapi.fixture';
import { hasRequiredPathOrQueryParameters, listOperations } from '../openapi/loader';

test.describe('documented read-only API smoke @smoke @readonly', () => {
  test('documented GET endpoints without required path/query parameters respond with a documented status', async ({ api, openApi }) => {
    const smokeOperations = listOperations(openApi).filter(
      (entry) => entry.method === 'get' && !hasRequiredPathOrQueryParameters(entry, openApi),
    );

    test.skip(smokeOperations.length === 0, 'No documented GET operations without required path/query parameters were found.');

    for (const entry of smokeOperations) {
      const response = await api.request(entry.method, entry.path);
      const documentedStatuses = Object.keys(entry.operation.responses ?? {});
      const actualStatus = String(response.status());

      expect(
        documentedStatuses.includes(actualStatus) || documentedStatuses.includes('default'),
        `${entry.method.toUpperCase()} ${entry.path} returned ${actualStatus}; documented statuses: ${documentedStatuses.join(', ')}`,
      ).toBeTruthy();
    }
  });
});
