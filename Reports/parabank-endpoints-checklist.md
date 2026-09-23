## Environment Details
- **Application:** ParaBank
- **Source page:** `https://parabank.parasoft.com/parabank/services.htm`
- **Browser:** Brave
- **Date:** 23.09.2026

## Scope
This checklist covers all SOAP and REST endpoints published on the Services page, based on the pattern of issues already found on the Admin page (missing input validation, unauthenticated config changes, application crash on bad input — see `brokenEndpoints.md`).

---

## 1. Bookstore SOAP Services

**Endpoints:**
| Variant | Endpoint | WSDL |
|---|---|---|
| Bookstore | `/parabank/services/store-01` | `store-01?wsdl` |
| Bookstore v2.0 | `/parabank/services/store-01V2` | `store-01V2?wsdl` |
| WS-Security Username Token | `/parabank/services/store-wss-01` | `store-wss-01?wsdl` |
| WS-Security Signature | `/parabank/services/store-wss-02` | `store-wss-02?wsdl` |
| WS-Security Encryption | `/parabank/services/store-wss-03` | `store-wss-03?wsdl` |
| WS-Security Signature + Encryption | `/parabank/services/store-wss-04` | `store-wss-04?wsdl` |

**Methods to test:** `getItemById`, `getItemByTitle`, `addItemToCart`, `getItemsInCart`, `updateItemInCart`, `submitOrder`, `addNewItemToInventory`

- [ ] WSDL is reachable and reflects the actual service contract for each variant
- [ ] `getItemById` rejects non-numeric / out-of-range id (e.g. `0`, `-1`, `"abc"`, `99999`) with a proper error, not a stack trace or 500
- [ ] `getItemByTitle` with empty string returns full catalog as documented
- [ ] `getItemByTitle` handles SQL-injection-style input (`' OR '1'='1`) safely
- [ ] `addItemToCart` rejects negative/zero quantities and non-existent item ids
- [ ] `addItemToCart` with `cartId = 0` correctly generates a new cart id (not a crash)
- [ ] `updateItemInCart` rejects quantity greater than stock, per documented behavior
- [ ] `updateItemInCart` to zero quantity behaves as documented (does not corrupt cart state)
- [ ] `submitOrder` on an empty/expired cart returns a graceful error, not an internal error
- [ ] `addNewItemToInventory` validates required Book fields (no blank/negative price, etc.)
- [ ] Carts inactive for 20 minutes are actually purged (or documented behavior is verified)
- [ ] **`store-wss-01`**: request without Username Token is rejected (not silently processed)
- [ ] **`store-wss-01`**: wrong username/password is rejected with a clear SOAP fault
- [ ] **`store-wss-02`**: unsigned body is rejected
- [ ] **`store-wss-03`**: unencrypted body is rejected
- [ ] **`store-wss-04`**: request missing either signature or encryption is rejected
- [ ] Malformed XML / missing required SOAP elements return a SOAP Fault, not an unhandled exception
- [ ] Repeated invalid requests do not degrade or crash the service for subsequent valid calls

---

## 2. ParaBank SOAP Services

**Endpoints:**
| Service | Endpoint | WSDL |
|---|---|---|
| LoanProcessorService | `/parabank/services/LoanProcessor` | `LoanProcessor?wsdl` |
| ParaBankService | `/parabank/services/ParaBank` | `ParaBank?wsdl` |

**Methods to test (ParaBankService):** `login`, `getAccount`, `getAccounts`, `getCustomer`, `updateCustomer`, `createAccount`, `deposit`, `withdraw`, `transfer`, `buyPosition`, `sellPosition`, `getPosition`, `getPositions`, `getPositionHistory`, `getTransaction`, `getTransactions`, `getTransactionsOnDate`, `getTransactionsByToFromDate`, `getTransactionsByAmount`, `requestLoan`, `setParameter`, `startupJmsListener`, `shutdownJmsListener`, `cleanDB`, `initializeDB`

