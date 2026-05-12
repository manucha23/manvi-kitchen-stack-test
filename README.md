# Manvi Kitchen API Tests

External black-box API checks for Manvi Kitchen. This repo intentionally derives executable coverage from the published API definitions at `https://api-doc.test.cravnest.in/` instead of hard-coding unverified endpoint names, payloads, or business rules.

## Why the tests are OpenAPI-driven

The first scaffold contained speculative tests based on desired behavior. This version treats the published API documentation as the source of truth:

1. Load the OpenAPI/Swagger definition from `API_DOCS_URL`.
2. Validate that every documented operation declares response contracts.
3. Resolve the target base URL from `API_BASE_URL` or the OpenAPI `servers`/Swagger `host` section.
4. Run read-only smoke checks against documented `GET` operations that do not require path/query input.
5. Use Cognito only when credentials are provided.

Write/create/update regression tests should be added only after their endpoint paths, payloads, response shapes, data setup, and cleanup rules are confirmed from the actual API definition.

## Test modes

- `contract`: documentation-only checks against the OpenAPI definition.
- `smoke`: read-only runtime checks against documented safe `GET` operations. Secured operations are skipped when Cognito credentials are not configured; unauthenticated `401`/`403` responses are reported as warnings instead of failing the whole run.
- `readonly`: production-safe combination tag used by both contract and smoke tests.

## Required and optional environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `API_DOCS_URL` | No | API documentation URL. Defaults to `https://api-doc.test.cravnest.in/`. |
| `API_BASE_URL` | Sometimes | Target API URL. Required only when the OpenAPI document does not include a server URL. |
| `COGNITO_REGION` | No | AWS region for optional Cognito smoke authentication. |
| `COGNITO_CLIENT_ID` | No | Cognito app client ID for optional authentication. |
| `TEST_USERNAME` | No | Dedicated API test user for optional authentication. |
| `TEST_PASSWORD` | No | Dedicated API test password for optional authentication. |
| `TEST_MODE` | No | Usually `contract`, `smoke`, or `readonly`. |

## Local commands

```bash
npm install
npm run typecheck
npm run test:contract
npm run test:smoke
npm run test:readonly
```

## Adding business regression tests

Before adding tests that create items, configure capacity, or mutate orders, capture the exact contract from the API documentation or backend implementation:

- endpoint path and HTTP method;
- request schema and examples;
- required authentication/authorization;
- expected response status and body;
- test data setup and cleanup;
- production safety rules.

This keeps the suite aligned with actual functionality instead of assumptions.
