# 🕌 Muslim Nikah Matrimony

A production-grade Muslim matrimonial platform with a **decoupled NestJS backend** and **Next.js frontend**, enforcing strict privacy via a centralised Rule Engine, managing per-profile subscriptions, and providing a full admin panel.

---

## 🏗 Architecture

```
muslim-nikah/
├── backend/        # NestJS + Prisma + PostgreSQL (port 3002)
└── frontend/       # Next.js 14 App Router (port 3001)
```

### Key Design Decisions
- **Rule Engine**: All visibility checks run in-memory after fetching — no DB-level filtering that could leak data
- **Multi-tenant profiles**: Each parent may manage multiple child profiles independently
- **State Machine**: `ChildProfile` follows `DRAFT → PAYMENT_PENDING → ACTIVE → EXPIRED`
- **Atomic Transactions**: Payment approval atomically activates the profile + creates a 30-day subscription
- **Event-Driven**: `@nestjs/event-emitter` decouples side effects (email hooks, notifications)

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 18
- Docker Desktop (for PostgreSQL)
- npm

### 1 — Start the Database

```bash
docker run -d \
  --name muslim-nikah-db \
  -e POSTGRES_DB=muslim_nikah \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -p 5432:5432 \
  postgres:16
```

### 2 — Backend

```bash
cd backend
cp .env.example .env      # or create .env manually (see below)
npm install
npx prisma migrate deploy
npm run start:dev
```

**`backend/.env`**
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/muslim_nikah"
JWT_SECRET="your-super-secret-key-change-in-production"
PORT=3002
```

### 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

**`frontend/.env.local`**
```env
NEXT_PUBLIC_API_URL=http://localhost:3002/api
```

The app is now running at **http://localhost:3001**

---

## 🔑 Default Accounts

After first run, register via the UI or API. Then promote one user to ADMIN:

```bash
docker exec -i muslim-nikah-db psql -U postgres muslim_nikah \
  -c "UPDATE \"User\" SET role = 'ADMIN' WHERE email = 'your@email.com';"
```

| Role   | Login                      | Password      |
|--------|---------------------------|---------------|
| Admin  | admin@muslimnikah.com      | Admin1234!    |
| Parent | parent@test.com            | Parent1234!   |

---

## 📱 Application Screens

| Route                       | Access     | Description                          |
|-----------------------------|------------|--------------------------------------|
| `/`                         | Public     | Landing page                         |
| `/login`                    | Public     | Login — redirects by role            |
| `/register`                 | Public     | 5-step registration                  |
| `/packages`                 | Public     | Subscription plan info               |
| `/dashboard/parent`         | PARENT     | Overview with live stats             |
| `/dashboard/profiles`       | PARENT     | Profile management + creation modal  |
| `/dashboard/subscription`   | PARENT     | Subscription status + payment history|
| `/dashboard/chat`           | PARENT     | Messaging interface                  |
| `/admin`                    | ADMIN      | System stats dashboard               |
| `/admin/payments`           | ADMIN      | Pending payment approval queue       |
| `/admin/users`              | ADMIN      | User management table                |
| `/admin/profiles`           | ADMIN      | All profiles across the system       |

---

## 🔌 API Reference

Base URL: `http://localhost:3002/api`

### Auth
```http
POST /auth/register        { email, password, phone? }
POST /auth/login           { email, password }
```

### Profiles
```http
GET  /profile/my           Bearer token — parent's profiles
POST /profile/create       Bearer token — create new profile
PUT  /profile/update/:id   Bearer token — update profile
DEL  /profile/:id          Bearer token — delete profile
GET  /profile/list/:viewerProfileId   Visible profiles (Rule Engine applied)
```

### Payments
```http
POST /payment/initiate     { childProfileId, amount, method, bankRef?, bankSlipUrl? }
GET  /payment/my           Parent's payment history
```

### Admin
```http
GET  /admin/dashboard      System-wide stats
GET  /admin/payments       All payments (filter: ?status=PENDING)
POST /admin/payment/approve { paymentId, adminNote? }
GET  /admin/users          All registered users
GET  /admin/profiles       All profiles (filter: ?status=ACTIVE)
```

---

## 🗄 Database Schema (Summary)

```
User              — id, email, password, phone, role (PARENT|ADMIN)
ChildProfile      — id, userId, name, gender, status, …visibility fields
Subscription      — id, childProfileId, status, startDate, endDate
Payment           — id, userId, childProfileId, amount, status, method, bankRef
ChatMessage       — id, senderProfileId, receiverProfileId, content, read
```

Run `npx prisma studio` from the backend directory for a GUI database browser.

---

## 🔒 Visibility Rules (Rule Engine)

Profiles are only shown between active subscribers. Additional logic:
- Contact details hidden until both parties have an active subscription
- Admin can always see all data
- Expired subscriptions lose visibility immediately (daily midnight cron)

---

## 🧩 Modules (Backend)

| Module        | Responsibility                                        |
|---------------|-------------------------------------------------------|
| `AuthModule`  | JWT register/login, guards                            |
| `UserModule`  | Profile of the account holder                         |
| `ProfileModule`| Child profile CRUD + state machine                   |
| `RuleEngine`  | Centralised visibility logic                          |
| `SubscriptionModule` | Per-profile subscription management           |
| `PaymentModule`| Initiate + verify payments (bank/gateway)            |
| `ChatModule`  | Send/receive/history messages                         |
| `AdminModule` | Stats, approval queue, governance                     |
| `SubscriptionCron` | Daily expiry checks                             |
| `AppEventListener` | Side-effect hooks (email/push placeholders)   |

---

## 🚀 Production Checklist

- [ ] Replace `JWT_SECRET` with a strong secret (≥ 64 chars)
- [ ] Connect `AppEventListener` to SendGrid / Firebase for real notifications
- [ ] Integrate payment gateway (Stripe / PayHere) in `PaymentService.initiate()`
- [ ] Add Zod validation schemas to all frontend forms
- [ ] Set `DATABASE_URL` to a managed PostgreSQL instance (RDS / Supabase)
- [ ] Enable HTTPS and update CORS origins in `main.ts`
- [ ] Add rate limiting (`@nestjs/throttler`) to auth routes
- [ ] Configure CI/CD (GitHub Actions → Vercel frontend, Railway/Render backend)

---

## 🛠 Tech Stack

| Layer      | Technology                                      |
|------------|-------------------------------------------------|
| Frontend   | Next.js 14 (App Router), TypeScript, Tailwind   |
| Backend    | NestJS 10, TypeScript, Prisma ORM               |
| Database   | PostgreSQL 16                                    |
| Auth       | JWT (HS256, 7-day expiry)                       |
| Scheduling | `@nestjs/schedule` (daily cron)                 |
| Events     | `@nestjs/event-emitter`                         |
| Security   | Helmet, class-validator, RolesGuard             |

---

## 📝 License

Private — Muslim Nikah Matrimony © 2026