- [ ] `login` rejects invalid credentials with a clear fault (no account/customer id leaked)
- [ ] `getAccount` / `getCustomer` with a non-existent id returns a handled error, not a crash
- [ ] `deposit` / `withdraw` reject negative or zero amounts
- [ ] `withdraw` rejects amount greater than available balance
- [ ] `transfer` rejects transfers between non-existent or invalid account pairs
- [ ] `transfer` rejects negative amounts and self-to-self transfers where not intended
- [ ] `buyPosition` / `sellPosition` validate quantity/price parameters (no negative shares, no zero price)
- [ ] `createAccount` validates customer id and account type before creation
- [ ] `updateCustomer` validates required fields (no blank required strings, malformed SSN/phone, etc.)
- [ ] `getTransactionsOnDate` / `getTransactionsByToFromDate` reject malformed date strings gracefully
- [ ] `getTransactionsByAmount` handles amount `0`, negative, and extreme values without error
- [ ] `requestLoan` (both via ParaBankService and LoanProcessorService) validates amount/down-payment/account id combinations
- [ ] **`setParameter`** — confirm whether this is callable without authentication; if so, flag as a security issue (same class as the Admin page finding)
- [ ] **`cleanDB`** / **`initializeDB`** — confirm whether these are callable without authentication; if so, flag as critical (unauthenticated data destruction/reset)
- [ ] **`startupJmsListener`** / **`shutdownJmsListener`** — confirm whether these are callable without authentication; if so, flag as critical (unauthenticated service control)
- [ ] Any single bad request to ParaBankService/LoanProcessorService does not put the whole application into the "Error! An internal error has occurred and has been logged." state
- [ ] SOAP faults returned contain no internal stack traces, file paths, or DB details

---

## 3. RESTful Services (`/parabank/services/bank`)

**References:**
- WADL: `services/bank?_wadl&_type=xml`
- OpenAPI: `/parabank/api-docs/index.html`

- [ ] OpenAPI/WADL definitions match actual endpoint behavior (no undocumented or stale endpoints)
- [ ] All endpoints reject invalid path/query parameters (non-numeric ids, negative amounts) with proper 4xx responses
- [ ] Endpoints requiring authentication actually enforce it (no bypass via REST when SOAP requires login)
- [ ] Responses use correct HTTP status codes (400 for bad input, 401/403 for auth issues, 404 for missing resources) instead of a generic 500
- [ ] Error responses return structured JSON/XML, not an HTML "internal error" page
- [ ] Malformed JSON/XML request bodies are rejected cleanly, not crashing the service
- [ ] Rate of invalid requests does not degrade or crash the REST layer for subsequent valid requests
- [ ] CORS / content-type handling is validated (unexpected `Content-Type` header handled gracefully)

---

## 4. Cross-Cutting Checks (apply to all services above)

- [ ] **No unauthenticated state changes:** any method that writes/modifies data (deposit, transfer, setParameter, cleanDB, initializeDB, JMS listener control, admin config) requires proper authentication/authorization
- [ ] **No crash propagation:** an invalid request to one endpoint/service does not put the entire application into a broken global-error state, as currently happens via the Admin page
- [ ] **Consistent error contract:** all services return a documented, informative error (SOAP Fault / HTTP error body) instead of "Error! An internal error has occurred and has been logged."
- [ ] **Input validation parity:** every numeric/string/date parameter is validated server-side, not just relied upon client-side
- [ ] **Logging without leakage:** internal errors are logged server-side but not exposed to the caller in detail
- [ ] **Recovery:** after an invalid request, the application continues to serve subsequent valid requests without requiring a server restart

---

## Notes
This checklist should be executed against each endpoint individually and cross-referenced with the existing Admin page defect (`brokenEndpoints.md`) — the same root causes (missing validation, unauthenticated writes, unhandled exceptions crashing the app globally) are likely to reproduce across several of the services above.
