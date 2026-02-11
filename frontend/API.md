# API Documentation

## Overview

This is a comprehensive REST API for managing devices, telemetry, users, and maintenance records. The API uses JWT-based authentication for secure access.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

Tokens are obtained through the `/auth/signin` or `/auth/signup` endpoints and expire after 7 days.

## Response Format

All responses follow a consistent format:

```json
{
  "status": "success|error",
  "data": {},
  "message": "Optional message",
  "error": "Error message if status is error"
}
```

## Endpoints

### Authentication

#### Sign Up

```
POST /auth/signup
```

**Request:**

```json
{
  "email": "user@example.com",
  "password": "min6chars",
  "confirmPassword": "min6chars",
  "username": "John Doe",
  "role": "technician|administrator",
  "campusId": "CAMPUS-001", // Required for administrators
  "avatar": "https://..." // Optional
}
```

**Response:** `201 Created`

```json
{
  "status": "success",
  "message": "Account created successfully",
  "user": { ... },
  "token": "eyJhbGc..."
}
```

#### Sign In

```
POST /auth/signin
```

**Request:**

```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "technician|administrator",
  "campusId": "CAMPUS-001" // Required for administrators
}
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "message": "Signed in successfully",
  "user": { ... },
  "token": "eyJhbGc..."
}
```

#### Get Current User

```
GET /auth/me
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "technician",
    "avatar": "...",
    "campusId": "CAMPUS-001"
  }
}
```

#### Logout

```
POST /auth/me
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "logout"
}
```

**Response:** `200 OK`

### Users

#### Get All Users

```
GET /api/users?limit=100&offset=0&role=technician
Authorization: Bearer <token>
```

**Query Parameters:**

- `limit` (default: 100) - Number of records to return
- `offset` (default: 0) - Number of records to skip
- `role` (optional) - Filter by role: 'technician' or 'administrator'

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": [ ... ],
  "count": 10
}
```

#### Get User by ID

```
GET /api/users/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`

#### Get User Profile

```
GET /api/profile
Authorization: Bearer <token>
```

**Response:** `200 OK`

#### Update User Profile

```
PUT /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "avatar": "https://...",
  "email": "newemail@example.com"
}
```

**Response:** `200 OK`

#### Update User (Admin)

```
PUT /api/users/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "...",
  "role": "...",
  "status": "..."
}
```

**Response:** `200 OK`

#### Change Password

```
POST /api/settings/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "old_password",
  "newPassword": "new_password",
  "confirmPassword": "new_password"
}
```

**Response:** `200 OK`

### Devices

#### Get All Devices

```
GET /api/devices?limit=100&offset=0&room_id=room-001&status=active
Authorization: Bearer <token>
```

**Query Parameters:**

- `limit` (default: 100)
- `offset` (default: 0)
- `room_id` (optional) - Filter by room
- `status` (optional) - Filter by status

**Response:** `200 OK`

#### Create Device

```
POST /api/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Power Meter 1",
  "location": "Room 101",
  "type": "power_meter",
  "room_id": "room-001",
  "status": "active"
}
```

**Response:** `201 Created`

#### Get Device

```
GET /api/devices/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`

#### Update Device

```
PUT /api/devices/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "maintenance",
  "location": "New Location"
}
```

**Response:** `200 OK`

#### Delete Device

```
DELETE /api/devices/:id
Authorization: Bearer <token>
```

**Response:** `200 OK`

### Telemetry

#### Submit Telemetry Data

```
POST /api/telemetry
Content-Type: application/json

{
  "time_stamp": "2026-02-12T10:30:00Z",
  "device_id": 1,
  "current": 15.5,
  "voltage": 230,
  "power_factor": 0.95,
  "real_power": 3.5,
  "room_temp": 22.5,
  "external_temp": 18.0,
  "humidity": 65,
  "unit_consumption": 0.15
}
```

**Response:** `200 OK`

#### Get Telemetry Data

```
GET /api/telemetry?device_id=1&limit=100&offset=0
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": [ ... ],
  "count": 10
}
```

#### Get Metrics

```
GET /api/telemetry/metrics?device_id=1&type=latest|health|metrics|range&interval=60&start_date=...&end_date=...
Authorization: Bearer <token>
```

**Query Parameters:**

- `device_id` (required)
- `type` (optional: latest, health, metrics, range)
- `interval` (optional: for metrics aggregation in minutes)
- `start_date`, `end_date` (required for type=range)

**Response:** `200 OK`

### Rooms

#### Get All Rooms

```
GET /api/rooms?limit=100&offset=0&building=Building%20A&floor=2
Authorization: Bearer <token>
```

**Response:** `200 OK`

#### Create Room

```
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Conference Room A",
  "location": "Building A, Floor 2",
  "floor": "2",
  "building": "Building A",
  "capacity": 30
}
```

**Response:** `201 Created`

### Maintenance

#### Get Maintenance Records

```
GET /api/maintenance?device_id=1&status=pending
Authorization: Bearer <token>
```

**Response:** `200 OK`

#### Create Maintenance Record

```
POST /api/maintenance
Authorization: Bearer <token>
Content-Type: application/json

