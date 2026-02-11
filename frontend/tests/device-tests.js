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
    email: `test-device-${Date.now()}@example.com`,
    password: 'testpass123',
    username: 'Device Tester',
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
async function testGetDevices() {
  section('Get Devices');

  const response = await request('GET', '/devices');
  assert(response.status === 200, 'Get devices returns 200');
  assert(Array.isArray(response.data.data), 'Devices data is an array');
  assert('count' in response.data, 'Response includes count');
}

async function testGetDevicesWithFilters() {
  section('Get Devices with Filters');

  const roomIdResponse = await request('GET', '/devices?room_id=room-001');
  assert(roomIdResponse.status === 200, 'Get devices with room_id filter returns 200');

  const statusResponse = await request('GET', '/devices?status=active');
  assert(statusResponse.status === 200, 'Get devices with status filter returns 200');

  const paginationResponse = await request('GET', '/devices?limit=10&offset=0');
  assert(paginationResponse.status === 200, 'Get devices with pagination returns 200');
}

async function testCreateDevice() {
  section('Create Device');

  const deviceData = {
    name: `Test Device ${Date.now()}`,
    location: 'Test Room 101',
    type: 'power_meter',
    room_id: 'room-test-001',
    status: 'active',
  };

  const response = await request('POST', '/devices', deviceData);
  assert(response.status === 201, 'Create device returns 201');
  assert(response.data.data.name === deviceData.name, 'Device name matches');
  assert(response.data.data.id, 'Device ID returned');

  // Store device ID for further tests
  return response.data.data.id;
}

async function testGetDeviceById(deviceId) {
  section('Get Device by ID');

  const response = await request('GET', `/devices/${deviceId}`);
  assert(response.status === 200, 'Get device by ID returns 200');
  assert(response.data.data.id === deviceId, 'Device ID matches');
}

async function testUpdateDevice(deviceId) {
  section('Update Device');

  const updates = {
    location: 'Updated Location',
    status: 'maintenance',
  };

  const response = await request('PUT', `/devices/${deviceId}`, updates);
  assert(response.status === 200, 'Update device returns 200');
  assert(response.data.data.location === updates.location, 'Device location updated');
  assert(response.data.data.status === updates.status, 'Device status updated');
}

async function testDeleteDevice(deviceId) {
  section('Delete Device');

  const response = await request('DELETE', `/devices/${deviceId}`);
  assert(response.status === 200, 'Delete device returns 200');
  assert(response.data.message.includes('deleted'), 'Delete message present');

  // Verify deletion
  const getResponse = await request('GET', `/devices/${deviceId}`);
  assert(getResponse.status === 404, 'Deleted device not found');
}

async function testCreateRoom() {
  section('Create Room');

  const roomData = {
    name: `Test Room ${Date.now()}`,
    location: 'Building A, Floor 2',
    floor: '2',
    building: 'Building A',
    capacity: 30,
  };

  const response = await request('POST', '/rooms', roomData);
  assert(response.status === 201, 'Create room returns 201');
  assert(response.data.data.name === roomData.name, 'Room name matches');

  return response.data.data.id;
}

async function testGetRooms() {
  section('Get Rooms');

  const response = await request('GET', '/rooms');
  assert(response.status === 200, 'Get rooms returns 200');
  assert(Array.isArray(response.data.data), 'Rooms data is an array');
}

async function testGetRoomsWithFilters() {
  section('Get Rooms with Filters');

  const buildingResponse = await request('GET', '/rooms?building=Building%20A');
  assert(buildingResponse.status === 200, 'Get rooms with building filter returns 200');

  const floorResponse = await request('GET', '/rooms?floor=2');
  assert(floorResponse.status === 200, 'Get rooms with floor filter returns 200');
}

async function testMaintenance() {
  section('Maintenance');

  const maintenanceData = {
    device_id: 1,
    description: 'Regular maintenance check',
    status: 'pending',
    scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    notes: 'Check all connections',
  };

  const createResponse = await request('POST', '/maintenance', maintenanceData);
  assert(createResponse.status === 201, 'Create maintenance record returns 201');

  const getResponse = await request('GET', '/maintenance');
  assert(getResponse.status === 200, 'Get maintenance records returns 200');

  const statusFilterResponse = await request('GET', '/maintenance?status=pending');
  assert(statusFilterResponse.status === 200, 'Get maintenance with status filter returns 200');
}

async function testInvalidDeviceId() {
  section('Error Handling - Invalid Device ID');

  const response = await request('GET', '/devices/invalid');
  assert(response.status === 400, 'Invalid device ID returns 400');
}

async function testMissingRequiredFields() {
  section('Error Handling - Missing Required Fields');

  const response = await request('POST', '/devices', {
    location: 'Test Location',
    // missing 'name'
  });

  assert(response.status === 400, 'Missing required field returns 400');
}

// Main test runner
async function runTests() {
  console.log('Starting Device & Room Tests...\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  try {
    await setup();
    
    // Device tests
    await testGetDevices();
    await testGetDevicesWithFilters();
    
    const deviceId = await testCreateDevice();
    if (deviceId) {
      await testGetDeviceById(deviceId);
      await testUpdateDevice(deviceId);
      await testDeleteDevice(deviceId);
    }

    // Room tests
    await testGetRooms();
    await testGetRoomsWithFilters();
    const roomId = await testCreateRoom();

    // Maintenance tests
    await testMaintenance();

    // Error handling
    await testInvalidDeviceId();
    await testMissingRequiredFields();

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
