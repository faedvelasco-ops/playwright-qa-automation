import { test, expect } from '../../fixtures/api';
import { bookingSchema, createBookingResponseSchema, bookingIdListSchema } from '../../api/schemas';
import { buildBooking } from '../../data/bookings';
import type { BookingClient } from '../../api/BookingClient';

/** Creates a booking and returns its id, asserting the precondition succeeded. */
async function createBooking(api: BookingClient, overrides = {}) {
  const payload = buildBooking(overrides);
  const response = await api.create(payload);
  expect(response.status()).toBe(200);
  const { bookingid } = createBookingResponseSchema.parse(await response.json());
  return { id: bookingid, payload };
}

test.describe('Booking CRUD', () => {
  test('creates a booking and echoes it back with a valid schema', { tag: ['@smoke'] }, async ({
    bookingApi,
  }) => {
    const payload = buildBooking();

    const response = await bookingApi.create(payload);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('application/json');
    const body = createBookingResponseSchema.parse(await response.json());
    expect(body.booking).toEqual(payload);
  });

  test('gets a booking by id', { tag: ['@regression'] }, async ({ bookingApi }) => {
    const { id, payload } = await createBooking(bookingApi);

    const response = await bookingApi.get(id);

    expect(response.status()).toBe(200);
    expect(bookingSchema.parse(await response.json())).toEqual(payload);
  });

  test('filters bookings by name', { tag: ['@regression'] }, async ({ bookingApi }) => {
    const { id, payload } = await createBooking(bookingApi);

    const response = await bookingApi.list({ firstname: payload.firstname, lastname: payload.lastname });

    expect(response.status()).toBe(200);
    const ids = bookingIdListSchema.parse(await response.json()).map((b) => b.bookingid);
    expect(ids).toEqual([id]);
  });

  test('updates a booking with PUT when authenticated', { tag: ['@regression'] }, async ({
    bookingApi,
    authToken,
  }) => {
    const { id } = await createBooking(bookingApi);
    const updated = buildBooking({ firstname: 'Grace', totalprice: 999, depositpaid: false });

    const response = await bookingApi.update(id, updated, authToken);

    expect(response.status()).toBe(200);
    expect(bookingSchema.parse(await response.json())).toEqual(updated);
  });

  test('partially updates a booking with PATCH', { tag: ['@regression'] }, async ({
    bookingApi,
    authToken,
  }) => {
    const { id, payload } = await createBooking(bookingApi);

    const response = await bookingApi.partialUpdate(id, { additionalneeds: 'Late checkout' }, authToken);

    expect(response.status()).toBe(200);
    expect(bookingSchema.parse(await response.json())).toEqual({
      ...payload,
      additionalneeds: 'Late checkout',
    });
  });

  test('rejects updates without a token', { tag: ['@regression'] }, async ({ bookingApi }) => {
    const { id, payload } = await createBooking(bookingApi);

    const response = await bookingApi.update(id, { ...payload, firstname: 'Intruder' });

    expect(response.status()).toBe(403);
    // And the booking is unchanged.
    expect(await (await bookingApi.get(id)).json()).toEqual(payload);
  });

  test('deletes a booking and it is no longer found', { tag: ['@regression'] }, async ({
    bookingApi,
    authToken,
  }) => {
    const { id } = await createBooking(bookingApi);

    const response = await bookingApi.delete(id, authToken);

    // Restful Booker answers a successful DELETE with 201 Created.
    expect(response.status()).toBe(201);
    expect((await bookingApi.get(id)).status()).toBe(404);
  });

  test('does not create a booking from an incomplete payload', { tag: ['@regression'] }, async ({
    bookingApi,
  }) => {
    test.info().annotations.push({
      type: 'known issue',
      description: 'The API answers 500 instead of a 400 validation error for missing fields.',
    });

    const response = await bookingApi.create({ firstname: 'OnlyAName' });

    expect(response.ok()).toBe(false);
    expect(response.status()).toBe(500);
  });
});
