# API Test Scripts

This directory contains comprehensive test scripts for testing all API endpoints.

## Test Files

### 1. **api-tests.js**

Tests basic API connectivity and endpoint accessibility.

**Run:**

```bash
npm run test:api
```

**Tests:**

- Health check endpoint
- WebSocket endpoint status
- Telemetry endpoint authentication
- Devices endpoint authentication
- Metrics endpoint authentication
- Users endpoint authentication
- Profile endpoint authentication
- Settings endpoint authentication
- Maintenance endpoint authentication
- Rooms endpoint authentication
- DSS endpoint authentication
- Dashboard endpoint authentication

### 2. **auth-tests.js**

Comprehensive authentication and authorization tests.

**Run:**

```bash
npm run test:auth
```

**Tests:**

- User sign up for different roles
- User sign in with valid credentials
- Sign in error cases (wrong password, missing role)
- Get current authenticated user
- Get user profile
- Update user profile
- Change password with valid current password
- Change password error cases
- User logout
- Invalid token handling
- Missing token handling

**Test Users Created:**

- Administrator with campus ID
- Technician without campus requirement

### 3. **device-tests.js**

Tests for device and room management endpoints.

**Run:**

```bash
npm run test:devices
```

**Tests:**

- Get all devices
- Get devices with filters (room_id, status, pagination)
- Create device
- Get device by ID
- Update device
- Delete device
- Create room
- Get all rooms
- Get rooms with filters (building, floor)
- Maintenance record creation and retrieval
- Error handling (invalid ID, missing required fields)

### 4. **telemetry-tests.js**

Tests for telemetry data, metrics, DSS, and dashboard endpoints.

**Run:**

```bash
npm run test:telemetry
```

**Tests:**

- Post telemetry data
- Handle missing required fields
- Get telemetry with filters
- Telemetry pagination
- Metrics queries (latest, health, aggregated, date range)
- DSS analytics (summary, device performance, energy consumption, anomalies)
- Dashboard statistics
- Telemetry monitoring

## Running All Tests

```bash
npm run test:all
```

This will run all test suites sequentially.

## Prerequisites

1. **Frontend server must be running:**

   ```bash
   npm run dev
   ```

2. **Database must be available** - The API needs a running database with proper schema.

3. **Backend services** should be accessible (if in separate container).

## Environment Setup

Ensure the following environment variables are set in `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=ac_sys
API_URL=http://localhost:8000
JWT_SECRET=your-secret-key-min-32-chars-long-for-development-only!!!
```

## Test Results Format

Each test produces:

- `✓` for passed tests
- `✗` for failed tests
- Summary with: Passed, Failed, Total counts

Example:

```
=== Test Summary ===
Passed: 25
Failed: 0
Total: 25
```

## Common Issues and Fixes

### 1. Connection Refused

**Error:** `Error: connect ECONNREFUSED 127.0.0.1:3000`

**Fix:** Ensure the Next.js dev server is running:

```bash
npm run dev
```

### 2. Database Connection Error

**Error:** `Error: Database connection failed`

**Fix:**

- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `ac_sys`

### 3. Authentication Errors

**Error:** `401 Unauthorized`

**Fix:**

- Token may be expired
- JWT_SECRET must match between signup and auth
- Check Authorization header format: `Bearer <token>`

## Test Data Cleanup

Test scripts create test users and data. To clean up:

1. **PostgreSQL:**
   ```sql
   DELETE FROM users WHERE email LIKE 'test-%@example.com';
   DELETE FROM devices WHERE name LIKE 'Test Device%';
   DELETE FROM rooms WHERE name LIKE 'Test Room%';
   DELETE FROM maintenance_records WHERE created_at > NOW() - INTERVAL '1 hour';
   ```

## Extending Tests

To add new tests:

1. Create a new test file in `tests/` directory
2. Copy the pattern from existing tests
3. Add test script to `package.json`:
   ```json
   "test:newfeature": "node tests/newfeature-tests.js"
   ```
4. Add to `test:all` script

## API Endpoints Tested

### Authentication

- `POST /auth/signup` - User registration
- `POST /auth/signin` - User login
- `GET /auth/me` - Get current user
- `POST /auth/me` - Logout

### Users

- `GET /api/users` - List users
- `GET /api/users/[id]` - Get user profile
- `PUT /api/users/[id]` - Update user

### Devices

- `GET /api/devices` - List devices
- `POST /api/devices` - Create device
- `GET /api/devices/[id]` - Get device
- `PUT /api/devices/[id]` - Update device
- `DELETE /api/devices/[id]` - Delete device

### Telemetry

- `POST /api/telemetry` - Submit telemetry
- `GET /api/telemetry` - Get telemetry data
- `GET /api/telemetry/metrics` - Get metrics

### Analytics

- `GET /api/dashboard/statistics` - Dashboard stats
- `GET /api/dss` - DSS analytics

### Rooms

- `GET /api/rooms` - List rooms
- `POST /api/rooms` - Create room

### Maintenance

- `GET /api/maintenance` - List records
- `POST /api/maintenance` - Create record

### Settings

- `GET /api/settings` - Get settings
- `PUT /api/settings` - Update setting
- `POST /api/settings/password` - Change password

## Support

For issues or questions about the tests, check:

1. Database schema in `api/migrations.sql`
2. API routes in `app/api/`
3. Service implementations in `server/services/`
