# Scroll One SuperApp - Backend Architecture

## Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Component Design](#component-design)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Design Decisions](#design-decisions)
7. [Deployment Architecture](#deployment-architecture)

## Overview

The Scroll One SuperApp backend is a RESTful API service built with Node.js, Express, and TypeScript. It provides comprehensive backend services for user management, transaction indexing, mini-app registry, token management, notifications, and analytics.

### Key Responsibilities

- **User & Identity Management**: User profiles, badges, reputation system
- **Transaction Processing**: Blockchain transaction indexing and tracking
- **Mini-App Registry**: Dynamic app discovery, analytics, and usage tracking
- **Token Management**: Multi-token support with real-time price updates
- **Notification System**: Push and in-app notifications
- **Analytics**: User behavior tracking and insights
- **Admin Dashboard**: Comprehensive administrative interface with role-based access control, user management, transaction monitoring, security tracking, and audit logging

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile App (React Native)                  │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTPS/REST API
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    API Gateway (Express)                     │
│  - Authentication  - Rate Limiting  - Request Routing       │
│  - CORS            - Compression     - Logging               │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│   Controllers│ │ Middleware │ │  Services  │
│              │ │            │ │            │
└───────┬──────┘ └────────────┘ └─────┬──────┘
        │                              │
        └──────────────┬───────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
┌───────▼──────┐ ┌─────▼──────┐ ┌─────▼──────┐
│  PostgreSQL  │ │   Redis    │ │ Background │
│   Database   │ │   Cache    │ │    Jobs    │
└──────────────┘ └─────────────┘ └────────────┘
        │
        │
┌───────▼──────────────────────────────────────┐
│         External Services                     │
│  - Scroll RPC  - CoinGecko  - IPFS           │
│  - ScrollScan  - FCM        - Email Service  │
└──────────────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        API Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Routes  │→│Controllers│→│Middleware│→│ Validators│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                     Service Layer                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   User   │  │Transaction│ │  Token   │  │ MiniApp  │   │
│  │ Service  │  │  Service  │ │ Service  │  │ Service  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │Notification│ │Analytics │  │  Admin   │               │
│  │  Service  │  │ Service  │  │ Service  │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │PostgreSQL│  │  Redis   │  │Blockchain│                  │
│  │          │  │  Cache   │  │ Provider │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## Component Design

### 1. API Layer

#### Routes (`src/routes/`)

- Define API endpoints and HTTP methods
- Route requests to appropriate controllers
- Apply middleware (authentication, validation)

#### Controllers (`src/controllers/`)

- Handle HTTP requests and responses
- Validate input data
- Call service layer
- Format responses

#### Middleware (`src/middleware/`)

- **Authentication**: JWT token verification
- **Authorization**: Permission checks and role-based access control
- **Admin Auth**: Super Admin role verification (`requireSuperAdmin`)
- **Rate Limiting**: Request throttling
- **Error Handling**: Centralized error processing
- **Validation**: Request data validation

### 2. Service Layer

#### User Service (`src/services/user/`)

- User profile management
- Badge system
- Reputation tracking
- User preferences

#### Transaction Service (`src/services/transaction/`)

- Transaction indexing
- Transaction history
- Transaction statistics
- Status updates

#### Token Service (`src/services/token/`)

- Token metadata
- Token balances
- Price tracking
- Custom token support

#### Mini-App Service (`src/services/miniapp/`)

- App registry
- App analytics
- Usage tracking
- Category management

#### Notification Service (`src/services/notification/`)

- Notification creation
- Push notifications
- Preference management
- Read status tracking

#### Analytics Service (`src/services/analytics/`)

- Event tracking
- User analytics
- Session tracking
- Behavior analysis

#### Admin Service (`src/services/admin/`)

- Dashboard statistics aggregation
- User management with advanced filtering
- Transaction monitoring across platform
- Mini-app management (verification, featuring)
- Security events tracking
- System health metrics
- Admin actions audit logging

### 3. Data Layer

#### PostgreSQL Database

- Primary data store
- Relational data
- ACID transactions
- Complex queries

**Key Tables:**
- `users` - User profiles with role and status columns
- `admin_actions` - Complete audit log of all admin operations
- `feature_flags` - Feature toggle management
- `system_health` - System health metrics
- All existing tables (transactions, miniapps, tokens, notifications, analytics, etc.)

#### Redis Cache

- Session storage
- Frequently accessed data
- Rate limiting counters
- Temporary data

#### Blockchain Integration

- Scroll RPC provider
- Transaction monitoring
- Balance queries
- Signature verification

## Data Flow

### Authentication Flow

```
1. Client → POST /auth/wallet/message
   └─> Generate auth message

2. Client signs message with wallet
   └─> POST /auth/wallet/verify (message + signature)

3. Backend verifies signature
   ├─> Create/Get user
   ├─> Create session
   └─> Return JWT token

4. Client uses JWT token in Authorization header
   └─> Access protected endpoints
```

### Admin Authentication Flow

```
1. Client → POST /auth/wallet/verify (with signature)
   └─> Server verifies signature and returns JWT token

2. Client → GET /admin/dashboard/stats
   ├─> authenticateToken middleware verifies JWT
   ├─> requireSuperAdmin middleware checks role
   │   ├─> Query database for user role
   │   ├─> Verify role = 'super_admin'
   │   └─> Verify status = 'active'
   └─> Access granted to admin endpoints

3. Admin action performed
   └─> Logged to admin_actions table (audit trail)
```

### Transaction Indexing Flow

```
1. Background Job (every 30s)
   ├─> Get active users
   ├─> For each user:
   │   ├─> Query ScrollScan API
   │   ├─> Parse transactions
   │   ├─> Store in database
   │   └─> Invalidate cache
   └─> Update transaction statuses
```

### Request Flow

```
Request
  ↓
Rate Limiter
  ↓
CORS Middleware
  ↓
Authentication Middleware (if required)
  ↓
Admin Auth Middleware (if admin route)
  ├─> Verify Super Admin role
  └─> Verify active status
  ↓
Validation Middleware
  ↓
Controller
  ↓
Service Layer
  ├─> Check Cache (Redis)
  ├─> Query Database (PostgreSQL)
  ├─> Log Admin Action (if admin operation)
  └─> External API Calls (if needed)
  ↓
Response
  ├─> Cache Result (if applicable)
  └─> Return to Client
```

## Technology Stack

### Core Technologies

- **Node.js 20+**: JavaScript runtime
- **Express.js 4.18+**: Web framework
- **TypeScript 5.3+**: Type safety
- **PostgreSQL 15+**: Primary database
- **Redis 7+**: Caching layer

### Key Libraries

- **ethers.js v6**: Blockchain interaction
- **jsonwebtoken**: JWT authentication
- **winston**: Logging
- **node-cron**: Background jobs
- **express-validator**: Input validation
- **helmet**: Security headers
- **compression**: Response compression

### External Services

- **Scroll RPC**: Blockchain data
- **ScrollScan API**: Transaction indexing
- **CoinGecko API**: Token prices
- **IPFS**: Decentralized storage
- **FCM/Expo Push**: Push notifications

## Design Decisions

### 1. Layered Architecture

**Decision**: Separate concerns into distinct layers (Routes → Controllers → Services → Data)

**Rationale**:

- Clear separation of concerns
- Easier testing and maintenance
- Scalable and maintainable codebase

### 2. Service-Oriented Design

**Decision**: Business logic in service layer, not controllers

**Rationale**:

- Reusable business logic
- Easier to test
- Can be used by multiple controllers or background jobs

### 3. Caching Strategy

**Decision**: Use Redis for frequently accessed data

**Rationale**:

- Reduce database load
- Faster response times
- Better scalability

### 4. Background Jobs

**Decision**: Use node-cron for scheduled tasks

**Rationale**:

- Simple and reliable
- No additional infrastructure needed
- Easy to monitor and debug

### 5. Wallet Authentication

**Decision**: Use wallet signature verification instead of passwords

**Rationale**:

- Web3-native approach
- No password management
- More secure (cryptographic proof)

### 6. Database Schema

**Decision**: Use PostgreSQL with JSONB for flexible data

**Rationale**:

- Strong typing where needed
- Flexibility for metadata
- Excellent performance
- Rich query capabilities

## Deployment Architecture

### Development

```
Developer Machine
  ├─> Node.js (npm run dev)
  ├─> PostgreSQL (Docker)
  └─> Redis (Docker)
```

### Production

```
┌─────────────────────────────────────────┐
│         Load Balancer (Nginx)           │
└─────────────────┬───────────────────────┘
                  │
        ┌─────────┼─────────┐
        │         │         │
┌───────▼──┐ ┌────▼────┐ ┌──▼──────┐
│ Backend │ │ Backend │ │ Backend │
│ Instance│ │ Instance│ │ Instance│
└─────┬────┘ └────┬────┘ └───┬────┘
      │           │           │
      └───────────┼───────────┘
                  │
      ┌───────────┼───────────┐
      │           │           │
┌─────▼────┐ ┌───▼────┐ ┌───▼────┐
│PostgreSQL│ │ Redis   │ │External│
│ (Primary)│ │ Cluster│ │  APIs  │
└──────────┘ └─────────┘ └────────┘
```

### Containerization

- **Docker**: Application containerization
- **Docker Compose**: Local development
- **Multi-stage builds**: Optimized production images

### Environment Configuration

- **Development**: Local services, hot reload
- **Staging**: Production-like environment
- **Production**: Optimized, monitored, scaled

## Security Considerations

1. **Authentication**: JWT with wallet signature verification
2. **Authorization**: Role-based access control (RBAC) implemented
   - User roles: `user`, `admin`, `super_admin`
   - User status: `active`, `suspended`, `banned`
   - Super Admin required for `/admin/*` endpoints
3. **Admin Security**:
   - Wallet signature authentication required
   - Super Admin role verification on every request
   - Complete audit logging of all admin actions
   - IP address and user agent tracking
   - Hidden route (`/admin-super`) not discoverable
4. **Rate Limiting**: Prevent abuse and DDoS
5. **Input Validation**: Sanitize all user inputs
6. **SQL Injection**: Parameterized queries only
7. **CORS**: Restricted origins
8. **HTTPS**: Enforced in production
9. **Secrets**: Environment variables, never in code
10. **Audit Trail**: All admin actions logged for compliance and security

## Performance Optimizations

1. **Caching**: Redis for frequently accessed data
2. **Connection Pooling**: Database connection reuse
3. **Indexes**: Optimized database queries
4. **Compression**: Response compression
5. **Pagination**: Limit result sets
6. **Background Jobs**: Async processing

## Monitoring & Observability

1. **Logging**: Winston with file and console outputs
2. **Health Checks**: `/health` endpoint
3. **Error Tracking**: Centralized error handling
4. **Metrics**: Request/response logging
5. **Database Monitoring**: Query performance tracking

## Admin Dashboard

The backend includes a comprehensive Super Admin Dashboard accessible via hidden route `/admin-super`. See:

- **[Admin Dashboard Documentation](../../docs/backend/admin-dashboard.md)** - Complete documentation
- **[Admin Dashboard Setup](../../docs/deployment/admin-setup.md)** - Setup guide
- **[backend/docs/API.md](./API.md#admin-endpoints-super-admin-only)** - Admin API endpoints

**Key Features:**
- Dashboard statistics aggregation
- User management (search, filter, update roles/status)
- Transaction monitoring across platform
- Mini-app management (verify, feature)
- Security events monitoring
- System health metrics
- Complete audit log of all admin actions

**Database Extensions:**
- `users.role` and `users.status` columns added
- `admin_actions` table for audit logging
- `feature_flags` table for feature management
- `system_health` table for metrics

## Future Enhancements

1. **GraphQL API**: Alternative to REST
2. **WebSocket Support**: Real-time updates for admin dashboard
3. **Message Queue**: RabbitMQ/Kafka for async processing
4. **Microservices**: Split into smaller services
5. **API Gateway**: Kong/Tyk for advanced routing
6. **Service Mesh**: Istio for service communication
7. **Admin Dashboard**: Feature flags UI, advanced analytics, batch operations, IP whitelisting, 2FA