import { test, expect } from '../../fixtures/ui';
import { products } from '../../data/products';

test.describe('Inventory', () => {
  test('sorts products by price, low to high', { tag: ['@regression'] }, async ({ loggedInPage }) => {
    await loggedInPage.sortBy('lohi');

    const prices = await loggedInPage.prices();
    expect(prices.length).toBeGreaterThan(1);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
  });

  test('sorts products by name, Z to A', { tag: ['@regression'] }, async ({ loggedInPage }) => {
    await loggedInPage.sortBy('za');

    const names = await loggedInPage.names();
    expect(names.length).toBeGreaterThan(1);
    expect(names).toEqual([...names].sort((a, b) => b.localeCompare(a)));
  });

  test('adding and removing products updates the cart badge', { tag: ['@smoke'] }, async ({
    loggedInPage,
  }) => {
    await expect(loggedInPage.cartBadge).toBeHidden();

    await loggedInPage.addToCart(products.backpack);
    await loggedInPage.addToCart(products.bikeLight);
    await expect(loggedInPage.cartBadge).toHaveText('2');

    await loggedInPage.removeFromCart(products.backpack);
    await expect(loggedInPage.cartBadge).toHaveText('1');

    await loggedInPage.removeFromCart(products.bikeLight);
    await expect(loggedInPage.cartBadge).toBeHidden();
  });
});
