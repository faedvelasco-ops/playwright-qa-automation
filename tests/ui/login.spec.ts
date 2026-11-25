import { test, expect } from '../../fixtures/ui';
import { users } from '../../data/users';
import { loginErrors } from '../../data/messages';

test.describe('Login', () => {
  test.beforeEach(async ({ loginPage }) => {
    await loginPage.goto();
  });

  test('standard user can log in and sees the product list', { tag: ['@smoke'] }, async ({
    loginPage,
    inventoryPage,
  }) => {
    await loginPage.login(users.standard);

    await inventoryPage.expectLoaded();
    await expect(inventoryPage.itemNames.first()).toBeVisible();
  });

  test('invalid credentials show an error and stay on the login page', { tag: ['@regression'] }, async ({
    page,
    loginPage,
  }) => {
    await loginPage.login(users.invalid);

    await expect(loginPage.error).toHaveText(loginErrors.invalidCredentials);
    await expect(page).not.toHaveURL(/inventory/);
  });

  test('locked out user cannot log in', { tag: ['@regression'] }, async ({ page, loginPage }) => {
    await loginPage.login(users.lockedOut);

    await expect(loginPage.error).toHaveText(loginErrors.lockedOut);
    await expect(page).not.toHaveURL(/inventory/);
  });
});
