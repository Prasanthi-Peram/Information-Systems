const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = '';

const tests = {
  passed: 0,
  failed: 0,
  skipped: 0,
};

// Helper functions
async function request(method, endpoint, data = null) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
    },
  };

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { status: response.status, data: response.data };
  } catch (error) {
    if (error.response) {
      return { status: error.response.status, data: error.response.data, error: true };
    }
    throw error;
  }
}

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    tests.passed++;
  } else {
    console.log(`✗ ${message}`);
    tests.failed++;
  }
}

function section(title) {
  console.log(`\n=== ${title} ===`);
}

// Test suites
async function testHealthEndpoint() {
  section('Health Check');
  
  const response = await request('GET', '/health');
  assert(response.status === 200, 'Health endpoint returns 200');
  assert(response.data.status === 'healthy', 'Health status is healthy');
}

async function testWebSocketEndpoint() {
  section('WebSocket');
  
  const response = await request('GET', '/ws?action=status');
  assert(response.status === 200 || response.status === 400, 'WebSocket endpoint accessible');
}

async function testTelemetryEndpoint() {
  section('Telemetry');
  
  // Without auth - should fail
  const noAuthResponse = await request('GET', '/telemetry?device_id=1');
  assert(noAuthResponse.error && noAuthResponse.status === 401, 'Telemetry GET requires authentication');
  
  // POST without auth
  const postNoAuthResponse = await request('POST', '/telemetry', {
    time_stamp: new Date().toISOString(),
    device_id: 1,
    voltage: 230,
    current: 10,
  });
  assert(postNoAuthResponse.status === 200 || postNoAuthResponse.status === 400, 'Telemetry POST is accessible');
}

async function testDevicesEndpoint() {
  section('Devices');
  
  const noAuthResponse = await request('GET', '/devices');
  assert(noAuthResponse.error && noAuthResponse.status === 401, 'Devices GET requires authentication');
}

async function testMetricsEndpoint() {
  section('Metrics');
  
  const noAuthResponse = await request('GET', '/telemetry/metrics?device_id=1&type=latest');
  assert(noAuthResponse.error && noAuthResponse.status === 401, 'Metrics endpoint requires authentication');
}

async function testUsersEndpoint() {
  section('Users');
  
  const noAuthResponse = await request('GET', '/users');
  assert(noAuthResponse.error && noAuthResponse.status === 401, 'Users GET requires authentication');
}

async function testProfileEndpoint() {
  section('Profile');
  
  const noAuthResponse = await request('GET', '/profile');
  assert(noAuthResponse.error && noAuthResponse.status === 401, 'Profile GET requires authentication');
}

async function testSettingsEndpoint() {
  section('Settings');
  
  const noAuthResponse = await request('GET', '/settings');
  assert(noAuthResponse.error && noAuthResponse.status === 401, 'Settings GET requires authentication');
}

async function testMaintenanceEndpoint() {
  section('Maintenance');
  
  const noAuthResponse = await request('GET', '/maintenance');
  assert(noAuthResponse.error && noAuthResponse.status === 401, 'Maintenance GET requires authentication');
}

async function testRoomsEndpoint() {
  section('Rooms');
  
  const noAuthResponse = await request('GET', '/rooms');
  assert(noAuthResponse.error && noAuthResponse.status === 401, 'Rooms GET requires authentication');
}

async function testDSSEndpoint() {
  section('DSS (Decision Support System)');
  
  const noAuthResponse = await request('GET', '/dss?type=summary');
  assert(noAuthResponse.error && noAuthResponse.status === 401, 'DSS GET requires authentication');
}

async function testDashboardEndpoint() {
  section('Dashboard');
  
  const noAuthResponse = await request('GET', '/dashboard/statistics');
  assert(noAuthResponse.error && noAuthResponse.status === 401, 'Dashboard statistics requires authentication');
}

// Main test runner
async function runTests() {
  console.log('Starting API Tests...\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  try {
    // Public endpoints
    await testHealthEndpoint();
    await testWebSocketEndpoint();
    
    // Endpoints that require auth
    await testTelemetryEndpoint();
    await testDevicesEndpoint();
    await testMetricsEndpoint();
    await testUsersEndpoint();
    await testProfileEndpoint();
    await testSettingsEndpoint();
    await testMaintenanceEndpoint();
    await testRoomsEndpoint();
    await testDSSEndpoint();
    await testDashboardEndpoint();

  } catch (error) {
    console.error('\nTest Error:', error.message);
    process.exit(1);
  }

  // Summary
  section('Test Summary');
  console.log(`Passed: ${tests.passed}`);
  console.log(`Failed: ${tests.failed}`);
  console.log(`Skipped: ${tests.skipped}`);
  console.log(`Total: ${tests.passed + tests.failed + tests.skipped}`);

  if (tests.failed > 0) {
    process.exit(1);
  }
}

runTests();
