import { test as base, expect } from '@playwright/test';
import { BookingClient } from '../api/BookingClient';
import { authTokenSchema } from '../api/schemas';
import { adminCredentials } from '../data/bookings';

type ApiFixtures = {
  /** Booking client that deletes whatever it created when the test ends. */
  bookingApi: BookingClient;
};

type ApiWorkerFixtures = {
  /** One auth token per worker instead of one per test. */
  authToken: string;
};

export const test = base.extend<ApiFixtures, ApiWorkerFixtures>({
  authToken: [
    async ({ playwright }, use, workerInfo) => {
      const context = await playwright.request.newContext({
        baseURL: workerInfo.project.use.baseURL,
      });
      const response = await context.post('/auth', { data: adminCredentials });
      expect(response.status()).toBe(200);
      const { token } = authTokenSchema.parse(await response.json());
      await context.dispose();
      await use(token);
    },
    { scope: 'worker', timeout: 60_000 },
  ],

  bookingApi: async ({ request }, use) => {
    const client = new BookingClient(request);
    await use(client);
    // Teardown: best-effort cleanup so the shared sandbox does not fill up with test data.
    // The token is requested only when there is something to delete, so tests that
    // never need auth (ping, auth checks) do not depend on it.
    if (client.createdIds.size === 0) return;
    const tokenResponse = await client.createToken(adminCredentials);
    const { token } = authTokenSchema.parse(await tokenResponse.json());
    for (const id of [...client.createdIds]) {
      await client.delete(id, token);
    }
  },
});

export { expect };
