const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
let authToken = '';

const tests = {
  passed: 0,
  failed: 0,
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

// Setup - Create test user
async function setup() {
  section('Setup');
  
  const signUpResponse = await request('POST', '/auth/signup', {
    email: `test-telemetry-${Date.now()}@example.com`,
    password: 'testpass123',
    username: 'Telemetry Tester',
    role: 'technician',
  });

  if (signUpResponse.status === 201) {
    authToken = signUpResponse.data.token;
    console.log('✓ Test user created and authenticated');
  } else {
    console.error('Failed to create test user');
    process.exit(1);
  }
}

// Test suites
async function testTelemetryData() {
  section('Telemetry Data');

  const telemetryData = {
    time_stamp: new Date().toISOString(),
    device_id: 1,
    current: 15.5,
    voltage: 230,
    power_factor: 0.95,
    real_power: 3.5,
    room_temp: 22.5,
    external_temp: 18.0,
    humidity: 65,
    unit_consumption: 0.15,
  };

  const response = await request('POST', '/telemetry', telemetryData);
  assert(response.status === 200, 'Telemetry POST returns 200');
  assert(response.data.status === 'success', 'Telemetry received successfully');
}

async function testTelemetryWithMissingFields() {
  section('Telemetry - Missing Required Fields');

  // Missing device_id
  const response1 = await request('POST', '/telemetry', {
    time_stamp: new Date().toISOString(),
    voltage: 230,
  });

  assert(response1.status === 400, 'Missing device_id returns 400');
  assert(response1.data.error, 'Error message present for missing field');

  // Missing time_stamp
  const response2 = await request('POST', '/telemetry', {
    device_id: 1,
    voltage: 230,
  });

  assert(response2.status === 400, 'Missing time_stamp returns 400');
}

async function testGetTelemetry() {
  section('Get Telemetry');

  const response = await request('GET', '/telemetry?device_id=1&limit=50');
  assert(response.status === 200, 'Get telemetry returns 200');
  assert(Array.isArray(response.data.data), 'Telemetry data is an array');
  assert('count' in response.data, 'Response includes count');
}

async function testTelemetryPagination() {
  section('Telemetry Pagination');

  const page1 = await request('GET', '/telemetry?device_id=1&limit=10&offset=0');
  assert(page1.status === 200, 'First page returns 200');

  const page2 = await request('GET', '/telemetry?device_id=1&limit=10&offset=10');
  assert(page2.status === 200, 'Second page returns 200');
}

async function testMetricsLatest() {
  section('Metrics - Latest');

  const response = await request('GET', '/telemetry/metrics?device_id=1&type=latest');
  assert(response.status === 200, 'Latest metrics returns 200');
  assert(response.data.type === 'latest', 'Query type is latest');
}

async function testMetricsHealth() {
  section('Metrics - Health');

  const response = await request('GET', '/telemetry/metrics?device_id=1&type=health');
  assert(response.status === 200, 'Health metrics returns 200');
  assert(response.data.type === 'health', 'Query type is health');
}

async function testMetricsAggregated() {
  section('Metrics - Aggregated');

  const response = await request('GET', '/telemetry/metrics?device_id=1&type=metrics&interval=60');
  assert(response.status === 200, 'Aggregated metrics returns 200');
  assert(response.data.type === 'metrics', 'Query type is metrics');
}

async function testMetricsDateRange() {
  section('Metrics - Date Range');

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const response = await request(
    'GET',
    `/telemetry/metrics?device_id=1&type=range&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
  );

  assert(response.status === 200, 'Date range query returns 200');
  assert(response.data.type === 'range', 'Query type is range');
}

async function testMetricsInvalidType() {
  section('Metrics - Error Handling');

  const response = await request('GET', '/telemetry/metrics?device_id=1&type=invalid-type');
  assert(response.status === 400, 'Invalid type returns 400');
}

async function testMetricsNoDeviceId() {
  section('Metrics - Missing Device ID');

  const response = await request('GET', '/telemetry/metrics?type=latest');
  assert(response.status === 400, 'Missing device_id returns 400');
}

async function testDSSAnalytics() {
  section('DSS Analytics');

  const summaryResponse = await request('GET', '/dss?type=summary');
  assert(summaryResponse.status === 200, 'DSS summary returns 200');
  assert(summaryResponse.data.type === 'summary', 'Type is summary');

  const performanceResponse = await request('GET', '/dss?type=device_performance');
  assert(performanceResponse.status === 200, 'DSS device performance returns 200');

  const energyResponse = await request('GET', '/dss?type=energy_consumption');
  assert(energyResponse.status === 200, 'DSS energy consumption returns 200');

  const anomaliesResponse = await request('GET', '/dss?type=anomalies');
  assert(anomaliesResponse.status === 200, 'DSS anomalies returns 200');

  const maintenanceResponse = await request('GET', '/dss?type=maintenance_status');
  assert(maintenanceResponse.status === 200, 'DSS maintenance status returns 200');
}

async function testDSSDateRange() {
  section('DSS with Date Range');

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  const response = await request(
    'GET',
    `/dss?type=energy_consumption&start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
  );

  assert(response.status === 200, 'DSS with date range returns 200');
}

async function testDashboardStatistics() {
  section('Dashboard Statistics');

  const response = await request('GET', '/dashboard/statistics');
  assert(response.status === 200, 'Dashboard statistics returns 200');
  assert(response.data.data.overview, 'Overview data present');
  assert(response.data.data.devices, 'Devices data present');
}

async function testDashboardWithDateRange() {
  section('Dashboard with Date Range');

  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

  const response = await request(
    'GET',
    `/dashboard/statistics?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
  );

  assert(response.status === 200, 'Dashboard with date range returns 200');
}

async function testTelemetryMonitoring() {
  section('Telemetry Monitoring');

  // Send multiple telemetry readings
  const deviceId = Math.floor(Math.random() * 1000);
  
  for (let i = 0; i < 3; i++) {
    const response = await request('POST', '/telemetry', {
      time_stamp: new Date(Date.now() - i * 1000).toISOString(),
      device_id: deviceId,
      current: 10 + Math.random() * 20,
      voltage: 220 + Math.random() * 20,
      power_factor: 0.85 + Math.random() * 0.15,
      real_power: 2 + Math.random() * 3,
    });

    assert(response.status === 200, `Telemetry reading ${i + 1} sent successfully`);
  }

  // Verify readings are stored
  const getResponse = await request('GET', `/telemetry?device_id=${deviceId}`);
  assert(getResponse.status === 200, 'Telemetry readings retrieved');
}

// Main test runner
async function runTests() {
  console.log('Starting Telemetry & Metrics Tests...\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  try {
    await setup();
    
    // Basic telemetry tests
    await testTelemetryData();
    await testTelemetryWithMissingFields();
    await testGetTelemetry();
    await testTelemetryPagination();

    // Metrics tests
    await testMetricsLatest();
    await testMetricsHealth();
    await testMetricsAggregated();
    await testMetricsDateRange();
    await testMetricsInvalidType();
    await testMetricsNoDeviceId();

    // DSS and Dashboard tests
    await testDSSAnalytics();
    await testDSSDateRange();
    await testDashboardStatistics();
    await testDashboardWithDateRange();

    // Advanced tests
    await testTelemetryMonitoring();

  } catch (error) {
    console.error('\nTest Error:', error.message);
    console.error(error);
    process.exit(1);
  }

  // Summary
  section('Test Summary');
  console.log(`Passed: ${tests.passed}`);
  console.log(`Failed: ${tests.failed}`);
  console.log(`Total: ${tests.passed + tests.failed}`);

  if (tests.failed > 0) {
    process.exit(1);
  }
}

runTests();
