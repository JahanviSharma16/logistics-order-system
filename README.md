# Logistics Order Management System

Full-stack app to manage products and orders. Placing an order reserves and deducts stock inside a database transaction; cancelling restores it. Concurrent orders can never push stock below zero.

**Backend:** Node.js, Express, Sequelize, PostgreSQL, JWT
**Frontend:** React (Vite), Tailwind CSS, React Router, Axios

## Project structure

```
backend/
  src/
    routes/        API endpoints
    middlewares/   auth, role checks, validation, error handling
    validators/    request validation rules
    controllers/   request/response handling
    services/      business logic and transactions
    models/        Sequelize models
    migrations/    database schema
    seeders/       demo users and products
  scripts/concurrency-test.js
frontend/
  src/
    api/           axios client and API calls
    context/       auth and cart state
    components/    shared UI (navbar, route guards, pagination, ...)
    pages/         Login, Register, Products, Cart, Orders
```

## Architecture

**Request flow:** `route → authenticate (JWT) → authorize (role/access) → validate → controller → service → model`. Errors are thrown as `AppError` and handled by one central error handler.

**Order creation** (`services/order.service.js`) runs in a single Sequelize transaction:
1. Lock the requested products with `SELECT ... FOR UPDATE`
2. Check that every product exists and has enough stock
3. Deduct stock, then insert the order and its order items
4. Any failure rolls back the whole transaction

New orders start as `PENDING`. An admin can confirm them. Cancelling (allowed for `PENDING` or `CONFIRMED` orders) restores the stock in a transaction.

**Concurrency:** row locks make concurrent orders for the same product wait their turn, and products are always locked in id order to avoid deadlocks. A `CHECK (stock_qty >= 0)` constraint in the database is an extra safeguard.

**Access control:**

| Action | ADMIN | USER (CREATE) | USER (VIEW) |
|---|---|---|---|
| View products | Yes | Yes | Yes |
| Create / cancel orders | Yes (any) | Own only | No |
| View orders | All | Own only | Own only |
| Confirm orders | Yes | No | No |

**Performance:** pagination and filtering run in SQL, item counts use a subquery inside the same query (no N+1), and indexes cover the order filters and the product search.

## Running the project

**Prerequisites:** Node.js 18+, PostgreSQL 13+

```bash
createdb logistics_db

# Backend
cd backend
cp .env.example .env      # set DB_USER, DB_PASSWORD, JWT_SECRET
npm install
npm run migrate
npm run seed
npm run dev               # http://localhost:8000

# Frontend (new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

`npm run db:reset` (in `backend`) recreates the database with fresh demo data.

## Demo users

| Email | Password | Role |
|---|---|---|
| admin@example.com | Admin@123 | ADMIN |
| user@example.com | User@123 | USER (CREATE) |
| viewer@example.com | Viewer@123 | USER (VIEW) |

## API

All endpoints except register and login require `Authorization: Bearer <token>`.

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/register` | Register a user (`email`, `password`, `role`, optional `access`) |
| POST | `/auth/login` | Log in and get a JWT |
| GET | `/products?search=&page=&limit=` | List and search products |
| POST | `/orders` | Create an order: `{ "items": [{ "sku": "SKU001", "qty": 2 }] }` |
| GET | `/orders?status=&from=&to=&page=&limit=` | List orders, newest first, with item count |
| GET | `/orders/:id` | Order details |
| POST | `/orders/:id/cancel` | Cancel an order and restore stock |
| POST | `/orders/:id/confirm` | Confirm a pending order (admin only) |

## Concurrency test

With the server running on fresh seed data:

```bash
cd backend
npm run test:concurrency
```

It sends 20 simultaneous orders for a product that has 5 in stock. Expected result: 5 orders created, 15 rejected, final stock 0.
