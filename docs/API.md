# API Documentation

## Overview

RESTful API following OpenAPI 3.0 specification. All endpoints require authentication (JWT token in Authorization header).

## Base URL

```
Development: http://localhost:3000/api
Production: https://api.soc-lab.example.com
```

## Authentication

Include JWT token in all requests:

```
Authorization: Bearer <token>
```

## Response Format

All responses use consistent format:

### Success (2xx)
```json
{
  "success": true,
  "data": { /* response payload */ },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0"
  }
}
```

### Error (4xx, 5xx)
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": { /* additional info */ }
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "requestId": "req-12345"
  }
}
```

## API Modules

### Authentication
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh token
- `POST /auth/register` - User registration

### Alerts
- `GET /alerts` - List alerts
- `GET /alerts/:id` - Get alert details
- `POST /alerts/:id/acknowledge` - Acknowledge alert
- `POST /alerts/:id/close` - Close alert

### Investigation
- `GET /investigations` - List investigations
- `POST /investigations` - Create investigation
- `GET /investigations/:id` - Get investigation details
- `GET /investigations/:id/timeline` - Get event timeline
- `GET /investigations/:id/graph` - Get entity graph

### Cases
- `GET /cases` - List cases
- `POST /cases` - Create case
- `PUT /cases/:id` - Update case
- `POST /cases/:id/assign` - Assign case

### Detection
- `GET /detections` - List detections
- `GET /detections/:id` - Get detection details
- `POST /detections/test` - Test detection rule

### Reporting
- `GET /reports` - List reports
- `POST /reports/generate` - Generate report
- `GET /reports/:id/download` - Download report

### Administration
- `GET /users` - List users
- `POST /users` - Create user
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

## Rate Limiting

- Standard: 100 requests per minute
- Elevated: 1000 requests per minute (on request)

Rate limit info in response headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1609459200
```

## Pagination

List endpoints support pagination:

```
GET /alerts?page=1&limit=50&sort=-created_at
```

Response includes pagination metadata:
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "pages": 5
  }
}
```

## Filtering

Query parameters for filtering:

```
GET /alerts?severity=high&status=open&created_after=2024-01-01
```

## Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| `AUTH_FAILED` | 401 | Authentication failed |
| `AUTH_REQUIRED` | 401 | Authentication required |
| `PERMISSION_DENIED` | 403 | Permission denied |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Validation failed |
| `CONFLICT` | 409 | Resource conflict |
| `RATE_LIMIT` | 429 | Rate limit exceeded |
| `SERVER_ERROR` | 500 | Internal server error |

## Webhook Endpoints

Register webhooks for event notifications:

```
POST /webhooks
{
  "url": "https://your-service.com/webhook",
  "events": ["alert.created", "alert.acknowledged"],
  "active": true
}
```

Events:
- `alert.created`
- `alert.acknowledged`
- `alert.closed`
- `investigation.created`
- `investigation.completed`
- `case.created`
- `case.updated`

## OpenAPI Spec

Full OpenAPI 3.0 specification available at:

```
GET /api/docs/openapi.json
```

Interactive API documentation:

```
GET /api/docs
```

## SDK

Official SDKs available:
- Python: `pip install soc-lab-sdk`
- JavaScript: `npm install @soc-lab/sdk`
- Go: `go get github.com/soc-lab/sdk-go`

## Versioning

API versioning via URL path: `/api/v1/`, `/api/v2/`

Current version: `v1`

## Deprecation

Deprecated endpoints will be supported for 6 months with warning header:

```
Deprecation: true
Sunset: Sun, 30 Jun 2024 23:59:59 GMT
```
