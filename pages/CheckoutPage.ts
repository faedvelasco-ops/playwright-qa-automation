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

  async fillCustomerInfo(info: Partial<CustomerInfo>) {
    if (info.firstName) await this.firstName.fill(info.firstName);
    if (info.lastName) await this.lastName.fill(info.lastName);
    if (info.postalCode) await this.postalCode.fill(info.postalCode);
  }

  async continue() {
    await this.continueButton.click();
  }

  async expectOnOverview() {
    await expect(this.page).toHaveURL(/\/checkout-step-two\.html$/);
  }

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
