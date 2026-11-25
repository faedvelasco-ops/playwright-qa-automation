import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Booking } from './schemas';

export type Credentials = { username: string; password: string };

/**
 * Thin wrapper over Playwright's APIRequestContext for Restful Booker.
 * Methods return the raw APIResponse so each test asserts status and body itself.
 */
export class BookingClient {
  /** Ids created through this client, so the fixture can clean them up afterwards. */
  readonly createdIds = new Set<number>();

  constructor(private readonly request: APIRequestContext) {}

  ping(): Promise<APIResponse> {
    return this.request.get('/ping');
  }

  createToken(credentials: Credentials): Promise<APIResponse> {
    return this.request.post('/auth', { data: credentials });
  }

  async create(booking: Partial<Booking>): Promise<APIResponse> {
    const response = await this.request.post('/booking', { data: booking });
    if (response.ok()) {
      const body = await response.json();
      this.createdIds.add(body.bookingid);
    }
    return response;
  }

  get(id: number): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  list(filter: { firstname?: string; lastname?: string } = {}): Promise<APIResponse> {
    return this.request.get('/booking', { params: filter });
  }

  update(id: number, booking: Booking, token?: string): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: booking, headers: authHeader(token) });
  }

  partialUpdate(id: number, changes: Partial<Booking>, token?: string): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, { data: changes, headers: authHeader(token) });
  }

  async delete(id: number, token?: string): Promise<APIResponse> {
    const response = await this.request.delete(`/booking/${id}`, { headers: authHeader(token) });
    if (response.ok()) this.createdIds.delete(id);
    return response;
  }
}

/** Restful Booker accepts the token as a cookie named "token". */
function authHeader(token?: string): Record<string, string> {
  return token ? { Cookie: `token=${token}` } : {};
}
