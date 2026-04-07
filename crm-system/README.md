# CRM System - Deployment Guide

This is a production-ready CRM system integrating Chatwoot, n8n, Evolution API, and OpenAI.

## Prerequisites
- Node.js environment or Docker installed on a VPS (or Easypanel).
- A PostgreSQL Database.
- A Redis instance.

## Deploying Using Docker (Recommended)
1. Ensure your `.env` variables are correctly set in the `docker-compose.yml` environment section or a `.env` file at the root.
   - You need `DATABASE_URL`, `OPENAI_API_KEY`.
2. Run `docker-compose up -d --build`.

## Manual Setup (for Development)
### Backend
1. `cd backend`
2. `npm install`
3. Setup `.env`
4. `npx prisma db push` to synchronize your schema with the Database.
5. `npm run dev` to start the Fastify/Express server on port 4000.

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` to start Next.js on port 3000.

## Webhooks
Point your Chatwoot installation to `http://your-server-ip:4000/api/webhooks/chatwoot` to receive events.
