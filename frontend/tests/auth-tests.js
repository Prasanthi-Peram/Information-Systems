const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api';
const USERS = [
  {
    email: `test-admin-${Date.now()}@example.com`,
    password: 'testpass123',
    username: 'Test Admin',
    role: 'administrator',
    campusId: 'CAMPUS-001',
  },
  {
    email: `test-tech-${Date.now()}@example.com`,
    password: 'testpass123',
    username: 'Test Technician',
    role: 'technician',
  },
];

const tests = {
  passed: 0,
  failed: 0,
};

// Helper functions
async function request(method, endpoint, data = null, token = null) {
  const config = {
    method,
    url: `${API_BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
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
async function testSignUp() {
  section('Sign Up');

  for (const user of USERS) {
    const response = await request('POST', '/auth/signup', user);
    assert(response.status === 201, `Sign up successful for ${user.role}`);
    assert(response.data.token, `JWT token returned for ${user.role}`);
    assert(response.data.user.email === user.email, `User email matches for ${user.role}`);

    // Store token for later tests
    user.token = response.data.token;
    user.userId = response.data.user.id;
  }
}

async function testSignIn() {
  section('Sign In');

  for (const user of USERS) {
    const response = await request('POST', '/auth/signin', {
      email: user.email,
      password: user.password,
      role: user.role,
      campusId: user.campusId,
    });

    assert(response.status === 200, `Sign in successful for ${user.role}`);
    assert(response.data.token, `JWT token returned for ${user.role}`);
    assert(response.data.user.role === user.role, `User role matches for ${user.role}`);
  }
}

async function testSignInWithWrongPassword() {
  section('Sign In - Error Cases');

  const user = USERS[0];
  const response = await request('POST', '/auth/signin', {
    email: user.email,
    password: 'wrongpassword',
    role: user.role,
    campusId: user.campusId,
  });

  assert(response.error && response.status === 401, 'Wrong password returns 401');
  assert(response.data.error === 'Invalid email or password', 'Proper error message for wrong password');
}

async function testSignInMissingRole() {
  section('Sign In - Missing Role');

  const user = USERS[0];
  const response = await request('POST', '/auth/signin', {
    email: user.email,
    password: user.password,
  });

  assert(response.status === 400, 'Missing role returns 400');
}

async function testCurrentUser() {
  section('Get Current User');

  const user = USERS[0];
  const response = await request('GET', '/auth/me', null, user.token);

  assert(response.status === 200, 'Get current user successful');
  assert(response.data.data.email === user.email, 'Current user email matches');
  assert(response.data.data.id === user.userId, 'Current user ID matches');
}

async function testGetUserProfile() {
  section('Get User Profile');

  const user = USERS[0];
  const response = await request('GET', '/profile', null, user.token);

  assert(response.status === 200, 'Get user profile successful');
  assert(response.data.data.email === user.email, 'Profile email matches');
}

async function testUpdateProfile() {
  section('Update User Profile');

  const user = USERS[0];
  const newName = `Updated ${user.username} ${Date.now()}`;
  
  const response = await request(
    'PUT',
    '/profile',
    { name: newName },
    user.token
  );

  assert(response.status === 200, 'Update profile successful');
  assert(response.data.data.name === newName, 'Profile name updated');
}

async function testChangePassword() {
  section('Change Password');

  const user = USERS[0];
  const newPassword = 'newpassword456';

  const response = await request(
    'POST',
    '/settings/password',
    {
      currentPassword: user.password,
      newPassword: newPassword,
      confirmPassword: newPassword,
    },
    user.token
  );

  assert(response.status === 200, 'Change password successful');

  // Try to login with new password
  const signInResponse = await request('POST', '/auth/signin', {
    email: user.email,
    password: newPassword,
    role: user.role,
    campusId: user.campusId,
  });

  assert(signInResponse.status === 200, 'Login with new password successful');
}

async function testChangePasswordWithInvalidCurrent() {
  section('Change Password - Error Cases');

  const user = USERS[0];

  const response = await request(
    'POST',
    '/settings/password',
    {
      currentPassword: 'wrongcurrentpassword',
      newPassword: 'newpass123',
      confirmPassword: 'newpass123',
    },
    user.token
  );

  assert(response.status === 401, 'Wrong current password returns 401');
}

async function testPasswordMismatch() {
  section('Change Password - Confirmation Mismatch');

  const user = USERS[0];

  const response = await request(
    'POST',
    '/settings/password',
    {
      currentPassword: user.password,
      newPassword: 'newpass123',
      confirmPassword: 'differentpass456',
    },
    user.token
  );

  assert(response.status === 400, 'Password mismatch returns 400');
}

async function testLogout() {
  section('Logout');

  const user = USERS[0];
  const response = await request(
    'POST',
    '/auth/me',
    { action: 'logout' },
    user.token
  );

  assert(response.status === 200, 'Logout successful');
  assert(response.data.message.includes('Logged out'), 'Logout message present');
}

async function testInvalidToken() {
  section('Invalid Token Handling');

  const response = await request('GET', '/profile', null, 'invalid.token.here');

  assert(response.status === 401, 'Invalid token returns 401');
  assert(response.data.error === 'Unauthorized', 'Proper error message for invalid token');
}

async function testMissingToken() {
  section('Missing Token Handling');

  const response = await request('GET', '/profile', null, null);

  assert(response.status === 401, 'Missing token returns 401');
}

// Main test runner
async function runTests() {
  console.log('Starting Authentication Tests...\n');
  console.log(`API Base URL: ${API_BASE_URL}\n`);

  try {
    await testSignUp();
    await testSignIn();
    await testSignInWithWrongPassword();
    await testSignInMissingRole();
    await testCurrentUser();
    await testGetUserProfile();
    await testUpdateProfile();
    await testChangePassword();
    await testChangePasswordWithInvalidCurrent();
    await testPasswordMismatch();
    await testLogout();
    await testInvalidToken();
    await testMissingToken();
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
