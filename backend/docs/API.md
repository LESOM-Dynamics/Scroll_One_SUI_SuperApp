# Scroll One SuperApp - API Documentation

## Base URL

```
Production: https://api.scrollone.app/v1
Development: http://localhost:3000/v1
```

## Authentication

All authenticated endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

### Wallet Authentication Flow

1. Client requests authentication message: `POST /auth/wallet/message`
2. Client signs message with wallet private key
3. Client sends signature: `POST /auth/wallet/verify`
4. Server verifies signature and returns JWT token
5. Client uses token for subsequent requests

---

## API Endpoints

### Authentication

#### Generate Authentication Message

```http
POST /auth/wallet/message
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Sign in to Scroll One SuperApp\n\nWallet: 0x...\nNonce: ...\nTimestamp: ..."
  }
}
```

#### Verify Wallet Signature

```http
POST /auth/wallet/verify
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "message": "Sign in to Scroll One SuperApp...",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": "7d",
    "user": {
      "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    }
  }
}
```

#### Validate Session

```http
GET /auth/session/validate
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "valid": true
  }
}
```

#### Logout

```http
DELETE /auth/session
Authorization: Bearer <token>
```

---

### Users

#### Create User Profile

```http
POST /users
Content-Type: application/json

{
  "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "scrollId": "scroll:0x...",
  "username": "johndoe",
  "displayName": "John Doe",
  "signature": "0x...",
  "message": "Sign in to Scroll One..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "scrollId": "scroll:0x...",
    "username": "johndoe",
    "displayName": "John Doe",
    "reputation": 0,
    "level": 1,
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get User Profile

```http
GET /users/:walletAddress
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "walletAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "scrollId": "scroll:0x...",
    "username": "johndoe",
    "displayName": "John Doe",
    "avatar": "ipfs://...",
    "bio": "Bio text",
    "reputation": 150,
    "level": 5,
    "badges": [...],
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Update User Profile

```http
PUT /users/:walletAddress
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "New Name",
  "bio": "New bio",
  "avatar": "ipfs://..."
}
```

#### Get User Badges

```http
GET /users/:walletAddress/badges
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "badgeId": "first_transaction",
      "name": "First Transaction",
      "description": "Completed your first transaction",
      "icon": "🎉",
      "rarity": "common",
      "earnedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Award Badge

```http
POST /users/:walletAddress/badges/earn
Authorization: Bearer <token>
Content-Type: application/json

