# Super Admin Dashboard Documentation

## Overview

The Super Admin Dashboard is a hidden, secure administrative interface for managing the Scroll One Crypto SuperApp. It provides comprehensive oversight of users, transactions, mini-apps, tokens, security events, and system health.

## Access & Security

### Route
- **URL**: `/admin-super` (hidden route, not shown in navigation)
- **Access**: Super Admin role only
- **Authentication**: Wallet signature-based authentication

### Security Features

1. **Role-Based Access Control (RBAC)**
   - Only users with `role = 'super_admin'` can access
   - Middleware checks role on every request
   - Users must have `status = 'active'` to access

2. **Authentication Flow**
   - Wallet connection via MetaMask/Web3 wallet
   - Message signing for authentication
   - JWT token stored in localStorage (consider secure storage for production)

3. **Audit Logging**
   - All admin actions are logged to `admin_actions` table
   - Includes: admin ID, action type, resource type, IP address, user agent, timestamp
   - Full audit trail for compliance and security

4. **IP Whitelisting** (Recommended for Production)
   - Can be implemented in `requireSuperAdmin` middleware
   - Add IP whitelist check before role verification

5. **2FA** (Recommended for Production)
   - Can be added as additional verification step
   - Integrate with TOTP or SMS-based 2FA

## Database Schema

### New Tables

1. **admin_actions** - Audit log for all admin actions
2. **feature_flags** - Feature toggle management
3. **system_health** - System health metrics

### Modified Tables

1. **users** - Added columns:
   - `role` (user, admin, super_admin)
   - `status` (active, suspended, banned)

### Migration

Run the admin schema migration:
```sql
psql -U postgres -d scroll_one -f backend/database/admin_schema.sql
```

## Backend API Endpoints

All endpoints are prefixed with `/api/v1/admin` and require:
- `Authorization: Bearer <token>`
- Super Admin role

### Dashboard
- `GET /admin/dashboard/stats` - Get comprehensive dashboard statistics

### Users
- `GET /admin/users` - List users with filters (search, role, status, pagination)
- `PUT /admin/users/:userId` - Update user role or status

### Transactions
- `GET /admin/transactions` - List all transactions with filters

### Mini-Apps
- `PUT /admin/miniapps/:appId` - Update mini-app (verify, feature)

### Security
- `GET /admin/security/events` - Get security events log

### System
- `GET /admin/system/health` - Get system health metrics

### Audit
- `GET /admin/actions` - Get admin actions audit log

## Frontend Components

### Main Components

1. **AdminLayout** (`components/admin/AdminLayout.tsx`)
   - Sidebar navigation
   - Top bar with logout
   - Responsive design

2. **DashboardOverview** (`components/admin/DashboardOverview.tsx`)
   - Key metrics cards
   - User growth statistics
   - Transaction statistics
   - Security monitoring summary

3. **UsersManagement** (`components/admin/UsersManagement.tsx`)
   - User list with search and filters
   - Edit user role/status
   - Pagination

4. **TransactionsManagement** (`components/admin/TransactionsManagement.tsx`)
   - Transaction list with filters
   - Link to blockchain explorer
   - Status and type filtering

5. **MiniAppsManagement** (`components/admin/MiniAppsManagement.tsx`)
   - Mini-app verification
   - Feature toggling
   - Analytics

6. **SecurityMonitoring** (`components/admin/SecurityMonitoring.tsx`)
   - Security events log
   - Failed login attempts
   - Suspicious activity alerts

7. **SystemHealth** (`components/admin/SystemHealth.tsx`)
   - System metrics
   - Health status indicators
   - Real-time updates

8. **AdminActionsLog** (`components/admin/AdminActionsLog.tsx`)
   - Complete audit trail
   - Filter by action/resource type
   - Detailed action information

## Setup Instructions

### 1. Database Setup

```bash
# Run admin schema migration
cd backend
psql -U postgres -d scroll_one -f database/admin_schema.sql
```

