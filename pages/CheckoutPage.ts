import { expect, type Locator, type Page } from '@playwright/test';
import type { CustomerInfo } from '../data/checkout';

/** Reads the amount out of labels like "Item total: $12.34". */
export function parseAmount(text: string): number {
  const match = text.match(/\$(\d+(?:\.\d+)?)/);
  if (!match) throw new Error(`No amount found in "${text}"`);
  return Number(match[1]);
}

/**
 * SauceDemo's checkout is three short screens (information -> overview -> complete).
 * They are small enough to live in one page object, grouped by step.
 */
export class CheckoutPage {
  readonly title: Locator;

  // Step one: customer information
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly error: Locator;

  // Step two: overview
  readonly itemPrices: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly finishButton: Locator;

  // Complete
  readonly completeHeader: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');

    this.firstName = page.getByTestId('firstName');
    this.lastName = page.getByTestId('lastName');
    this.postalCode = page.getByTestId('postalCode');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.error = page.getByTestId('error');

    this.itemPrices = page.getByTestId('inventory-item-price');
    this.subtotal = page.getByTestId('subtotal-label');
    this.tax = page.getByTestId('tax-label');
    this.total = page.getByTestId('total-label');
    this.finishButton = page.getByRole('button', { name: 'Finish' });

    this.completeHeader = page.getByTestId('complete-header');
  }

  async expectOnInformation() {
    await expect(this.page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(this.title).toHaveText('Checkout: Your Information');
  }

  /**
   * Fills only the fields provided and verifies each value stuck.
   *
   * Known issue (WebKit only, roughly 1 run in 8 locally): the first value typed
   * right after this step renders is sometimes reset to "" by the app, which
   * surfaced as a misleading "First Name is required" error. The fill is retried
   * with expect().toPass() until the input holds the value; no fixed sleeps.
   */
  async fillCustomerInfo(info: Partial<CustomerInfo>) {
    await this.expectOnInformation();
    const fields: [Locator, string | undefined][] = [
      [this.firstName, info.firstName],
      [this.lastName, info.lastName],
      [this.postalCode, info.postalCode],
    ];
    for (const [input, value] of fields) {
      if (!value) continue;
      await expect(async () => {
        await input.fill(value);
        await expect(input).toHaveValue(value, { timeout: 1_000 });
      }).toPass({ timeout: 10_000 });
    }
  }

  async continue() {
    await this.continueButton.click();
  }

  async expectOnOverview() {
    await expect(this.page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(this.title).toHaveText('Checkout: Overview');
  }

  /**
   * allTextContents() does not auto-wait, so callers should first assert the
   * expected item count (a web-first assertion) before reading amounts.
   */
  async amounts() {
    const prices = (await this.itemPrices.allTextContents()).map(parseAmount);
    return {
      prices,
      subtotal: parseAmount(await this.subtotal.innerText()),
      tax: parseAmount(await this.tax.innerText()),
      total: parseAmount(await this.total.innerText()),
    };
  }

  async finish() {
    await this.finishButton.click();
  }
}
