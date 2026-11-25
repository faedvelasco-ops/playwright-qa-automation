import { expect, type Locator, type Page } from '@playwright/test';

export type SortOption = 'az' | 'za' | 'lohi' | 'hilo';

/** Turns a product name into the slug SauceDemo uses in its data-test ids. */
const slug = (productName: string) => productName.toLowerCase().replace(/\s+/g, '-');

export class InventoryPage {
  readonly title: Locator;
  readonly sortSelect: Locator;
  readonly itemNames: Locator;
  readonly itemPrices: Locator;
  readonly cartLink: Locator;
  readonly cartBadge: Locator;

  constructor(private readonly page: Page) {
    this.title = page.getByTestId('title');
    this.sortSelect = page.getByTestId('product-sort-container');
    this.itemNames = page.getByTestId('inventory-item-name');
    this.itemPrices = page.getByTestId('inventory-item-price');
    this.cartLink = page.getByTestId('shopping-cart-link');
    this.cartBadge = page.getByTestId('shopping-cart-badge');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/inventory\.html$/);
    await expect(this.title).toHaveText('Products');
  }

  async sortBy(option: SortOption) {
    await this.sortSelect.selectOption(option);
  }

  async names(): Promise<string[]> {
    return this.itemNames.allTextContents();
  }

  async prices(): Promise<number[]> {
    const texts = await this.itemPrices.allTextContents();
    return texts.map((t) => Number(t.replace('$', '')));
  }

  addToCartButton(productName: string): Locator {
    return this.page.getByTestId(`add-to-cart-${slug(productName)}`);
  }

  removeButton(productName: string): Locator {
    return this.page.getByTestId(`remove-${slug(productName)}`);
  }

  async addToCart(productName: string) {
    await this.addToCartButton(productName).click();
    await expect(this.removeButton(productName)).toBeVisible();
  }

  async removeFromCart(productName: string) {
    await this.removeButton(productName).click();
    await expect(this.addToCartButton(productName)).toBeVisible();
  }

  async openCart() {
    await this.cartLink.click();
  }
}
