/**
 * SauceDemo demo accounts. They are published on the site's login page,
 * so they are not secrets; the password can still be overridden via .env.
 */
const password = process.env.SAUCE_PASSWORD ?? 'secret_sauce';

export type User = { username: string; password: string };

export const users = {
  standard: { username: 'standard_user', password },
  lockedOut: { username: 'locked_out_user', password },
  invalid: { username: 'not_a_real_user', password: 'wrong_password' },
} satisfies Record<string, User>;
