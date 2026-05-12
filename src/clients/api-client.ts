import { APIRequestContext, request } from '@playwright/test';

export class ApiClient {
  constructor(private readonly context: APIRequestContext) {}

  static async create(baseUrl: string, token?: string): Promise<ApiClient> {
    const context = await request.newContext({
      baseURL: baseUrl,
      extraHTTPHeaders: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    return new ApiClient(context);
  }

  async dispose(): Promise<void> {
    await this.context.dispose();
  }

  async request(method: string, path: string) {
    return this.context.fetch(path, { method: method.toUpperCase() });
  }
}
