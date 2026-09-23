# QA Automation & API Verification Project

This repository contains automated UI tests for [SauceDemo](https://www.saucedemo.com/) using **Playwright** with **TypeScript**, as well as an API verification script demonstrating a discrepancy in the public [Swagger Petstore API](https://petstore.swagger.io/).

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start (Run From Scratch)](#quick-start-run-from-scratch)
4. [Automated UI Tests (SauceDemo)](#automated-ui-tests-saucedemo)
   - [Tested Scenarios](#tested-scenarios)
5. [API Discrepancy Verification (index.ts)](#api-discrepancy-verification-indexts)
6. [Notice on .auth and .gitignore](#notice-on-auth-and-gitignore)

---

## Project Overview

- **UI Test Framework:** [Playwright](https://playwright.dev/) with TypeScript
- **Runtime:** [Bun](https://bun.com/) (also compatible with Node.js)
- **Target Applications:**
  - UI: [SauceDemo E-Commerce](https://www.saucedemo.com/)
  - API: [Swagger Petstore v2](https://petstore.swagger.io/)

---

## Prerequisites

Make sure you have one of the following installed:
- **[Bun](https://bun.sh/)** (recommended, v1.0+) OR **[Node.js](https://nodejs.org/)** (v18+)

---

## Quick Start (Run From Scratch)

### Step 1: Clone or Open the Repository

Navigate to the project root directory:

```bash
cd PlaywrightT
```

### Step 2: Install Dependencies

Using **Bun**:
```bash
bun install
```

*(Or using **NPM**: `npm install`)*

### Step 3: Install Playwright Browsers

Install the required browser binaries (Chromium):

```bash
bunx playwright install --with-deps chromium
```

*(Or using **NPX**: `npx playwright install --with-deps chromium`)*

---

## Automated UI Tests (SauceDemo)

### Running the Tests

- **Run all automated tests:**
  ```bash
  bun run test
  ```
  *(Or: `bunx playwright test` / `npx playwright test`)*

- **View the HTML test report:**
  ```bash
  bun run test:report
  ```

---

### Tested Scenarios

The test suite covers the key authentication and user flows for SauceDemo:

1. **Successful Login as `standard_user` (`tests/auth.setup.ts`)**:
   - Navigates to `https://www.saucedemo.com/`.
   - Fills valid credentials (`standard_user` / `secret_sauce`).
   - Verifies navigation to the inventory page (`/inventory.html`), visibility of the product catalog container, title, and store items.
   - Saves authentication state (`playwright/.auth/user-state.json`) for authenticated test reuse.

2. **Failed Login with Invalid Password (`tests/cart.test.ts`)**:
   - Attempts login with invalid credentials.
   - Asserts the error container is visible with the exact expected error message:
     ```
     Epic sadface: Username and password do not match any user in this service
     ```
   - Verifies the user remains on the login page and cannot access protected inventory resources.

3. **Login Attempt with `locked_out_user` (`tests/cart.test.ts`)**:
   - Attempts login using `locked_out_user` and valid password `secret_sauce`.
   - Asserts the specific locked-out error banner:
     ```
     Epic sadface: Sorry, this user has been locked out.
     ```
   - Verifies that the inventory page is not reached.

4. **Cart Operations (`tests/cart.test.ts`)**:
   - Adding items to the shopping cart and verifying badge count.
   - Removing items from the cart and confirming empty cart state.

---

## API Discrepancy Verification (index.ts)

`index.ts` contains an automated TypeScript check against the public **Swagger Petstore API** (`https://petstore.swagger.io/v2`).

### What is tested:
The script queries the endpoint `GET /pet/findByStatus` across three scenarios:
1. **Missing `status` parameter** — omitted query parameter marked as `required: true` in the specification.
2. **Invalid `status` value (`notarealstatus123`)** — passing a value not present in the documented enum (`["available", "pending", "sold"]`).
3. **Valid `status=available`** — control request for the happy path.

### The Discrepancy:
According to the official `swagger.json` specification:
- Invalid or missing parameters are documented to return **`400 Invalid status value`**.
- **Actual behavior:** The API returns **`HTTP 200 OK`** with an empty array `[]` for both missing and invalid values.

### How to Run:

```bash
bun run start
```
*(Or: `bun run index.ts` / `node index.ts`)*

**Expected Console Output:**
```text
A (no status): 200
B (invalid status): 200
Control (valid status): 200
```

> 📄 For the complete analysis, refer to [`petstore-api-discrepancy-report.md`](./petstore-api-discrepancy-report.md).

---

## Notice on .auth and .gitignore

> ⚠️ **Test Task Note regarding `playwright/.auth`:**
> 
> In this repository, the `playwright/.auth/` folder (containing `user.json` test credentials and `user-state.json` storage state) is **intentionally tracked in Git and not excluded via `.gitignore`**.
>
> **Reason:** This is done intentionally for the assessment review to enable immediate, zero-configuration test execution out-of-the-box without requiring manual credential setup or manual environment variable configuration.
>
> In a production environment, sensitive authentication states, tokens, and credentials would be excluded in `.gitignore` and securely supplied via environment secrets or dedicated secret management vaults.
