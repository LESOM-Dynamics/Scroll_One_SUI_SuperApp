# Scroll One SuperApp - Backend API

Complete backend implementation for the Scroll One SuperApp ecosystem.

## Overview

This backend provides a comprehensive REST API for managing users, transactions, mini-apps, tokens, notifications, and analytics for the Scroll One SuperApp mobile application.

## Features

- 🔐 **Wallet Authentication** - Secure wallet signature verification
- 👤 **User Management** - Profiles, badges, reputation system
- 📱 **Mini-App Registry** - Dynamic app discovery and analytics
- 💰 **Transaction Indexing** - Real-time blockchain transaction tracking
- 🪙 **Token Management** - Multi-token support with price tracking
- 🔔 **Notifications** - Push and in-app notification system
- 📊 **Analytics** - User behavior and app usage tracking
- ⚡ **Background Jobs** - Automated transaction indexing and price updates
- 🚀 **High Performance** - Redis caching, connection pooling, optimized queries
- 🛡️ **Super Admin Dashboard** - Comprehensive administrative interface with role-based access control

## Tech Stack

- **Runtime**: Node.js 20+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 15+
- **Cache**: Redis 7+
- **Blockchain**: ethers.js v6
- **Authentication**: JWT with wallet signature verification

## Quick Start

### Prerequisites

- Node.js 18+ and npm 9+
- PostgreSQL 15+
- Redis 7+
- Docker and Docker Compose (optional)

### Installation

1. **Clone and navigate to backend directory:**

```bash
cd backend
```

2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start services with Docker Compose:**

```bash
docker-compose up -d postgres redis
```

5. **Run database migrations:**

```bash
# Apply schema, admin extensions, and seed data
npm run db:setup

# Or manually with psql:
# psql -U postgres -d sui_one -f database/schema.sql
# psql -U postgres -d sui_one -f database/admin_schema.sql
# psql -U postgres -d sui_one -f database/seed_miniapps.sql
```

6. **Start development server:**

```bash
npm run dev
```

The API will be available at `http://localhost:3000`

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Express middleware
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── utils/           # Utility functions
│   ├── jobs/            # Background jobs
│   └── index.ts         # Application entry point
├── database/            # Database migrations and schema
├── docs/                # Documentation
└── tests/               # Test files
```

## API Documentation

See [docs/API.md](./docs/API.md) for complete API documentation.

## Architecture

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) for detailed architecture documentation.

## Environment Variables

Key environment variables (see `.env.example` for complete list):

- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - Database configuration
- `REDIS_HOST`, `REDIS_PORT` - Redis configuration
- `JWT_SECRET` - JWT signing secret
- `SUI_MAINNET_RPC_URL` - Sui mainnet RPC endpoint
- `SUI_TESTNET_RPC_URL` - Sui testnet RPC endpoint
- `SUI_DEVNET_RPC_URL` - Sui devnet RPC endpoint (optional)
- `COINGECKO_API_KEY` - CoinGecko API key for price data

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
npm start
```

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
npm run lint:fix
```

## Docker Deployment

### Build and Run

```bash
docker-compose up -d
```

### View Logs

```bash
docker-compose logs -f backend
```

### Stop Services

```bash
docker-compose down
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/wallet/verify` - Verify wallet signature and create session
- `POST /api/v1/auth/wallet/message` - Generate authentication message
- `GET /api/v1/auth/session/validate` - Validate session
- `DELETE /api/v1/auth/session` - Invalidate session

### Users

- `POST /api/v1/users` - Create user profile
- `GET /api/v1/users/:walletAddress` - Get user profile
- `PUT /api/v1/users/:walletAddress` - Update user profile
- `GET /api/v1/users/:walletAddress/badges` - Get user badges
- `POST /api/v1/users/:walletAddress/badges/earn` - Award badge
- `GET /api/v1/users/:walletAddress/reputation` - Get reputation history

### Transactions

- `GET /api/v1/transactions/:walletAddress` - Get user transactions
- `GET /api/v1/transactions/hash/:hash` - Get transaction details
- `GET /api/v1/transactions/:walletAddress/stats` - Get transaction statistics

### Mini-Apps

- `GET /api/v1/miniapps` - List mini-apps
- `GET /api/v1/miniapps/:appId` - Get mini-app details
- `GET /api/v1/miniapps/categories` - Get categories
- `POST /api/v1/miniapps/:appId/usage` - Track app usage

### Tokens

- `GET /api/v1/tokens` - List tokens
- `GET /api/v1/tokens/:address` - Get token details
- `GET /api/v1/tokens/:address/price` - Get token price
- `GET /api/v1/tokens/balances/:walletAddress` - Get token balances

### Notifications

- `GET /api/v1/notifications` - Get user notifications
- `PUT /api/v1/notifications/:id/read` - Mark notification as read
- `POST /api/v1/notifications/preferences` - Update notification preferences

### Analytics

- `POST /api/v1/analytics/event` - Track analytics event
- `GET /api/v1/analytics/users/:walletAddress` - Get user analytics

### Admin (Super Admin Only)

- `GET /api/v1/admin/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/admin/users` - List users with filters
- `PUT /api/v1/admin/users/:userId` - Update user role/status
- `GET /api/v1/admin/transactions` - List all transactions
- `PUT /api/v1/admin/miniapps/:appId` - Update mini-app (verify/feature)
- `GET /api/v1/admin/security/events` - Get security events
- `GET /api/v1/admin/system/health` - Get system health metrics
- `GET /api/v1/admin/actions` - Get admin actions audit log

**Note**: All admin endpoints require Super Admin role. See [Admin Dashboard Documentation](../docs/backend/admin-dashboard.md) for details.

## Background Jobs

The backend includes automated background jobs:

- **Transaction Indexer** - Indexes transactions from Scroll blockchain every 30 seconds
- **Price Updater** - Updates token prices from CoinGecko every 5 minutes

## Security

- Wallet signature verification for authentication
- JWT tokens for session management
- Rate limiting on all endpoints
- Input validation and sanitization
- SQL injection prevention (parameterized queries)
- CORS configuration
- Helmet.js for security headers

## Performance

- Redis caching for frequently accessed data
- Database connection pooling
- Optimized database indexes
- Response compression
- Efficient query patterns

## Monitoring

- Winston logging with file and console outputs
- Health check endpoint: `GET /health`
- Error tracking and reporting
- Request logging with Morgan

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT

## Admin Dashboard

The backend includes a comprehensive Super Admin Dashboard for platform management. See:

- **[Admin Dashboard Documentation](../docs/backend/admin-dashboard.md)** - Complete documentation
- **[Admin Dashboard Setup](../docs/deployment/admin-setup.md)** - Setup guide

### Quick Admin Setup

1. Apply admin schema: `npm run db:setup` or `psql -U postgres -d sui_one -f database/admin_schema.sql`
2. Create Super Admin: `node scripts/create-super-admin.js 0xYourWalletAddress`
3. Access dashboard at: `http://localhost:3001/admin-super` (frontend must be running)

## Support

For issues and questions, please open an issue on GitHub.
