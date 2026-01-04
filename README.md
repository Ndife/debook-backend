# Debook Backend

Hi team! 👋

Here is my solution for the Debook backend coding challenge. I focused on building a system that is not just "feature-complete," but one that scales well under load and remains easy to maintain.

## 🚀 Quick Start

The easiest way to run this is with Docker to get the database and redis up, and then running the Node app locally for better DX (debugging/hot-reload).

### 1. Requirements

- Node.js (v18+)
- Docker & Docker Compose

### 2. Setup

First, get your environment variables ready:

```bash
cp .env.example .env
```

_(The default values in `.env.example` are pre-configured to work with the docker-compose setup provided)_

### 3. Run it

Start the infrastructure:

```bash
docker-compose up -d
```

Install dependencies and run migrations:

```bash
npm install
npm run migration:run
```

Start the server:

```bash
npm run start:dev
```

The server will start at `http://localhost:3000`.
You can access the Swagger UI documentation at: **[http://localhost:3000/api](http://localhost:3000/api)**

---

## 🏗 Architecture & Engineering Decisions

I tried to avoid premature optimization while ensuring the foundational architectural choices would handle high concurrency associated with social media interactions.

### 1. High-Performance Counters (The "Like" Problem)

Instead of running a `COUNT(*)` query on a `likes` table every time a post is viewed (which is O(N) and gets slower as the app grows), I implemented **denormalized counters**.

- **Strategy**: Every Post `entity` has a `likesCount` column.
- **Concurrency Handling**: I used atomic SQL updates (`UPDATE post SET "likesCount" = "likesCount" + 1`) inside a transaction. This ensures we never suffer from race conditions where two simultaneous likes overwrite each other.

### 2. Asynchronous Notifications (Queue System)

Processing notifications synchronously (e.g., waiting for an email service or push notification API) kills API response time.

- **Solution**: I used **BullMQ (Redis)** to offload this work.
- **Flow**: When a user likes a post, the API simply pushes a job to Redis and returns `200 OK` immediately. A background worker picks up the job and handles the "heavy lifting."

### 3. Idempotency & Data Integrity

A user shouldn't be able to like a post twice.

- **Database Constraints**: I enforce this at the database level with a unique compound index on the `post_likes` table (`unique: [postId, userId]`).
- **Why**: Application logic can fail or have race conditions. The database is the final source of truth.

---

## 🧪 Testing

I've included both Unit and E2E tests to cover the critical paths.

- **Unit Tests**: Focused on the Service layer, mocking the Repositories to test logic branching (e.g., handling "User already liked" conflicts).
  ```bash
  npm run test
  ```
- **E2E Tests**: Spins up the full application context (minus the real DB connection, mocked for speed and stability in this demo environment) to verify HTTP endpoints, Guards, and Pipes work together.
  ```bash
  npm run test:e2e
  ```

## 🛠 Tech Stack

- **Framework**: NestJS (Standard, scalable, opinionated).
- **Database**: PostgreSQL + TypeORM.
- **Queues**: BullMQ + Redis.
- **Validation**: `class-validator` & `class-transformer` for robust DTOs.

Any feedback is welcome! implementation details are in the code comments. 💻
