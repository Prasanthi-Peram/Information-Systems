/**
 * Script to check database connection and verify test users
 * Run with: node scripts/check-database.js
 */

const { Pool } = require('pg');

// Database connection - adjust these values to match your .env file
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || process.env.DB_PASS || ''),
  database: process.env.DB_NAME || 'postgres',
});

async function checkDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('Checking database connection...\n');

    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error('❌ Users table does not exist!');
      console.log('Please create the users table first.\n');
      process.exit(1);
    }
    console.log('✅ Users table exists\n');

    // Check for required columns
    const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      AND column_name IN ('role', 'campus_id');
    `);

    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    const requiredColumns = ['role', 'campus_id'];
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

    if (missingColumns.length > 0) {
      console.warn('⚠️  Missing columns:', missingColumns.join(', '));
      console.log('Run: ALTER TABLE users ADD COLUMN role VARCHAR(20);');
      console.log('Run: ALTER TABLE users ADD COLUMN campus_id VARCHAR(50);\n');
    } else {
      console.log('✅ All required columns exist\n');
    }

    // Check for test users
    const usersCheck = await client.query(`
      SELECT email, role, campus_id 
      FROM users 
      WHERE email IN ('admin@test.com', 'tech@test.com');
    `);

    if (usersCheck.rows.length === 0) {
      console.warn('⚠️  No test users found!');
      console.log('Run: node scripts/create-test-users.js\n');
    } else {
      console.log('✅ Test users found:');
      usersCheck.rows.forEach(user => {
        console.log(`   - ${user.email} (${user.role || 'no role'})`);
      });
      console.log('');
    }

    // Test a simple query
    const testQuery = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Database connection successful`);
    console.log(`   Total users in database: ${testQuery.rows[0].count}\n`);

    console.log('Database check complete! ✅');

  } catch (error) {
    console.error('❌ Database connection failed!');
    console.error('Error:', error.message);
    console.log('\nPlease check:');
    console.log('1. Database server is running');
    console.log('2. Database credentials in .env file are correct');
    console.log('3. Database name exists');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
