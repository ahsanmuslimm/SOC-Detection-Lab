# Architecture

## System Overview

SOC Detection Lab is a modular, enterprise-grade security operations platform built on 95 independent services across three layers.

## Backend Architecture (67 services)

### Domain Groups

| Domain | Services | Purpose |
|--------|----------|---------|
| Core Infrastructure | 6 | Config, logging, types, error handling |
| Authentication | 4 | User, auth, session, token management |
| Authorization | 4 | Roles, permissions, RBAC, policies |
| Data Access | 4 | PostgreSQL, OpenSearch, cache, audit |
| Event Pipeline | 5 | Collection, parsing, normalization, enrichment |
| Detection Engine | 5 | Rule-based, ML, anomaly detection |
| Alerts | 4 | Alert service, routing, notifications |
| Investigation | 4 | Investigation, timeline, graphs, correlation |
| Case Management | 4 | Cases, tickets, workflows, assignments |
| Response | 4 | Response, remediation, containment, recovery |
| Reporting | 4 | Reports, dashboards, metrics, exports |
| Integrations | 4 | API gateway, webhooks, third-party connectors |

### Build Order

**Tier 0 (Foundation)**: Core infrastructure, database clients  
**Tier 1 (Auth)**: Authentication and authorization  
**Tier 2 (Events)**: Event pipeline  
**Tier 3 (Detection)**: Detection engine  
**Tier 4 (Response)**: Alerts, investigation, cases  
**Tier 5 (Output)**: Reporting, integrations  

## Frontend Architecture (28 modules)

### Layers

1. **Components** (9): Reusable UI components
2. **Pages** (10): Full page implementations
3. **Services** (9): API clients, state management, utilities

## Shared Services (12 modules)

- Type definitions
- Middleware
- Validation schemas
- Constants, decorators
- Guards, filters, interceptors
- Utilities and helpers

## Technology Stack

**Backend**: Node.js, Express, TypeScript  
**Frontend**: React, TypeScript  
**Database**: PostgreSQL (transactional), OpenSearch (analytics)  
**Cache**: Redis  
**Testing**: Jest  
**Linting**: ESLint + Prettier  

## Development Workflow

1. **Module Development**: Independent, testable modules
2. **Testing**: Unit tests (80%+ coverage) required
3. **Integration**: Tier-by-tier integration
4. **Review**: Code review before merge
5. **Deployment**: Automated CI/CD

## Module Structure

Each module follows this standard structure:

```
module/
  ├── src/
  │   ├── index.ts          # Exports
  │   ├── main.ts           # Implementation
  │   └── types.ts          # TypeScript types
  ├── __tests__/
  │   ├── unit/             # Unit tests
  │   └── integration/      # Integration tests
  └── README.md             # Module docs
```

## Quality Standards

- **TypeScript**: Strict mode, no `any` types
- **Testing**: 80% unit test coverage minimum
- **Linting**: Zero warnings
- **Code style**: Prettier enforced
- **Security**: Input validation, RBAC, encryption

## Deployment

- **Development**: Local Docker Compose
- **Production**: Kubernetes (infra/kubernetes/)
- **IaC**: Terraform (infra/terraform/)

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed setup.