{
  "device_id": 1,
  "description": "Regular maintenance check",
  "status": "pending",
  "scheduled_date": "2026-02-20T10:00:00Z",
  "notes": "Check all connections"
}
```

**Response:** `201 Created`

#### Update Maintenance Record

```
PUT /api/maintenance
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "record-id",
  "status": "completed",
  "completed_date": "2026-02-15T10:00:00Z"
}
```

**Response:** `200 OK`

### Settings

#### Get Settings

```
GET /api/settings?key=setting_key
Authorization: Bearer <token>
```

**Response:** `200 OK`

#### Update Settings

```
PUT /api/settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "key": "theme",
  "value": "dark",
  "type": "string"
}
```

**Response:** `200 OK`

### DSS (Decision Support System)

#### Get DSS Analytics

```
GET /api/dss?type=summary|device_performance|energy_consumption|anomalies|maintenance_status&start_date=...&end_date=...
Authorization: Bearer <token>
```

**Query Parameters:**

- `type` (optional: summary, device_performance, energy_consumption, anomalies, maintenance_status)
- `start_date`, `end_date` (optional: for date range queries)

**Response:** `200 OK`

### Dashboard

#### Get Dashboard Statistics

```
GET /api/dashboard/statistics?start_date=...&end_date=...
Authorization: Bearer <token>
```

**Response:** `200 OK`

```json
{
  "status": "success",
  "data": {
    "overview": { ... },
    "devices": [ ... ]
  }
}
```

### Health

#### Check API Health

```
GET /api/health
```

**Response:** `200 OK`

```json
{
  "status": "healthy",
  "backend": { ... },
  "timestamp": "2026-02-12T10:30:00Z"
}
```

### WebSocket

#### Check WebSocket Status

```
GET /api/ws?action=status
```

**Response:** `200 OK` or `400 Bad Request`

## Error Handling

### Common Error Codes

| Code | Message               | Description                             |
| ---- | --------------------- | --------------------------------------- |
| 400  | Bad Request           | Invalid request parameters              |
| 401  | Unauthorized          | Missing or invalid authentication token |
| 403  | Forbidden             | Insufficient permissions                |
| 404  | Not Found             | Resource not found                      |
| 409  | Conflict              | Resource already exists                 |
| 500  | Internal Server Error | Server error                            |
| 503  | Service Unavailable   | Backend service unavailable             |

### Error Response Example

```json
{
  "status": "error",
  "error": "Invalid email format",
  "message": "The email address provided is not valid"
}
```

## Rate Limiting

Currently, rate limiting is not implemented but may be added in the future.

## Best Practices

1. **Store tokens securely** - Use httpOnly cookies or secure storage
2. **Refresh tokens** - Implement token refresh before expiration
3. **Validate input** - Always validate on client and server
4. **Use HTTPS** - In production, always use HTTPS
5. **Error handling** - Implement proper error handling on client side
6. **Pagination** - Use limit and offset for large datasets
7. **Filtering** - Use available filters to reduce data transfer

## Example Usage

### JavaScript/Node.js

```javascript
const token = "your-jwt-token";

// Get all devices
const response = await fetch("http://localhost:3000/api/devices", {
  method: "GET",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
});

const data = await response.json();
console.log(data);
```

### cURL

```bash
curl -H "Authorization: Bearer your-jwt-token" \
  http://localhost:3000/api/devices
```

## Changelog

### Version 1.0.0

- Initial API release
- Authentication endpoints
- Device management
- Telemetry collection
- User management
- Maintenance tracking
- Analytics (DSS)
- Dashboard statistics
