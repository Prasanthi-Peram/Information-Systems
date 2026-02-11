/**
 * Script to create test users in the database
 * Run with: node scripts/create-test-users.js
 */

const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

// Database connection - adjust these values to match your .env file
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: String(process.env.DB_PASSWORD || process.env.DB_PASS || ''),
  database: process.env.DB_NAME || 'postgres',
});

async function createTestUsers() {
  const client = await pool.connect();
  
  try {
    console.log('Creating test users...\n');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const techPassword = await bcrypt.hash('tech123', 10);

    // Check if users already exist
    const adminCheck = await client.query('SELECT id FROM users WHERE email = $1', ['admin@test.com']);
    const techCheck = await client.query('SELECT id FROM users WHERE email = $1', ['tech@test.com']);

    // Create Administrator user
    if (adminCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (id, email, password, name, role, campus_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          '00000000-0000-0000-0000-000000000001',
          'admin@test.com',
          adminPassword,
          'Test Administrator',
          'administrator',
          'CAMPUS001',
          new Date().toISOString()
        ]
      );
      console.log('✅ Administrator user created:');
      console.log('   Email: admin@test.com');
      console.log('   Password: admin123');
      console.log('   Campus ID: CAMPUS001');
      console.log('   Role: administrator\n');
    } else {
      console.log('⚠️  Administrator user already exists (admin@test.com)\n');
    }

    // Create Technician user
    if (techCheck.rows.length === 0) {
      await client.query(
        `INSERT INTO users (id, email, password, name, role, created_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          '00000000-0000-0000-0000-000000000002',
          'tech@test.com',
          techPassword,
          'Test Technician',
          'technician',
          new Date().toISOString()
        ]
      );
      console.log('✅ Technician user created:');
      console.log('   Email: tech@test.com');
      console.log('   Password: tech123');
      console.log('   Role: technician\n');
    } else {
      console.log('⚠️  Technician user already exists (tech@test.com)\n');
    }

    console.log('Test users setup complete!');
    console.log('\n📝 Login Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ADMINISTRATOR:');
    console.log('  Email: admin@test.com');
    console.log('  Password: admin123');
    console.log('  Campus ID: CAMPUS001');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TECHNICIAN:');
    console.log('  Email: tech@test.com');
    console.log('  Password: tech123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestUsers();
