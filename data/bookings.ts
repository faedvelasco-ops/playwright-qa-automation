import type { Booking } from '../api/schemas';

/**
 * Restful Booker is a shared public sandbox, so every booking gets a unique
 * last name. That keeps filter queries deterministic even with other users' data.
 */
export function uniqueLastName(): string {
  return `QA-${Date.now()}-${Math.floor(Math.random() * 10_000)}`;
}

export function buildBooking(overrides: Partial<Booking> = {}): Booking {
  return {
    firstname: 'Ada',
    lastname: uniqueLastName(),
    totalprice: 150,
    depositpaid: true,
    bookingdates: { checkin: '2027-01-10', checkout: '2027-01-14' },
    additionalneeds: 'Breakfast',
    ...overrides,
  };
}

export const adminCredentials = {
  username: process.env.BOOKER_USERNAME ?? 'admin',
  password: process.env.BOOKER_PASSWORD ?? 'password123',
};
