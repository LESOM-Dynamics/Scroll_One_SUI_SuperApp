# Super Admin Dashboard - Quick Setup Guide

## Prerequisites

- PostgreSQL database with main schema applied
- Backend server running
- Frontend (landing-page) server running
- Node.js and npm installed

## Step 1: Apply Database Schema

```bash
cd backend
psql -U postgres -d scroll_one -f database/admin_schema.sql
```

This adds:
- `role` and `status` columns to `users` table
- `admin_actions` table for audit logging
- `feature_flags` table for feature management
- `system_health` table for health metrics

## Step 2: Create Super Admin User

### Option A: Using the Script (Recommended)

```bash
cd backend
node scripts/create-super-admin.js 0xYourWalletAddressHere
```

### Option B: Manual SQL

```sql
-- Update existing user
UPDATE users 
SET role = 'super_admin', status = 'active' 
WHERE wallet_address = '0xYourWalletAddressHere';

-- Or create new user
INSERT INTO users (wallet_address, role, status, created_at, updated_at)
VALUES ('0xYourWalletAddressHere', 'super_admin', 'active', NOW(), NOW());
```

## Step 3: Configure Environment Variables

### Backend (.env)

Ensure these are set:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=scroll_one
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
```

### Frontend (landing-page/.env.local)

Create `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

For production:
```env
NEXT_PUBLIC_API_URL=https://api.scrollone.app
```

## Step 4: Start Services

### Terminal 1 - Backend
```bash
cd backend
npm install
npm run dev
```

Backend should run on `http://localhost:3000`

### Terminal 2 - Frontend
```bash
cd landing-page
npm install
npm run dev
```

Frontend should run on `http://localhost:3001` (or next available port)

## Step 5: Access Dashboard

1. Navigate to: `http://localhost:3001/admin-super`
2. Click "Connect Wallet"
3. Sign the authentication message
4. You should now have access to the dashboard!

## Verification

### Check Backend API
```bash
# Health check
curl http://localhost:3000/health

# Test admin endpoint (will fail without auth, but confirms route exists)
curl http://localhost:3000/api/v1/admin/dashboard/stats
```

### Check Database
```sql
-- Verify Super Admin user exists
SELECT wallet_address, role, status FROM users WHERE role = 'super_admin';

-- Check admin_actions table exists
SELECT COUNT(*) FROM admin_actions;
```

## Troubleshooting

### "Not authenticated" error
- Ensure wallet is connected
- Check JWT token in localStorage (browser DevTools)
- Verify user has `super_admin` role in database

### "Super Admin access required" error
- Verify user role: `SELECT role FROM users WHERE wallet_address = '0x...'`
- Ensure status is 'active': `SELECT status FROM users WHERE wallet_address = '0x...'`

### API connection errors
- Verify backend is running: `curl http://localhost:3000/health`
- Check `NEXT_PUBLIC_API_URL` in frontend `.env.local`
- Check CORS settings in backend

### Database errors
- Verify admin schema was applied: `\d admin_actions` in psql
- Check database connection in backend logs
- Ensure user has proper permissions

## Security Checklist

Before going to production:

- [ ] Change JWT secret to strong random value
- [ ] Use HTTPS only
- [ ] Implement IP whitelisting for admin routes
- [ ] Add 2FA for Super Admin accounts
- [ ] Use secure token storage (not localStorage)
- [ ] Enable rate limiting on admin endpoints
- [ ] Set up monitoring and alerts
- [ ] Regular security audits
- [ ] Limit number of Super Admin accounts

## Next Steps

1. Review `ADMIN_DASHBOARD_DOCUMENTATION.md` for full feature list
2. Set up monitoring and alerts
3. Configure IP whitelisting
4. Add 2FA if needed
5. Train admin users on dashboard usage

## Support

For issues:
1. Check backend logs: `backend/logs/`
2. Review security events in dashboard
3. Check admin actions log
4. Verify database schema

