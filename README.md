# SauceDemo checkout test

An automated test for the main purchase flow on [SauceDemo](https://www.saucedemo.com), written with [Playwright](https://playwright.dev).

## What it tests

1. Logs in as `standard_user`.
2. Adds two products and checks the cart badge shows **2**.
3. Opens the cart and checks it lists exactly those two products.
4. Fills in customer information.
5. Checks the totals: **Item total $39.98**, **Tax $3.20**, **Total $43.18**.
6. Finishes the order and checks the confirmation message appears **and** the cart is empty.

## Setup (one time)

You need [Node.js](https://nodejs.org) 22 or newer. Then, in this folder, run:

```bash
npm install
npx playwright install chromium
```

## Run the test

| Command | What happens |
| --- | --- |
| `npm test` | Runs in the background (no window). Takes about 5 seconds. |
| `npm run test:headed` | Opens a browser window so you can watch, with each step slowed down. |

A passing run ends with `pass 1` and `fail 0`.

## When the test fails

- The error shows what was expected and what was actually on the page.
- A screenshot of the page at the moment of failure is saved as `failure.png` in the project folder (next to `package.json`), and the terminal prints `Screenshot saved: failure.png`.
- A failing run takes about 10 seconds longer than usual, because each check waits up to 10 seconds for the right text before giving up.
- `failure.png` is listed in `.gitignore`, so it is never pushed to GitHub. On GitHub Actions it is attached to the failed run instead (see below).

### Check that the screenshot works

Make the test fail on purpose, then confirm the screenshot appears:

1. Delete any old `failure.png` from the project folder, so you know the next one is new.
2. Open `tests/checkout.e2e.test.js` and change the expected total near the top:
   ```js
   total: 'Total: $43.19'   // was 'Total: $43.18'
   ```
3. Run `npm test`. After about 10 seconds the test fails with:
   ```
   + actual - expected
   + 'Total: $43.18'
   - 'Total: $43.19'
   ```
   and the terminal shows `Screenshot saved: failure.png`.
4. Open `failure.png` in the project folder. It should show the checkout overview page with **Total: $43.18**.
5. Change the total back to `$43.18` and delete `failure.png`. Run `npm test` again to confirm it passes.

This also proves the totals check really catches a wrong value.

## GitHub Actions

The workflow in `.github/workflows/e2e.yml` runs the test automatically on every push. See the results in the repository's **Actions** tab. If a run fails, open it and download **failure-screenshot** from the **Artifacts** section at the bottom of the page.

## Notes

- Elements are found by their `data-test` attributes, which are made for testing and don't change when the page is restyled.
- The test never pauses for a fixed time; it waits only until each element is ready.
- Each run starts with a fresh browser, so the cart is always empty at the start.
- It covers one user and one browser (Chromium, the engine behind Google Chrome).