{
  "badgeId": "first_transaction",
  "metadata": {}
}
```

#### Get Reputation History

```http
GET /users/:walletAddress/reputation?limit=50&offset=0
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalReputation": 150,
    "level": 5,
    "history": [
      {
        "eventType": "transaction",
        "points": 10,
        "timestamp": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

---

### Transactions

#### Get User Transactions

```http
GET /transactions/:walletAddress?status=confirmed&type=send&limit=50&offset=0
```

**Query Parameters:**
- `status`: `pending`, `confirmed`, `failed`
- `type`: `send`, `receive`, `swap`, `contract`
- `limit`: Items per page (default: 50)
- `offset`: Pagination offset (default: 0)
- `fromDate`: Start date (ISO 8601)
- `toDate`: End date (ISO 8601)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "hash": "0x...",
        "from": "0x...",
        "to": "0x...",
        "value": "1000000000000000000",
        "symbol": "ETH",
        "gasUsed": "21000",
        "gasPrice": "20000000000",
        "fee": "0.00042",
        "status": "confirmed",
        "blockNumber": 12345,
        "timestamp": "2024-01-01T00:00:00Z",
        "network": "mainnet",
        "type": "send"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

#### Get Transaction Details

```http
GET /transactions/hash/:hash
```

#### Get Transaction Stats

```http
GET /transactions/:walletAddress/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalTransactions": 100,
    "totalSent": 50,
    "totalReceived": 30,
    "totalSwaps": 20,
    "totalVolume": "100.5",
    "totalFees": "0.5"
  }
}
```

---

### Mini-Apps

#### List Mini Apps

```http
GET /miniapps?category=DeFi&featured=true&page=1&limit=20&search=swap
```

**Query Parameters:**
- `category`: Filter by category
- `featured`: Filter featured apps (`true`/`false`)
- `verified`: Filter verified apps (`true`/`false`)
- `search`: Search by name/description
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "apps": [
      {
        "id": "uuid",
        "appId": "syncswap",
        "name": "SyncSwap",
        "url": "https://syncswap.xyz",
        "icon": "💱",
        "description": "Scroll-native DEX",
        "category": "DeFi",
        "featured": true,
        "verified": true,
        "stats": {
          "totalUsers": 1000,
          "activeUsers": 500,
          "avgRating": 4.5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

#### Get Mini App Details

```http
GET /miniapps/:appId
```

#### Get Categories

```http
GET /miniapps/categories
```

#### Track App Usage

```http
POST /miniapps/:appId/usage
Authorization: Bearer <token>
Content-Type: application/json

{
  "sessionStart": "2024-01-01T00:00:00Z",
  "sessionEnd": "2024-01-01T01:00:00Z",
  "actions": 10
}
```

---

### Tokens

#### List Tokens

```http
GET /tokens?chainId=534352&verified=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "address": "0x...",
      "symbol": "USDC",
      "name": "USD Coin",
      "decimals": 6,
      "chainId": 534352,
      "icon": "ipfs://...",
      "verified": true
    }
  ]
}
```

#### Get Token Details

```http
GET /tokens/:address
```

#### Get Token Price

```http
GET /tokens/:address/price
```

**Response:**
```json
{
  "success": true,
  "data": {
    "price": 2500.50,
    "change24h": 2.5,
    "marketCap": 300000000000,
    "volume24h": 1000000000,
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Token Balances

```http
GET /tokens/balances/:walletAddress
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "token": {
        "address": "0x...",
        "symbol": "ETH",
        "name": "Ethereum",
        "decimals": 18
      },
      "balance": "1.0",
      "usdValue": 2500.50
    }
  ]
}
```

---

### Notifications

#### Get Notifications

```http
GET /notifications?read=false&limit=50&offset=0
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "transaction",
        "title": "Transaction Confirmed",
        "body": "Your transaction has been confirmed",
        "data": {
          "txHash": "0x...",
          "amount": "1.0",
          "symbol": "ETH"
        },
        "read": false,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

#### Mark Notification as Read

```http
PUT /notifications/:id/read
Authorization: Bearer <token>
```

#### Update Notification Preferences

```http
POST /notifications/preferences
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "transaction",
  "enabled": true,
  "channels": ["push", "in-app"]
}
```

---

### Analytics

#### Track Event

```http
POST /analytics/event
Content-Type: application/json

{
  "eventType": "app_opened",
  "eventData": {
    "appId": "syncswap",
    "screen": "swap"
  },
  "sessionId": "session_123",
  "deviceInfo": {
    "platform": "ios",
    "version": "1.0.0"
  }
}
```

#### Get User Analytics

```http
GET /analytics/users/:walletAddress?fromDate=2024-01-01&toDate=2024-12-31
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEvents": 1000,
    "eventsByType": {
      "app_opened": 500,
      "transaction": 300,
      "badge_earned": 200
    },
    "sessions": 50,
    "lastActive": "2024-01-01T00:00:00Z"
  }
}
```

---

## Admin Endpoints (Super Admin Only)

**⚠️ Important**: All admin endpoints require:
- Valid JWT token in `Authorization: Bearer <token>` header
- User must have `role = 'super_admin'` in database
- User must have `status = 'active'`

### Dashboard Statistics

```http
GET /admin/dashboard/stats
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1000,
      "active": 950,
      "newToday": 10,
      "newThisWeek": 50,
      "newThisMonth": 200,
      "suspended": 5,
      "banned": 2
    },
    "transactions": {
      "total": 5000,
      "today": 100,
      "thisWeek": 500,
      "thisMonth": 2000,
      "pending": 5,
      "failed": 10,
      "totalVolume": "1000000000000000000000"
    },
    "miniapps": {
      "total": 20,
      "verified": 15,
      "featured": 5,
      "pendingVerification": 3,
      "totalUsers": 5000
    },
    "tokens": {
      "total": 50,
      "verified": 30,
      "withPrices": 25
    },
    "analytics": {
      "activeUsers24h": 200,
      "activeUsers7d": 800,
      "activeUsers30d": 3000,
      "totalSessions": 500,
      "avgSessionDuration": 0
    },
    "security": {
      "securityEvents24h": 5,
      "failedLogins24h": 2,
      "suspiciousActivities": 1
    }
  }
}
```

### List Users

```http
GET /admin/users?search=wallet&role=user&status=active&page=1&limit=50&sortBy=created_at&sortOrder=DESC
Authorization: Bearer <token>
```

**Query Parameters:**
- `search`: Search by wallet address, username, or display name
- `role`: Filter by role (`user`, `admin`, `super_admin`)
- `status`: Filter by status (`active`, `suspended`, `banned`)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)
- `sortBy`: Sort field (default: `created_at`)
- `sortOrder`: Sort order (`ASC` or `DESC`, default: `DESC`)

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "uuid",
        "wallet_address": "0x...",
        "username": "johndoe",
        "display_name": "John Doe",
        "role": "user",
        "status": "active",
        "reputation": 150,
        "level": 5,
        "created_at": "2024-01-01T00:00:00Z",
        "last_active_at": "2024-01-15T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

### Update User

```http
PUT /admin/users/:userId
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin",
  "status": "active"
}
```

**Request Body:**
- `role` (optional): `user`, `admin`, or `super_admin`
- `status` (optional): `active`, `suspended`, or `banned`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "wallet_address": "0x...",
    "role": "admin",
    "status": "active",
    "updated_at": "2024-01-15T00:00:00Z"
  }
}
```

**Note**: All user updates are logged in the admin actions audit log.

### List Transactions

```http
GET /admin/transactions?status=confirmed&type=send&fromDate=2024-01-01&toDate=2024-12-31&page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `status`: Filter by status (`pending`, `confirmed`, `failed`)
- `type`: Filter by type (`send`, `receive`, `swap`, `contract`)
- `fromDate`: Start date (ISO 8601)
- `toDate`: End date (ISO 8601)
- `minValue`: Minimum transaction value
- `maxValue`: Maximum transaction value
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "hash": "0x...",
        "from_address": "0x...",
        "to_address": "0x...",
        "value": "1000000000000000000",
        "status": "confirmed",
        "type": "send",
        "gas_used": "21000",
        "fee": "420000000000000",
        "timestamp": "2024-01-01T00:00:00Z",
        "block_number": 12345
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 500,
      "totalPages": 10
    }
  }
}
```

### Update Mini-App

```http
PUT /admin/miniapps/:appId
Authorization: Bearer <token>
Content-Type: application/json

