import { test, expect } from '../../fixtures/ui';
import { products } from '../../data/products';
import { validCustomer, missingFieldCases, type CustomerInfo } from '../../data/checkout';

test.describe('Cart and checkout', () => {
  test('removing an item from the cart page empties the cart', { tag: ['@regression'] }, async ({
    loggedInPage,
    cartPage,
  }) => {
    await loggedInPage.addToCart(products.backpack);
    await loggedInPage.openCart();
    await cartPage.expectLoaded();
    await expect(cartPage.item(products.backpack)).toBeVisible();

    await cartPage.remove(products.backpack);

    await expect(cartPage.items).toHaveCount(0);
    await expect(loggedInPage.cartBadge).toBeHidden();
  });

  test('completes a purchase and the totals add up', { tag: ['@smoke'] }, async ({
    loggedInPage,
    cartPage,
    checkoutPage,
  }) => {
    const selected = [products.backpack, products.boltTShirt];
    for (const product of selected) {
      await loggedInPage.addToCart(product);
    }

    await loggedInPage.openCart();
    await cartPage.expectLoaded();
    await expect(cartPage.itemNames).toHaveText(selected);
    await cartPage.checkout();

    await checkoutPage.fillCustomerInfo(validCustomer);
    await checkoutPage.continue();
    await checkoutPage.expectOnOverview();
    await expect(checkoutPage.itemPrices).toHaveCount(selected.length);

    const { prices, subtotal, tax, total } = await checkoutPage.amounts();
    const sumOfItems = prices.reduce((acc, p) => acc + p, 0);
    expect(subtotal).toBeCloseTo(sumOfItems, 2);
    expect(total).toBeCloseTo(subtotal + tax, 2);

    await checkoutPage.finish();
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
    await expect(loggedInPage.cartBadge).toBeHidden();
  });

  test.describe('checkout form validation', () => {
    test.beforeEach(async ({ loggedInPage, cartPage }) => {
      await loggedInPage.addToCart(products.backpack);
      await loggedInPage.openCart();
      await cartPage.checkout();
    });

    for (const { field, expectedError } of missingFieldCases) {
      test(`shows an error when ${field} is empty`, { tag: ['@regression'] }, async ({ page, checkoutPage }) => {
        const info: Partial<CustomerInfo> = { ...validCustomer, [field]: '' };

        await checkoutPage.fillCustomerInfo(info);
        await checkoutPage.continue();

        await expect(checkoutPage.error).toHaveText(expectedError);
        await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
      });
    }
  });
});
