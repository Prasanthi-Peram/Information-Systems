# Test Credentials

## Setup Instructions

### 1. Run Database Migration
First, ensure your database has the required columns:
```sql
ALTER TABLE users ADD COLUMN role VARCHAR(20);
ALTER TABLE users ADD COLUMN campus_id VARCHAR(50);
```

Or run the migration file:
```bash
psql -U your_username -d your_database -f migrations/add_role_column.sql
```

### 2. Create Test Users
Run the Node.js script to create test users with properly hashed passwords:

```bash
node scripts/create-test-users.js
```

Make sure your `.env` file has the correct database credentials:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=your_database
```

## Test Credentials

### Administrator Account
- **Email:** `admin@test.com`
- **Password:** `admin123`
- **Campus ID:** `CAMPUS001`
- **Role:** Administrator

### Technician Account
- **Email:** `tech@test.com`
- **Password:** `tech123`
- **Role:** Technician

## Login Flow

1. Go to the landing page (`/`)
2. Click "Enter Portal"
3. Select your role (Administrator or Technician)
4. Enter your credentials:
   - **For Administrator:** Campus ID, Email, Password
   - **For Technician:** Email, Password
5. You will be redirected to the dashboard upon successful login

## Troubleshooting

### Check Database Connection
Run the diagnostic script to verify your database setup:
```bash
node scripts/check-database.js
```

This will check:
- Database connection
- Users table existence
- Required columns (role, campus_id)
- Test users existence

### Common Issues

1. **"An error occurred while signing in"**
   - Check if test users exist: `node scripts/check-database.js`
   - Verify database connection in `.env` file
   - Check server console for detailed error messages

2. **"Invalid email or password"**
   - Make sure you've run `node scripts/create-test-users.js`
   - Verify you're using the correct credentials (see above)

3. **Not redirecting to dashboard**
   - Check browser console for errors
   - Verify session cookie is being set (check browser DevTools > Application > Cookies)
   - Make sure database columns exist

## Notes

- The dashboard is now protected and requires authentication
- If you try to access `/dashboard` without being logged in, you'll be redirected to the landing page
- Sessions are stored in HTTP-only cookies and last for 7 days
- Error messages have been improved to show more specific issues