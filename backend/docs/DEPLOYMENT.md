# Deployment Guide

## Production Deployment

### Prerequisites

- Node.js 20+ installed
- PostgreSQL 15+ database
- Redis 7+ server
- Domain name and SSL certificate
- Environment variables configured

### Step 1: Environment Setup

1. **Copy environment file:**
```bash
cp .env.example .env
```

2. **Configure production environment variables:**
```bash
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_PASSWORD=your-secure-password
JWT_SECRET=your-very-secure-secret-min-32-chars
SCROLLSCAN_API_KEY=your-api-key
COINGECKO_API_KEY=your-api-key
```

### Step 2: Database Setup

1. **Create database:**
```sql
CREATE DATABASE scroll_one;
```

2. **Run schema:**
```bash
psql -U postgres -d scroll_one -f database/schema.sql
```

### Step 3: Build Application

```bash
npm install
npm run build
```

### Step 4: Start Application

```bash
npm start
```

### Docker Deployment

#### Build Image

```bash
docker build -t scroll-one-backend .
```

#### Run Container

```bash
docker run -d \
  --name scroll-one-backend \
  -p 3000:3000 \
  --env-file .env \
  scroll-one-backend
```

#### Docker Compose

```bash
docker-compose up -d
```

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate installed
- [ ] Reverse proxy configured (Nginx)
- [ ] Firewall rules set
- [ ] Monitoring configured
- [ ] Logs configured
- [ ] Backup strategy in place
- [ ] Rate limiting configured
- [ ] CORS origins set correctly

### Monitoring

- Health check endpoint: `GET /health`
- Log files: `logs/combined.log`, `logs/error.log`
- Database connection monitoring
- Redis connection monitoring

### Scaling

For high traffic, consider:
- Load balancer (Nginx/HAProxy)
- Multiple backend instances
- Database read replicas
- Redis cluster
- CDN for static assets

