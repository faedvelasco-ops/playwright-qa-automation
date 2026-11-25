import { test, expect } from '../../fixtures/api';
import { bookingSchema, createBookingResponseSchema } from '../../api/schemas';
import { buildBooking } from '../../data/bookings';

/**
 * Chained scenario: each step uses data produced by the previous one
 * (token -> booking id -> updated state), the way a real client would.
 */
test('booking lifecycle: create, read, update, delete', { tag: ['@smoke'] }, async ({
  bookingApi,
  authToken,
}) => {
  const original = buildBooking();
  let bookingId = 0;

  await test.step('create', async () => {
    const response = await bookingApi.create(original);
    expect(response.status()).toBe(200);
    bookingId = createBookingResponseSchema.parse(await response.json()).bookingid;
  });

  await test.step('read it back', async () => {
    const response = await bookingApi.get(bookingId);
    expect(response.status()).toBe(200);
    expect(bookingSchema.parse(await response.json())).toEqual(original);
  });

  await test.step('change the dates', async () => {
    const newDates = { checkin: '2027-02-01', checkout: '2027-02-03' };
    const response = await bookingApi.partialUpdate(bookingId, { bookingdates: newDates }, authToken);
    expect(response.status()).toBe(200);

    const stored = bookingSchema.parse(await (await bookingApi.get(bookingId)).json());
    expect(stored.bookingdates).toEqual(newDates);
    expect(stored.lastname).toBe(original.lastname);
  });

  await test.step('delete it', async () => {
    expect((await bookingApi.delete(bookingId, authToken)).status()).toBe(201);
    expect((await bookingApi.get(bookingId)).status()).toBe(404);
  });
});
