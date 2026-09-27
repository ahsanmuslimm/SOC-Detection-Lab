# Modules Reference

## Complete Module List (95 Total)

### Backend Modules (67 total)

#### Domain 1: Core Infrastructure (6 modules)
- `config-service` - Configuration management
- `logging-service` - Structured logging
- `types-definitions` - TypeScript types
- `error-handling` - Error classes & handling
- `monitoring-service` - Metrics & health
- `utils-helpers` - Common utilities

#### Domain 2: Authentication (4 modules)
- `user-service` - User management
- `auth-service` - Login/logout
- `session-service` - Session management
- `token-service` - JWT tokens

#### Domain 3: Authorization (4 modules)
- `role-service` - Role management
- `permission-service` - Permissions
- `rbac-service` - Role-based access control
- `policy-service` - Policy engine

#### Domain 4: Data Access (4 modules)
- `postgres-client` - PostgreSQL driver
- `opensearch-client` - OpenSearch driver
- `cache-client` - Redis caching
- `audit-client` - Audit logging

#### Domain 5: Event Pipeline (5 modules)
- `event-collector` - Event ingestion
- `event-parser` - Event parsing
- `event-normalizer` - Event normalization
- `event-enricher` - Event enrichment
- `event-transformer` - Event transformation

#### Domain 6: Detection Engine (5 modules)
- `rule-engine` - Rule-based detection
- `ml-detection` - ML-based detection
- `anomaly-detector` - Anomaly detection
- `threat-scorer` - Threat scoring
- `detection-service` - Detection orchestration

#### Domain 7: Alerts (4 modules)
- `alert-service` - Alert management
- `alert-router` - Alert routing
- `notification-service` - Notifications
- `escalation-service` - Alert escalation

#### Domain 8: Investigation (4 modules)
- `investigation-service` - Investigation management
- `timeline-service` - Event timeline
- `graph-service` - Entity relationships
- `correlation-service` - Event correlation

#### Domain 9: Case Management (4 modules)
- `case-service` - Case management
- `ticket-service` - Ticketing
- `workflow-service` - Workflow automation
- `assignment-service` - Task assignment

#### Domain 10: Response (4 modules)
- `response-service` - Response orchestration
- `remediation-service` - Remediation actions
- `containment-service` - Threat containment
- `recovery-service` - System recovery

#### Domain 11: Reporting (4 modules)
- `report-generator` - Report generation
- `dashboard-service` - Dashboard data
- `metric-service` - Metrics aggregation
- `export-service` - Data export

#### Domain 12: Integrations (4 modules)
- `api-gateway` - API gateway
- `webhook-service` - Webhook management
- `third-party-connector` - Third-party APIs
- `external-api-service` - External service calls

### Frontend Modules (28 total)

#### Layer 1: Components (9 modules)
- `alert-card` - Alert card component
- `timeline-component` - Timeline display
- `chart-component` - Charts/graphs
- `table-component` - Data tables
- `modal-component` - Modals
- `form-component` - Forms
- `badge-component` - Badges/tags
- `toast-component` - Notifications
- `breadcrumb-component` - Breadcrumbs

#### Layer 2: Pages (10 modules)
- `dashboard-page` - Main dashboard
- `alerts-page` - Alerts list
- `investigation-page` - Investigation detail
- `cases-page` - Case management
- `settings-page` - Settings
- `reports-page` - Reports
- `users-page` - User management
- `audit-log-page` - Audit logs
- `profile-page` - User profile
- `admin-console-page` - Admin panel

#### Layer 3: Services (9 modules)
- `api-client` - HTTP client
- `auth-service` - Auth management
- `state-management` - Global state
- `notification-service` - Notifications
- `storage-service` - Local storage
- `analytics-service` - Analytics
- `session-service` - Session mgmt
- `error-handler` - Error handling
- `request-interceptor` - HTTP interceptors

### Shared Modules (12 total)
- `types` - Shared types
- `middleware` - Common middleware
- `monitoring` - Monitoring utilities
- `validation` - Input validation
- `constants` - Constants
- `decorators` - TypeScript decorators
- `guards` - Route guards
- `filters` - Exception filters
- `interceptors` - HTTP interceptors
- `utilities` - Helper functions
- `helpers` - Business logic helpers
- `formatting` - Data formatting

## Module Naming Convention

**Backend modules**: `kebab-case` with service suffix where appropriate
```
domain-X-description/
├── config-service
├── user-service
├── auth-service
└── detection-engine
```

