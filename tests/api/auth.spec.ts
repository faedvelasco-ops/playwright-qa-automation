import { test, expect } from '../../fixtures/api';
import { authTokenSchema } from '../../api/schemas';
import { adminCredentials } from '../../data/bookings';

test.describe('Health check and auth', () => {
  test('API is up', { tag: ['@smoke'] }, async ({ bookingApi }) => {
    const response = await bookingApi.ping();
    // Restful Booker answers /ping with 201 Created.
    expect(response.status()).toBe(201);
  });

  test('valid credentials return a token', { tag: ['@smoke'] }, async ({ bookingApi }) => {
    const response = await bookingApi.createToken(adminCredentials);

    expect(response.status()).toBe(200);
    const result = authTokenSchema.safeParse(await response.json());
    expect(result.success, JSON.stringify(result.error?.issues)).toBe(true);
  });

  test('invalid credentials do not return a token', { tag: ['@regression'] }, async ({ bookingApi }) => {
    const response = await bookingApi.createToken({ username: 'admin', password: 'wrong' });

    // Documented quirk: the API answers 200 with a "reason" instead of 401.
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ reason: 'Bad credentials' });
    expect(body).not.toHaveProperty('token');
  });
});
