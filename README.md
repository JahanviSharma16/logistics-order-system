# Logistics Order Management System

A full-stack order management service for a logistics company. Users browse products, add them to a cart and place orders; placing an order **reserves and deducts stock atomically**, and cancelling an order **restores it**, even under concurrent requests.

| Layer | Tech |
|---|---|
| Backend | Node.js, Express 5, Sequelize 6 (ORM), PostgreSQL |
| Auth | JWT (`jsonwebtoken`), `bcrypt` password hashing, role/access based authorization |
| Validation | `express-validator` |
| Frontend | React 19 (Vite), Tailwind CSS v4, React Route
r 7, Axios, react-hot-toast |

---

## Table of contents
1. [Features](#features)
2. [Project structure](#project-structure)
3. [Architecture](#architecture)
4. [Database design](#database-design)
5. [Key design decisions](#key-design-decisions)
6. [Getting started](#getting-started)
7. [Demo users](#demo-users)
8. [API reference](#api-reference)
9. [Concurrency test](#concurrency-test)
10. [Assumptions](#assumptions)
11. [Possible improvements](#possible-improvements)

---

## Features

**Backend**
- JWT authentication: register and login
- Role-based access control: `ADMIN`, and `USER` with `VIEW` or `CREATE` access
- Create order inside a single DB transaction with **row-level locking**; full rollback on any failure
- List orders with status and date-range filters, pagination, `created_at DESC` sorting and per-order item counts
- Cancel order (PENDING/CONFIRMED only) with stock restoration in a transaction
- Product listing with case-insensitive search (name/SKU) and pagination
- Migrations, seeders, DB constraints and indexes
- Centralised error handling with consistent JSON responses

**Frontend**
- Login and registration with client-side validation; logout; session kept across refreshes
- Role-based navigation and route guards (`/cart` only for users who can create orders)
- Products: table on desktop, cards on mobile, **real-time debounced search**, pagination, stock badges
- Cart: change quantities (capped to stock), remove items, total amount, place order, per-item stock errors
- Orders: status and date filters, pagination, cancel with a confirmation dialog, admin "confirm" action
- Loading indicators, success/error toasts, empty states and a responsive layout

---

## Project structure

```
logistics-order-system/
├── backend/
│   ├── .sequelizerc               # tells sequelize-cli where config/models/migrations live
│   ├── scripts/
│   │   └── concurrency-test.js    # fires parallel orders to prove no overselling
│   └── src/
│       ├── app.js                 # express app: middleware, routes, error handler
│       ├── server.js              # DB connection check + start server
│       ├── config/database.js     # env-based DB config (shared by app and CLI)
│       ├── migrations/            # schema: tables, FKs, CHECK constraints, indexes
│       ├── seeders/               # demo users + 30 products
│       ├── models/                # Sequelize models + associations
│       ├── routes/                # URL -> middleware chain -> controller
│       ├── middlewares/           # authenticate, authorize, validate, errorHandler, notFound
│       ├── validators/            # express-validator rule sets
│       ├── controllers/           # HTTP layer only (req/res)
│       ├── services/              # business logic + transactions
│       └── utils/                 # AppError, asyncHandler, jwt, money, pagination, ...
└── frontend/
    └── src/
        ├── api/                   # axios instance (+ interceptors) and API functions
        ├── context/               # AuthProvider, CartProvider
        ├── hooks/                 # useAuth, useCart, useDebounce
        ├── components/            # Navbar, Layout, ProtectedRoute, Pagination, ConfirmDialog, ...
        ├── pages/                 # Login, Register, Products, Cart, Orders, Unauthorized, NotFound
        └── utils/                 # formatters, error message helper
```

---

## Architecture

### Request flow (backend)

```
HTTP request
   │
   ▼
Route ──► authenticate (JWT) ──► authorize (role / access) ──► validators ──► validate
                                                                              │
                                                                              ▼
                                                                         Controller  (req/res only)
                                                                              │
                                                                              ▼
                                                                         Service     (business rules,
                                                                              │       transactions, locking)
                                                                              ▼
                                                                         Sequelize models ──► PostgreSQL
   ▲
   └──────────── any thrown error ──► asyncHandler ──► errorHandler ──► { success:false, message, errors? }
```

- **Controllers** are thin; all business logic and every transaction lives in **services**, so the critical code is in one place (`services/order.service.js`).
- **`AppError`** carries an HTTP status. **`errorHandler`** also maps Sequelize errors (unique → 409, validation → 400, FK → 400) and JWT errors (→ 401). In production, unexpected errors return a generic 500.
- Every response has the same shape: `{ success, message?, data?, pagination?, errors? }`.

### Frontend

```
main.jsx ─► BrowserRouter ─► AuthProvider ─► CartProvider ─► App (routes)
                                                              ├─ PublicOnlyRoute ─► /login, /register
                                                              └─ ProtectedRoute ─► Layout (Navbar)
                                                                   ├─ /products, /orders
                                                                   └─ ProtectedRoute(requireCreate) ─► /cart
```

- **`api/client.js`**: a single axios instance. A request interceptor attaches `Authorization: Bearer <token>`; a response interceptor logs the user out on any `401` (expired or invalid token).
- **AuthProvider** stores the token and user in `localStorage`, so sessions survive a refresh.
- **CartProvider** keeps the cart in `localStorage` **per user** (`cart_<userId>`).
- **Search** uses a 400 ms debounce and an `AbortController`, so typing sends one request per pause and a slow, outdated response can never overwrite a newer one.
- Route guards only improve the user experience; **all authorization is enforced by the backend**.

---

## Database design

```
users 1 ──── * orders 1 ──── * order_items * ──── 1 products
```

| Table | Columns | Constraints & indexes |
|---|---|---|
| `users` | id, email, password_hash, role (`ADMIN`/`USER`), access (`VIEW`/`CREATE`, null for ADMIN), created_at | `email` UNIQUE |
| `products` | id, name, sku, stock_qty, price `DECIMAL(10,2)`, created_at | `sku` UNIQUE · **CHECK `stock_qty >= 0`** · CHECK `price >= 0` · GIN trigram indexes on `name` and `sku` |
| `orders` | id, user_id → users, order_number, status (`PENDING`/`CONFIRMED`/`CANCELLED`), total_amount `DECIMAL(12,2)`, created_at | `order_number` UNIQUE · CHECK `total_amount >= 0` · indexes `(user_id, created_at)`, `(status, created_at)`, `(created_at)` |
| `order_items` | id, order_id → orders (CASCADE), product_id → products (RESTRICT), quantity, unit_price, created_at | CHECK `quantity > 0` · UNIQUE `(order_id, product_id)` · index on `product_id` |

**Why these indexes**
- `orders (user_id, created_at)` serves the most common query, "my orders, newest first".
- `orders (status, created_at)` serves the status filter, and `orders (created_at)` serves the admin view across all users.
- The `order_items` unique constraint starts with `order_id`, so it also indexes the item-count subquery. PostgreSQL does not index foreign keys automatically.
- A `pg_trgm` GIN index lets `ILIKE '%term%'` use an index; a normal B-tree index cannot help with a leading wildcard.

`unit_price` stores the price **at the time of ordering**, so later price changes don't alter past orders.

---

## Key design decisions

### 1. Transactions (ORM-managed)
`createOrder`, `cancelOrder` and `confirmOrder` use Sequelize **managed transactions** (`sequelize.transaction(async (t) => …)`). Every query receives `{ transaction: t }`. If anything throws (missing product, insufficient stock, a DB error), Sequelize **rolls back automatically**: no stock is deducted and no order or order-item rows are written.

**Create order** (`services/order.service.js`):
1. Merge duplicate SKUs in the payload (`[{A,2},{A,1}]` → `A:3`).
2. `SELECT … FOR UPDATE` all requested products in **one query**, ordered by `id`.
3. Reject unknown SKUs (404) and every item with insufficient stock (409), listing all failing items at once.
4. Deduct stock with an atomic `UPDATE … SET stock_qty = stock_qty - n`.
5. Insert the order and bulk-insert the items.
6. Commit, and return the full order.

**Cancel order**: lock the order row (`FOR UPDATE`), allow only `PENDING`/`CONFIRMED`, restore stock with atomic increments, then set the status to `CANCELLED`, all in one transaction.

### 2. Concurrency: no negative stock, no overselling
- **Pessimistic row locking** (`lock: t.LOCK.UPDATE`): a concurrent order for the same product **waits** until the first transaction commits, then reads the updated stock and validates it again.
- **Deadlock avoidance**: rows are always locked in ascending `id` order, by both create and cancel.
- **Double-cancel protection**: the order row is locked, so two simultaneous cancel requests can't both restore stock.
- **Safety net**: a DB-level `CHECK (stock_qty >= 0)` makes negative stock impossible even if application code had a bug.
- This is proven by `npm run test:concurrency` (see [Concurrency test](#concurrency-test)).

*Alternative considered:* a conditional atomic update (`UPDATE … SET stock_qty = stock_qty - n WHERE id = ? AND stock_qty >= n`, then check the affected rows). It needs no explicit lock, but locking first lets us validate and report **all** items before writing anything.

### 3. Money handling
- Prices come **from the database**; the client only sends `{ sku, qty }`.
- Totals are calculated in **integer paise** (`utils/money.js`) to avoid floating-point errors, and stored as `DECIMAL`.

### 4. Authentication & RBAC

| Action | ADMIN | USER · CREATE | USER · VIEW |
|---|---|---|---|
| Browse products | Yes | Yes | Yes |
| Create order | Yes | Yes | No (403) |
| List / view orders | all users | own only | own only |
| Cancel order | any | own only | No (403) |
| Confirm order (PENDING → CONFIRMED) | Yes | No (403) | No (403) |

- `authenticate` verifies the JWT and **reloads the user from the DB**, so a role or access change (or a deleted user) takes effect immediately instead of waiting for the token to expire.
- `authorizeRoles(...)` and `requireAccess(...)` are reusable middlewares.
- **Ownership** is enforced inside service queries (`where: { user_id }` for USER). Requesting another user's order returns **404, not 403**, so the API doesn't reveal that the order exists.
- Passwords are hashed with bcrypt and never returned: the model's `defaultScope` excludes `password_hash`, and `toJSON` strips it as well.
- Login returns the same error for an unknown email and a wrong password, so attackers can't discover which emails are registered.
- A duplicate email is checked in code (friendly message) **and** by the UNIQUE constraint (race-safe → 409).

### 5. Query performance
- Pagination is done in SQL (`LIMIT/OFFSET` + `COUNT`), never in memory.
- Per-order `item_count` and `product_count` come from correlated subqueries inside the **same** query, which avoids N+1 queries.
- The indexes are described in [Database design](#database-design).
- The connection pool is set to `max: 10` so concurrent transactions don't starve each other.

### 6. Validation & errors
- `express-validator` validates every body, query and param, and returns `400` with field-level errors.
- LIKE wildcards in search input (`%`, `_`) are escaped.
- Status codes: `400` validation · `401` unauthenticated or bad token · `403` forbidden · `404` not found · `409` conflict (duplicate email, insufficient stock, invalid status change).

---

## Getting started

### Prerequisites
- Node.js **18+**
- PostgreSQL **13+** (needs the `pg_trgm` extension, which ships with PostgreSQL)

### 1. Clone
```bash
git clone https://github.com/JahanviSharma16/logistics-order-system.git
cd logistics-order-system
```

### 2. Database
```bash
createdb logistics_db
```

### 3. Backend
```bash
cd backend
cp .env.example .env        # then set DB_USER / DB_PASSWORD / JWT_SECRET
npm install
npm run migrate             # create tables, constraints, indexes
npm run seed                # demo users + 30 products
npm run dev                 # http://localhost:8000
```
Health check: `curl http://localhost:8000/health`

**Backend environment variables**

| Variable | Example | Description |
|---|---|---|
| `PORT` | `8000` | API port |
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | PostgreSQL host and port |
| `DB_NAME` | `logistics_db` | Database name |
| `DB_USER` / `DB_PASSWORD` | `postgres` / `postgres` | DB credentials |
| `JWT_SECRET` | long random string | Secret for signing tokens |
| `JWT_EXPIRES_IN` | `1d` | Token lifetime |
| `CLIENT_URL` | `http://localhost:5173` | Allowed CORS origin (frontend URL) |

### 4. Frontend
In a new terminal:
```bash
cd frontend
cp .env.example .env        # VITE_API_URL=http://localhost:8000
npm install
npm run dev                 # http://localhost:5173
```

### Useful scripts (backend)

| Script | Purpose |
|---|---|
| `npm run dev` | Start with nodemon |
| `npm start` | Start without auto-reload |
| `npm run migrate` / `npm run migrate:undo` | Apply / revert all migrations |
| `npm run seed` / `npm run seed:undo` | Insert / remove demo data |
| `npm run db:reset` | Revert, migrate and seed again (fresh database) |
| `npm run test:concurrency` | Run the concurrency test (server must be running) |

---

## Demo users

| Email | Password | Role | Access |
|---|---|---|---|
| `admin@example.com` | `Admin@123` | ADMIN | full |
| `user@example.com` | `User@123` | USER | CREATE |
| `viewer@example.com` | `Viewer@123` | USER | VIEW |

The seeded products use SKUs `SKU001` to `SKU030`. `SKU005` (stock 5) is intended for the concurrency test, and `SKU022` is out of stock.

---

## API reference

Base URL: `http://localhost:8000`. Every route except `/auth/register`, `/auth/login` and `/health` requires `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | public | Register a user |
| POST | `/auth/login` | public | Log in and get a JWT |
| GET | `/auth/me` | any logged-in user | Current user |
| GET | `/products?search=&page=&limit=` | any logged-in user | List and search products |
| POST | `/orders` | ADMIN, USER·CREATE | Create an order |
| GET | `/orders?status=&from=&to=&page=&limit=` | any logged-in user (USER sees own) | List orders |
| GET | `/orders/:id` | owner or ADMIN | Order with its items |
| POST | `/orders/:id/cancel` | owner·CREATE or ADMIN | Cancel and restore stock |
| POST | `/orders/:id/confirm` | ADMIN | PENDING → CONFIRMED |

### Register
```http
POST /auth/register
{ "email": "test@example.com", "password": "Pwd@123", "role": "USER", "access": "CREATE" }
```
Rules: unique email, password of at least 6 characters, role `ADMIN` or `USER`. `access` is optional (`VIEW`/`CREATE`, default `CREATE`, ignored for ADMIN). Returns `201` with the user (no password hash).

### Login
```http
POST /auth/login
{ "email": "test@example.com", "password": "Pwd@123" }
```
```json
{ "success": true, "message": "Login successful",
  "data": { "token": "eyJhbGciOi...", "user": { "id": 4, "email": "test@example.com", "role": "USER", "access": "CREATE" } } }
```

### Create order
```http
POST /orders
{ "items": [ { "sku": "SKU001", "qty": 2 }, { "sku": "SKU002", "qty": 1 } ] }
```
```json
{ "success": true, "message": "Order placed successfully",
  "data": { "id": 1, "order_number": "ORD-20261105-9F3A1C7B", "status": "PENDING", "total_amount": 90,
            "items": [ { "quantity": 2, "unit_price": 25, "product": { "sku": "SKU001", "name": "Cardboard Box - Small" } }, "…" ] } }
```
Insufficient stock (whole transaction rolled back):
```json
{ "success": false, "message": "Insufficient stock",
  "errors": [ { "field": "SKU005", "message": "Requested 6, only 5 available" } ] }
```

### List orders
`GET /orders?status=PENDING&from=2026-11-01&to=2026-11-30&page=1&limit=10`

- `from` / `to` accept `YYYY-MM-DD` (the whole `to` day is included) or full ISO-8601 timestamps.
- Results are sorted by `created_at DESC`.
- Each order includes `item_count` (total quantity) and `product_count` (number of distinct products).

```json
{ "success": true,
  "data": [ { "id": 1, "order_number": "ORD-…", "status": "PENDING", "total_amount": 90,
              "item_count": 3, "product_count": 2, "created_at": "…", "user": { "id": 2, "email": "user@example.com" } } ],
  "pagination": { "page": 1, "limit": 10, "total": 1, "totalPages": 1 } }
```

### Cancel order
`POST /orders/:id/cancel` returns `200` with the cancelled order, and stock is restored. Cancelling an order that is already `CANCELLED` returns `409`.

### Error format
```json
{ "success": false, "message": "Validation failed",
  "errors": [ { "field": "password", "message": "Password must be at least 6 characters" } ] }
```

---

## Concurrency test

`backend/scripts/concurrency-test.js` logs in, reads the stock of a product, fires **N parallel orders** for it, and checks that:
- exactly `floor(stock / qty)` orders succeed and the rest get `409`
- the final stock equals the initial stock minus the sold quantity, and is never negative

```bash
cd backend
npm run db:reset            # fresh data: SKU005 has stock 5
npm run dev                 # keep running in one terminal
npm run test:concurrency    # in another terminal
```
Expected:
```
SKU005 stock before: 5
Firing 20 concurrent orders of qty 1...
Created: 5 | Insufficient stock: 15 | Other: 0
SKU005 stock after: 0

PASS: no overselling, stock is consistent
```
You can configure it: `SKU=SKU010 REQUESTS=50 QTY=1 npm run test:concurrency`

---

## Assumptions
- Registration accepts `role: ADMIN` because the assignment's register API defines it. In production, admin accounts would be created by an existing admin or by a seed, not publicly.
- `access` applies only to `USER`; it defaults to `CREATE` and is stored as `NULL` for `ADMIN`, who has full access.
- New orders start as `PENDING`. The assignment doesn't define who confirms orders, so an ADMIN-only `POST /orders/:id/confirm` endpoint was added.
- "Total item count per order" is returned as `item_count` (sum of quantities); `product_count` (number of distinct products) is included as well.
- Duplicate SKUs in one order payload are merged into a single line.
- At most 50 lines per order and a quantity of 1 to 1000 per line, to bound transaction size.
- Prices are in INR.

## Possible improvements
- Refresh tokens or httpOnly cookies instead of storing the JWT in `localStorage`
- Automated tests (Jest + Supertest) running against a test database
- Rate limiting on the auth endpoints
- An admin UI for managing products and users
- Keyset (cursor) pagination for very large order tables
- Docker Compose for one-command setup
