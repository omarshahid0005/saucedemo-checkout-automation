const test = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const BASE_URL = 'https://www.saucedemo.com/';
const HEADED = process.env.HEADED === '1';

const USERNAME = 'standard_user';
const PASSWORD = 'secret_sauce';
const CUSTOMER = { firstName: 'Ada', lastName: 'Lovelace', postalCode: '12345' };

const PRODUCTS = [
  { name: 'Sauce Labs Backpack', addButton: 'add-to-cart-sauce-labs-backpack' },
  { name: 'Sauce Labs Bike Light', addButton: 'add-to-cart-sauce-labs-bike-light' }
];

// Backpack $29.99 + Bike Light $9.99 = $39.98, plus 8% tax ($3.20) = $43.18
const EXPECTED = {
  itemTotal: 'Item total: $39.98',
  tax: 'Tax: $3.20',
  total: 'Total: $43.18'
};

// Finds an element by its data-test attribute.
function byTest(page, id) {
  return page.locator(`[data-test="${id}"]`);
}

// Waits until the element shows the expected text, then checks it exactly.
async function expectText(locator, expected) {
  await locator.filter({ hasText: expected }).waitFor({ timeout: 10000 }).catch(() => {});
  assert.equal((await locator.innerText()).trim(), expected);
}

// Waits until the cart badge is gone (meaning the cart is empty).
async function expectEmptyCart(page) {
  await byTest(page, 'shopping-cart-badge').waitFor({ state: 'hidden', timeout: 10000 });
}

test('standard user can complete a two-product checkout', async (t) => {
  // Fresh browser for every run, so the cart always starts empty.
  // When HEADED=1, the browser window is shown and each action is slowed down.
  const browser = await chromium.launch({ headless: !HEADED, slowMo: HEADED ? 400 : 0 });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  t.after(() => browser.close());

  try {
    // 1. Log in
    await page.goto(BASE_URL);
    await byTest(page, 'username').fill(USERNAME);
    await byTest(page, 'password').fill(PASSWORD);
    await byTest(page, 'login-button').click();
    await page.waitForURL(/inventory\.html/);
    await expectText(byTest(page, 'title'), 'Products');
    await expectEmptyCart(page);

    // 2. Add two products; the cart badge should show 2
    for (const product of PRODUCTS) {
      await byTest(page, product.addButton).click();
    }
    await expectText(byTest(page, 'shopping-cart-badge'), '2');

    // 3. Open the cart; it should list exactly the two products
    await byTest(page, 'shopping-cart-link').click();
    await page.waitForURL(/cart\.html/);
    // The URL changes before the cart is drawn, so wait for the cart's own title first.
    await expectText(byTest(page, 'title'), 'Your Cart');
    const cartItems = byTest(page, 'inventory-item-name');
    for (const [i, product] of PRODUCTS.entries()) {
      await expectText(cartItems.nth(i), product.name);
    }
    assert.equal(await cartItems.count(), PRODUCTS.length);

    // 4. Enter customer information
    await byTest(page, 'checkout').click();
    await byTest(page, 'firstName').fill(CUSTOMER.firstName);
    await byTest(page, 'lastName').fill(CUSTOMER.lastName);
    await byTest(page, 'postalCode').fill(CUSTOMER.postalCode);
    await byTest(page, 'continue').click();
    await page.waitForURL(/checkout-step-two\.html/);

    // 5. Check the totals on the overview page
    await expectText(byTest(page, 'subtotal-label'), EXPECTED.itemTotal);
    await expectText(byTest(page, 'tax-label'), EXPECTED.tax);
    await expectText(byTest(page, 'total-label'), EXPECTED.total);

    // 6. Finish; the confirmation should show AND the cart should be empty.
    //    (The confirmation alone isn't proof: SauceDemo also shows it for an empty cart.)
    await byTest(page, 'finish').click();
    await page.waitForURL(/checkout-complete\.html/);
    await expectText(byTest(page, 'complete-header'), 'Thank you for your order!');
    await expectEmptyCart(page);
  } catch (error) {
    // Save a screenshot of the page where the test failed (in the project folder).
    await page.screenshot({ path: 'failure.png', fullPage: true })
      .then(() => console.log('Screenshot saved: failure.png'))
      .catch((e) => console.log('Could not save screenshot:', e.message));
    throw error;
  }
});
