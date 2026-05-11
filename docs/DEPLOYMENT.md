# Deployment Guide

## Prerequisites

- Node.js 20+
- MongoDB

## API Deployment

```bash
cd api
npm run build
npm run start:prod
```

## Web Deployment

```bash
cd web
npm run build
```

## Environment Variables

- `MONGODB_URI`, `JWT_SECRET` (API)
- `VITE_API_URL` (Web)
