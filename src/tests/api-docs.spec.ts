import { test, expect } from '../fixtures/openapi.fixture';
import { listOperations } from '../openapi/loader';

test.describe('API documentation contract @contract @readonly', () => {
  test('API docs URL exposes an OpenAPI document', async ({ openApi }) => {
    expect(openApi.openapi ?? openApi.swagger).toBeTruthy();
    expect(openApi.info?.title).toBeTruthy();
    expect(openApi.paths).toBeTruthy();
    expect(listOperations(openApi).length).toBeGreaterThan(0);
  });

  test('every documented operation has a response contract', async ({ openApi }) => {
    for (const entry of listOperations(openApi)) {
      expect(entry.operation.responses, `${entry.method.toUpperCase()} ${entry.path}`).toBeTruthy();
      expect(Object.keys(entry.operation.responses ?? {}).length, `${entry.method.toUpperCase()} ${entry.path}`).toBeGreaterThan(0);
    }
  });
});
