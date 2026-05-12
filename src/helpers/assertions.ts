import { APIResponse, expect } from '@playwright/test';

export async function expectOk(response: APIResponse): Promise<void> {
  const body = await response.text();
  expect(response.status(), body).toBeGreaterThanOrEqual(200);
  expect(response.status(), body).toBeLessThan(300);
}

export async function expectStatus(response: APIResponse, status: number): Promise<void> {
  expect(response.status(), await response.text()).toBe(status);
}

export async function expectOneOfStatuses(response: APIResponse, statuses: number[]): Promise<void> {
  expect(statuses, await response.text()).toContain(response.status());
}

export async function jsonBody<T = unknown>(response: APIResponse): Promise<T> {
  await expectOk(response);
  return response.json() as Promise<T>;
}
