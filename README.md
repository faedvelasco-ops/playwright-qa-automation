# Playwright QA Automation

[![Playwright Tests](https://github.com/faedvelasco-ops/playwright-qa-automation/actions/workflows/playwright.yml/badge.svg)](https://github.com/faedvelasco-ops/playwright-qa-automation/actions/workflows/playwright.yml)

UI and API test automation portfolio built with **Playwright + TypeScript**.
It targets two public practice applications:

- **UI:** [SauceDemo](https://www.saucedemo.com), a demo e-commerce site, on Chromium, Firefox and WebKit.
- **API:** [Restful Booker](https://restful-booker.herokuapp.com), a public booking API sandbox.

## What is covered

| Area | Scenario | Tags |
| --- | --- | --- |
| UI · Login | Standard user logs in and sees the product list | `@smoke` |
| UI · Login | Invalid credentials show an error | `@regression` |
| UI · Login | Locked out user cannot log in | `@regression` |
| UI · Inventory | Sort by price (low to high) | `@regression` |
| UI · Inventory | Sort by name (Z to A) | `@regression` |
| UI · Inventory | Add / remove products updates the cart badge | `@smoke` |
| UI · Cart | Remove an item from the cart page | `@regression` |
| UI · Checkout | Full purchase; subtotal, tax and total add up | `@smoke` |
| UI · Checkout | Required-field validation (first name, last name, postal code; data-driven) | `@regression` |
| API · Auth | Health check (`/ping`) | `@smoke` |
| API · Auth | Valid credentials return a token (schema checked) | `@smoke` |
| API · Auth | Invalid credentials do not return a token | `@regression` |
| API · Booking | Create booking: status, content type and response schema | `@smoke` |
| API · Booking | Get by id, filter by name | `@regression` |
| API · Booking | Update (PUT) and partial update (PATCH) with token | `@regression` |
| API · Booking | Update without token is rejected (403) and data is unchanged | `@regression` |
| API · Booking | Delete, then GET returns 404 | `@regression` |
| API · Booking | Incomplete payload does not create a booking | `@regression` |
| API · Chained | Create → read → update → delete, each step using the previous step's data | `@smoke` |

**Totals:** 11 UI tests (× 3 browsers = 33 runs) and 12 API tests.

## Tech stack

- [Playwright Test](https://playwright.dev) (UI and `request` API testing)
- TypeScript (strict mode, type-checked in CI)
- [zod](https://zod.dev) for API response schema validation
- dotenv for environment configuration
- GitHub Actions for CI, HTML report as a build artifact

## Project structure

```text
.
├── .github/workflows/playwright.yml   # CI: type check, run all projects, upload report
├── api/
│   ├── BookingClient.ts               # Thin wrapper over Playwright's APIRequestContext
│   └── schemas.ts                     # zod schemas for API responses
├── data/                              # Test data: users, products, checkout, bookings, messages
├── fixtures/
│   ├── ui.ts                          # Page object fixtures + loggedInPage
│   └── api.ts                         # bookingApi (with cleanup) + worker-scoped authToken
├── pages/                             # Page Object Model for SauceDemo
├── tests/
│   ├── ui/                            # login, inventory, checkout specs
│   └── api/                           # auth, booking CRUD, chained lifecycle specs
├── playwright.config.ts
└── tsconfig.json
```

## Getting started

Requirements: Node.js 20 or later.

```bash
npm ci
npx playwright install chromium firefox webkit
cp .env.example .env   # optional; defaults point to the public demo sites
```

### Running tests

| Command | What it runs |
| --- | --- |
| `npm test` | Everything (UI on 3 browsers + API) |
| `npm run test:ui` | UI tests on Chromium, Firefox and WebKit |
| `npm run test:api` | API tests only |
| `npm run test:smoke` | Tests tagged `@smoke` |
| `npm run test:regression` | Tests tagged `@regression` |
| `npm run test:headed` | UI tests on Chromium with a visible browser |
| `npm run typecheck` | TypeScript type check |
| `npm run report` | Opens the last HTML report |

Extra Playwright flags can be passed after `--`, for example
`npm run test:ui -- --project=chromium` or `npm test -- --repeat-each=5`.

## Design decisions

**Page Object Model.** Each SauceDemo screen has a class in `pages/` that owns its
locators and user actions (`login`, `addToCart`, `checkout`). Tests read as
scenarios and a UI change is fixed in one place. Assertions about the scenario stay
in the tests; page objects only assert what is needed to know a page is ready.

**Fixtures over `beforeEach` boilerplate.** `fixtures/ui.ts` injects the page objects
and a `loggedInPage` fixture, so tests that are not about login start authenticated
without repeating the steps. On the API side, a worker-scoped `authToken` is requested
once per worker, and the `bookingApi` fixture deletes every booking a test created.

**Locators.** User-facing roles first (`getByRole('button', { name: 'Login' })`),
and `getByTestId` for elements without an accessible name. The config sets
`testIdAttribute: 'data-test'`, the attribute SauceDemo exposes. No CSS or XPath chains.

**Waiting.** No `waitForTimeout`. The suite relies on Playwright's auto-waiting and
web-first assertions (`toHaveText`, `toHaveCount`, `toHaveURL`). Running the suite
on WebKit with repeats surfaced two real race conditions, and both were fixed by
waiting on a visible state instead of sleeping:

- `allTextContents()` does not auto-wait, so the checkout test asserts the item count
  before reading prices, and `sortBy()` waits for the active sort label to change.
- On WebKit, the first checkout field typed right after the step renders was
  occasionally reset to empty. `fillCustomerInfo()` retries the fill with
  `expect().toPass()` until the input holds the value.

**Test data.** Static data lives in `data/` (users, products, expected messages, the
data-driven checkout cases). API tests build bookings with a factory that gives each
one a unique last name, because Restful Booker is a shared sandbox and other people's
data is always present.

**API assertions.** API tests check the status code first; responses that return a
booking or a token are validated against a zod schema before values are compared. Restful Booker has a few non-standard
responses, and the tests assert the real behavior and document it instead of
hiding it:

- Invalid credentials return `200` with `{"reason":"Bad credentials"}` instead of `401`.
- A successful `DELETE` returns `201`.
- A booking with missing fields returns `500` instead of a `400` validation error
  (marked with a `known issue` annotation in the report).

**CI.** Retries (2) and `forbidOnly` are enabled only in CI. Traces are recorded on
the first retry, screenshots and videos are kept only on failure, and the HTML report
is uploaded as an artifact on every run.

## Known limitations

- Both targets are public demo services that the project does not control. If one
  is down or changes its markup or API, tests fail for reasons outside this code.
  Restful Booker in particular can be slow or reset its data periodically.
- UI login goes through the form on every test (fast on SauceDemo). See the roadmap
  for a `storageState` approach.

## Optional: publish the report to GitHub Pages

The workflow can deploy the latest `main` report to GitHub Pages. It is off by default:

1. In the repository settings, set **Pages → Source** to **GitHub Actions**.
2. Add a repository variable `DEPLOY_REPORT` with the value `true`.

## Roadmap

- [ ] Reuse authentication with `storageState` in a setup project
- [ ] Visual comparisons (`toHaveScreenshot`) for key pages
- [ ] Accessibility checks with `@axe-core/playwright`
- [ ] Mobile viewport projects
- [ ] ESLint + Prettier with a pre-commit hook
- [ ] Shard the UI suite across CI jobs when it grows