**Frontend components**: `kebab-case` with type suffix
```
layer-X-type/
├── alert-card
├── dashboard-page
├── api-service
└── state-management
```

## Module Dependency Order (Build Sequence)

### Tier 0 (Foundation) - Week 1
Must complete first:
1. `config-service`
2. `logging-service`
3. `types-definitions`
4. `error-handling`
5. `postgres-client`
6. `opensearch-client`
7. `cache-client`
8. `audit-client`

### Tier 1 (Auth) - Week 2
Depends on Tier 0:
- `user-service`
- `auth-service`
- `session-service`
- `token-service`
- `role-service`
- `permission-service`
- `rbac-service`
- `policy-service`

### Tier 2 (Events) - Week 2
Parallel to Tier 1:
- `event-collector`
- `event-parser`
- `event-normalizer`
- `event-enricher`
- `event-transformer`

### Tier 3 (Detection) - Week 3
Depends on Tier 2:
- `rule-engine`
- `ml-detection`
- `anomaly-detector`
- `threat-scorer`
- `detection-service`

### Tier 4 (Response) - Week 3
Depends on Tier 3:
- `alert-service`
- `alert-router`
- `notification-service`
- `escalation-service`
- `investigation-service`
- `timeline-service`
- `graph-service`
- `correlation-service`

### Tier 5 (Cases & Response) - Week 4
Depends on Tier 4:
- `case-service`
- `ticket-service`
- `workflow-service`
- `assignment-service`
- `response-service`
- `remediation-service`
- `containment-service`
- `recovery-service`

### Tier 6 (Output) - Week 4
Depends on all:
- `report-generator`
- `dashboard-service`
- `metric-service`
- `export-service`
- `api-gateway`
- `webhook-service`
- `third-party-connector`
- `external-api-service`

### Frontend (Parallel, Week 2-4)
- All components in Layer 1
- All pages in Layer 2
- All services in Layer 3

### Shared (Week 1)
Can be done in parallel:
- All 12 shared modules

## Module Development Workflow

### Creating a New Module

```bash
# 1. Navigate to module directory
cd src/backend/domain-X/module-name

# 2. Create implementation
cat > src/main.ts << 'EOF'
export class ModuleService {
  // Implementation
}
EOF

# 3. Define types
cat > src/types.ts << 'EOF'
export interface IModule {
  // Interface
}
EOF

# 4. Export API
cat > src/index.ts << 'EOF'
export * from './main';
export * from './types';
EOF

# 5. Create tests
cat > __tests__/unit/module.test.ts << 'EOF'
describe('ModuleService', () => {
  // Tests
});
EOF

# 6. Add documentation
cat > README.md << 'EOF'
# Module Name
Module description and usage.
EOF

# 7. Test coverage
npm run test:unit -- module-name
# Target: 80%+ coverage
```

## Module APIs

Each module exports:
- Main service/component class
- Type definitions (interfaces, types)
- Constants
- Utility functions

Example:
```typescript
// src/index.ts
export { ConfigService } from './main';
export type { IConfig, ConfigOptions } from './types';
export { DEFAULT_CONFIG } from './constants';
```

## Using Modules

Within same backend:
```typescript
import { UserService } from '@backend/domain-2-authentication/user-service';
```

Within same frontend:
```typescript
import { ApiClient } from '@frontend/layer-3-services/api-client';
```

Shared modules:
```typescript
import { validateInput } from '@shared/validation';
```

## Module Testing

Required structure:
```
__tests__/
├── unit/
│   ├── service.test.ts
│   ├── utils.test.ts
│   └── integration.test.ts
└── integration/
    └── module.integration.test.ts
```

Coverage requirement: **80%+ minimum**

Test command:
```bash
npm run test:unit -- module-name
npm run test:integration -- module-name
```

## Module Documentation

Each module requires README.md:
```markdown
# Module Name

## Description
What does this module do?

## Usage
How to use it?

## API
Key functions and classes.

## Testing
Coverage: X%
Tests: Y passing

## Dependencies
What does this depend on?

## Related Modules
What uses this?
```

## Module Status Tracking

Track module progress:
- ✅ Structure created
- ✅ Prototype implemented
- ✅ Unit tests written (80%+)
- ✅ Integration tests written
- ✅ Documentation complete
- ✅ Code reviewed
- ✅ Merged to main

See PROFESSIONAL_STRUCTURE.md for development process.