### 2. Create Super Admin User

```sql
-- Update an existing user to Super Admin
UPDATE users 
SET role = 'super_admin', status = 'active' 
WHERE wallet_address = '0xYourSuperAdminWalletAddress';
```

### 3. Environment Variables

Add to `.env`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
# Or production URL
NEXT_PUBLIC_API_URL=https://api.scrollone.app
```

### 4. Start Services

```bash
# Backend
cd backend
npm run dev

# Frontend (landing page)
cd landing-page
npm run dev
```

### 5. Access Dashboard

Navigate to: `http://localhost:3000/admin-super`

## Features

### Dashboard Overview
- Real-time statistics
- User growth metrics
- Transaction volume
- Security alerts
- System health indicators

### User Management
- Search users by wallet, username, or display name
- Filter by role (user, admin, super_admin)
- Filter by status (active, suspended, banned)
- Update user role and status
- View user reputation and level

### Transaction Monitoring
- View all transactions across the platform
- Filter by status (pending, confirmed, failed)
- Filter by type (send, receive, swap, contract)
- Link to blockchain explorer
- Transaction value and gas information

### Mini-App Management
- Verify mini-apps
- Feature/unfeature apps
- View app analytics
- Manage app categories

### Security Monitoring
- Real-time security events
- Failed login attempts
- Suspicious activity detection
- IP address tracking
- User agent logging

### System Health
- API health metrics
- Database connection status
- Blockchain node status
- Performance metrics

### Audit Logging
- Complete action history
- Admin identification
- Resource changes
- IP and user agent tracking
- Timestamp for all actions

## Integration Points

### Backend Services
- `adminService` - Core admin business logic
- `adminController` - Request handlers
- `adminAuth` middleware - Access control
- Database queries for analytics

### Frontend API Client
- `adminApi` class in `lib/adminApi.ts`
- Handles all API calls
- Token management
- Error handling

### External Services
- Blockchain RPC (Scroll network)
- CoinGecko (token prices)
- IPFS (metadata storage)
- Email service (notifications)

## Security Best Practices

1. **Production Recommendations**:
   - Use secure token storage (httpOnly cookies or secure storage)
   - Implement IP whitelisting
   - Add 2FA for Super Admin accounts
   - Rate limit admin endpoints more strictly
   - Enable CORS restrictions
   - Use HTTPS only
   - Regular security audits

2. **Monitoring**:
   - Monitor admin action logs regularly
   - Set up alerts for suspicious admin activity
   - Review security events daily
   - Track failed authentication attempts

3. **Access Control**:
   - Limit Super Admin accounts to minimum necessary
   - Regular access reviews
   - Immediate revocation on suspicious activity
   - Separate Super Admin accounts for different functions

## Troubleshooting

### Authentication Issues
- Verify wallet is connected
- Check JWT token is valid
- Ensure user has `super_admin` role
- Verify user status is `active`

### API Errors
- Check backend is running
- Verify API URL in environment variables
- Check CORS settings
- Review backend logs

### Database Issues
- Ensure admin schema migration ran successfully
- Verify database connection
- Check user role column exists

## Future Enhancements

1. **Feature Flags Management**
   - UI for managing feature flags
   - A/B testing controls
   - Rollout percentage management

2. **Advanced Analytics**
   - Custom date range selection
   - Export reports (CSV, PDF)
   - Chart visualizations
   - User behavior analytics

3. **Batch Operations**
   - Bulk user updates
   - Mass notifications
   - Batch transaction processing

4. **Real-time Updates**
   - WebSocket integration
   - Live dashboard updates
   - Real-time alerts

5. **Compliance Tools**
   - GDPR data export
   - User data deletion
   - Compliance reports

## Support

For issues or questions:
1. Check backend logs: `backend/logs/`
2. Review security events in dashboard
3. Check admin actions log for recent changes
4. Verify database schema is up to date

