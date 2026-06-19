# 🌌 Damora AI — Enterprise Knowledge & RAG Platform

> A multi-tenant, secure Enterprise AI Knowledge Management Platform enabling organizations to ingest documents, index semantic vector chunks, and run real-time conversational AI chats over their private files. 

Built as a **modular monorepo** with **Next.js 14** (App Router), **NestJS**, **PostgreSQL**, **Redis**, **Qdrant Vector Database**, and **MinIO S3 Object Storage**.

---

## 📸 Application Showcases
*(Place your screenshots or GIFs here to grab recruiter attention immediately!)*

| 👥 Shared Discussion Board | ⚙️ Multi-Provider BYOK Settings |
|:---:|:---:|
| ![Shared Discussions Screen](https://github.com/lavneetsh/Damora-AI/issues/1#issue-4699109888)

---

## 🚀 Key Architectural Features

### 1. Advanced RAG (Retrieval-Augmented Generation) Ingestion
* **Asynchronous Processing:** Heavy document parsing (PDF, DOCX, TXT, MD) and OCR image ingestion are offloaded to background threads using **Redis**-backed **BullMQ** workers to keep the HTTP event loop responsive.
* **Semantic Vector Search:** Text is chunked with contextual overlaps, mapped to **768-dimensional dense vectors** (via Gemini `text-embedding-004`), and indexed in a **Qdrant** database using Cosine Similarity metrics.

### 2. Multi-Tenant Isolation & Custom RBAC
* **Strict Workspace Scoping:** Every query, file upload, and vector search filter checks the active workspace context to prevent cross-tenant data leakage.
* **Role-Based Access Control (RBAC):** Restricts administrative functions (e.g. inviting members, removing documents, changing model keys) to `OWNER` or `ADMIN` roles using custom NestJS routing guards.

### 3. "Bring Your Own Key" (BYOK) Security
* **Multi-Provider SDK Loading:** Out-of-the-box support for **Google Gemini**, **OpenAI (GPT-4o)**, and **Anthropic Claude (3.5 Sonnet)**.
* **AES-256-CBC Encryption:** Customer API keys are validated through outbound connectivity handshakes and encrypted at rest with industry-standard symmetric cryptography before storage.

### 4. Real-time Response Streaming
* **Server-Sent Events (SSE):** AI chat responses stream token-by-token using NestJS `@Sse()` controller methods and RxJS observables, minimizing initial response latency.

---

## 🛠️ System Design & Data Flow

```mermaid
graph TD
    Client[Next.js Client app/web] <-->|Server-Sent Events / JSON REST| API[NestJS Backend API apps/api]
    API <-->|SQL Queries / Prisma| DB[(PostgreSQL)]
    API <-->|Background Jobs| Queue[(Redis / BullMQ)]
    Queue -->|Ingest / OCR / Chunk| Vector[(Qdrant Vector DB)]
    API <-->|File Storage| Storage[(MinIO S3 Storage)]
    API <-->|Outbound Completions| LLMs[Gemini / OpenAI / Claude SDKs]
```

---

## 📦 Tech Stack

* **Frontend:** Next.js 14, React, Tailwind CSS, Zustand, Lucide Icons, Framer Motion
* **Backend:** NestJS, TypeScript, Passport.js JWT, RxJS, class-validator
* **Database & Caching:** PostgreSQL, Prisma ORM, Qdrant Vector DB, Redis
* **Infrastructure & Storage:** Docker Compose, MinIO (S3-compatible Object Storage)

---

## ⚙️ Quick Start Setup

### Prerequisites
Make sure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) and [Node.js v18+](https://nodejs.org/) installed.

### 1. Spin up Infrastructure (Docker)
In the root directory, start the database, vector store, redis, and storage containers:
```bash
docker-compose up -d
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):
```env
# Backend Ports
API_PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/damora?schema=public"

# Cryptography (32-byte secret key for AES-256-CBC)
ENCRYPTION_KEY="your-super-secret-32-character-key"

# JWT Auth
JWT_ACCESS_SECRET="your-jwt-access-secret"
JWT_REFRESH_SECRET="your-jwt-refresh-secret"

# LLM Providers (Defaults)
AI_PROVIDER="gemini"
EMBEDDING_PROVIDER="gemini"
```

### 3. Run Migrations & Start Project
Install dependencies and launch the dev servers:
```bash
# Install pnpm workspace dependencies
pnpm install

# Run database schema migrations
npx prisma migrate dev

# Run both Next.js and NestJS servers in development mode
pnpm dev
```
* **Frontend app:** `http://localhost:3000`
* **Backend API:** `http://localhost:3001`
* **Swagger API Documentation:** `http://localhost:3001/api/docs`

---

## 📁 Repository Structure
```
├── apps/
│   ├── api/           # NestJS REST backend
│   └── web/           # Next.js 14 frontend
├── packages/
│   └── shared-types/  # Typings shared between API & Web
├── infrastructure/    # Docker-compose configurations
└── package.json
```