{
  "verified": true,
  "featured": true
}
```

**Request Body:**
- `verified` (optional): Boolean - Mark app as verified
- `featured` (optional): Boolean - Feature/unfeature app

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "app_id": "syncswap",
    "name": "SyncSwap",
    "verified": true,
    "featured": true,
    "updated_at": "2024-01-15T00:00:00Z"
  }
}
```

### Get Security Events

```http
GET /admin/security/events?eventType=login_failed&userId=uuid&page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `eventType`: Filter by event type
- `userId`: Filter by user ID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "id": "uuid",
        "event_type": "login_failed",
        "user_id": "uuid",
        "wallet_address": "0x...",
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "metadata": {},
        "created_at": "2024-01-15T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 100,
      "totalPages": 2
    }
  }
}
```

### Get System Health

```http
GET /admin/system/health
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "metric_type": "api_response_time",
      "avg_value": 0.05,
      "max_value": 0.2,
      "min_value": 0.01,
      "last_updated": "2024-01-15T00:00:00Z"
    }
  ]
}
```

### Get Admin Actions Log

```http
GET /admin/actions?adminId=uuid&actionType=user_update&resourceType=user&page=1&limit=50
Authorization: Bearer <token>
```

**Query Parameters:**
- `adminId`: Filter by admin user ID
- `actionType`: Filter by action type
- `resourceType`: Filter by resource type (`user`, `miniapp`, `token`, etc.)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": {
    "actions": [
      {
        "id": "uuid",
        "admin_id": "uuid",
        "admin_wallet_address": "0x...",
        "admin_username": "admin",
        "action_type": "user_update",
        "resource_type": "user",
        "resource_id": "uuid",
        "details": {
          "updates": {
            "role": "admin"
          }
        },
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0...",
        "created_at": "2024-01-15T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 200,
      "totalPages": 4
    }
  }
}
```

**Note**: All admin actions are automatically logged for audit purposes.

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {}
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0"
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` (400): Request validation failed
- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions (includes Super Admin access required)
- `NOT_FOUND` (404): Resource not found
- `RATE_LIMIT_EXCEEDED` (429): Too many requests
- `INTERNAL_ERROR` (500): Server error
- `WALLET_VERIFICATION_FAILED` (401): Invalid wallet signature
- `USER_NOT_FOUND` (404): User does not exist
- `DUPLICATE_ENTRY` (409): Resource already exists
- `AUTHORIZATION_ERROR` (403): Super Admin access required (for admin endpoints)

---

## Rate Limiting

- **General**: 100 requests per 15 minutes per IP
- **Authenticated**: 1000 requests per 15 minutes per user
- **Heavy endpoints**: 10 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## Pagination

Most list endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

---

## Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "environment": "production"
}
```

---

## Webhooks

### Transaction Indexed

```http
POST /webhooks/transactions/indexed
Content-Type: application/json

{
  "hash": "0x...",
  "from": "0x...",
  "to": "0x...",
  "value": "1000000000000000000",
  "status": "confirmed",
  "blockNumber": 12345,
  "timestamp": "2024-01-01T00:00:00Z"
}
```

---

## Best Practices

1. **Always include Authorization header** for protected endpoints
2. **Handle rate limiting** - Implement exponential backoff
3. **Use pagination** - Don't fetch all data at once
4. **Cache responses** - Cache data when appropriate
5. **Handle errors gracefully** - Check `success` field in responses
6. **Validate wallet addresses** - Ensure addresses are checksummed
7. **Use HTTPS** - Always use HTTPS in production
8. **Monitor rate limits** - Check rate limit headers

---

## SDK Examples

### JavaScript/TypeScript

```typescript
const API_BASE = 'https://api.scrollone.app/v1';

async function authenticate(walletAddress: string, signer: any) {
  // Get auth message
  const messageRes = await fetch(`${API_BASE}/auth/wallet/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress }),
  });
  const { data } = await messageRes.json();
  
  // Sign message
  const signature = await signer.signMessage(data.message);
  
  // Verify and get token
  const verifyRes = await fetch(`${API_BASE}/auth/wallet/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      walletAddress,
      message: data.message,
      signature,
    }),
  });
  
  const { data: authData } = await verifyRes.json();
  return authData.token;
}

async function getUser(walletAddress: string, token: string) {
  const res = await fetch(`${API_BASE}/users/${walletAddress}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const { data } = await res.json();
  return data;
}
```

---

## Support

For API support, please open an issue on GitHub or contact the development team.

