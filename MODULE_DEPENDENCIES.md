# SOC Detection Lab - Module Dependency Matrix & Build Order

---

## OVERVIEW

**Total Modules**: 95 (67 backend + 28 frontend)  
**Architecture**: Modular, microservice-ready  
**Build Strategy**: Dependency-aware parallel development  

---

## CRITICAL PATH (Build These First)

These modules block other work and must be completed first:

### TIER 0: Infrastructure & Foundations (No dependencies)
1. **Configuration Service** ✓ (shared)
2. **Logging & Monitoring** ✓ (cross-cutting)
3. **Error Handling** ✓ (cross-cutting)
4. **Type Definitions** ✓ (shared)
5. **Database Schema** ✓ (data layer)

### TIER 1: Authentication & Authorization (Depends on Tier 0)
6. **User Service** (needs database)
7. **Role Service** (needs database, user service)
8. **Session Manager** (needs database, user service)
9. **Authorization Service** (needs role service)
10. **Auth Middleware** (needs auth services)

### TIER 2: Core Data Access (Depends on Tier 0-1)
11. **PostgreSQL Client** (needs configuration)
12. **OpenSearch Client** (needs configuration)
13. **Audit Logger** (immutable, needs database)

### TIER 3: Event Pipeline (Depends on Tier 0-2)
14. **Telemetry Collector**
15. **Event Parser**
16. **Event Normalizer**
17. **Data Quality Service**

### TIER 4: Detection Engine (Depends on Tier 0-3)
18. **Rule Engine**
19. **Rule Manager Service**
20. **Correlation Service**
21. **Scoring Service**

### TIER 5: Alert Management (Depends on Tier 0-4)
22. **Alert Lifecycle Service**
23. **Deduplication Service**
24. **Alert Enrichment Service**
25. **SLA Tracking Service**

---

## PARALLEL WORKSTREAMS (Can start after Tier 5)

### WORKSTREAM A: Investigation & Forensics
*(Depends on Alert Management)*
- Timeline Service → Entity Context → Pivoting → Raw Event Viewer
- IOC Extraction → Investigation State Manager

### WORKSTREAM B: Case Management  
*(Depends on Alert Management)*
- Case Service → Timeline Reconstructor → Evidence Collection → Case Closure

### WORKSTREAM C: Response Automation
*(Depends on RBAC + Case Management)*
- Playbook Engine → Playbook Manager → Action Executor → Approval Workflow

### WORKSTREAM D: Threat Intelligence
*(Can start early, independent)*
- IOC Management → Reputation Scoring → Threat Feed Integration

### WORKSTREAM E: Asset Management
*(Depends on Wazuh Integration)*
- Asset Inventory → Agent Status Monitor → Risk Scorer

### WORKSTREAM F: Reporting & Analytics
*(Depends on Alert/Case/Rule Management)*
- Metrics Collector → Report Generator → Dashboard Service

### WORKSTREAM G: Frontend UI
*(Starts after API services, Tier 5+)*
- Design System → Components → Pages → Services

---

## DETAILED DEPENDENCY MATRIX

### BACKEND MODULES

```
GROUP 1: DATA COLLECTION (Week 1)
└─ No external dependencies, only Wazuh Manager

[1] Telemetry Collector Service
    ├─ Depends on: Configuration, Logging
    ├─ Used by: Event Parser
    └─ Blocks: Event normalization pipeline
    
[2] Event Parser & Normalizer
    ├─ Depends on: Telemetry Collector, Data Quality
    ├─ Used by: Correlation Service
    └─ Blocks: Alert generation

[3] Data Quality Service
    ├─ Depends on: Configuration, Logging
    ├─ Used by: Parser, Reporter
    └─ Blocks: Quality metrics


GROUP 2: DETECTION ENGINE (Week 2)
└─ Depends on: Data Collection

[4] Rule Engine (Wazuh-based)
    ├─ Depends on: Wazuh Manager (external)
    ├─ Used by: Rule Manager, Correlation
    └─ Blocks: Alert generation

[5] Rule Manager Service
    ├─ Depends on: Rule Engine, Database, Auth
    ├─ Used by: Coverage Reporter, Rule Testing
    └─ Blocks: Rule deployment

[6] Correlation Service
    ├─ Depends on: Alert Service, OpenSearch
    ├─ Used by: Alert enrichment
    └─ Blocks: Alert prioritization

[7] Scoring Service
    ├─ Depends on: Asset Service (for criticality), IOC Service (optional)
    ├─ Used by: Alert Lifecycle
    └─ Blocks: Alert priority calculation


GROUP 3: ALERT MANAGEMENT (Week 2-3)
└─ Depends on: Detection Engine, RBAC

[8] Alert Lifecycle Service
    ├─ Depends on: Rule Engine, Database, Auth
    ├─ Used by: All alert consumers
    └─ Blocks: Alert triage workflows

[9] Alert Deduplication Service
    ├─ Depends on: OpenSearch, Database
    ├─ Used by: Alert Lifecycle
    └─ Blocks: Duplicate alert prevention

[10] Alert Suppression Service
    ├─ Depends on: Alert Lifecycle, Database
    ├─ Used by: Alert filtering
    └─ Blocks: Suppression rule enforcement

[11] Alert Enrichment Service
    ├─ Depends on: Asset Service, IOC Service, Threat Intel
    ├─ Used by: Scoring Service
    └─ Blocks: Alert context population

[12] Alert API Service
    ├─ Depends on: Alert Lifecycle, Auth, Logging
    ├─ Used by: Frontend, Playbooks, Integrations
    └─ Blocks: External alert access

[13] SLA Tracker Service
    ├─ Depends on: Alert Lifecycle, Database
    ├─ Used by: Reporting, Dashboards
    └─ Blocks: SLA breach tracking


GROUP 4: INVESTIGATION & FORENSICS (Week 3)
└─ Depends on: Alert Management

[14] Event Timeline Service
    ├─ Depends on: OpenSearch, Database
    ├─ Used by: Case Management, Investigation UI
    └─ Blocks: Timeline reconstruction

[15] Entity Context Service
    ├─ Depends on: Asset Service, User DB, OpenSearch
    ├─ Used by: Investigation Workspace
    └─ Blocks: Entity enrichment

[16] Pivoting Service
    ├─ Depends on: Timeline Service, OpenSearch
    ├─ Used by: Investigation UI
    └─ Blocks: Cross-entity correlation

[17] Raw Event Viewer Service
    ├─ Depends on: OpenSearch, Wazuh Indexer
    ├─ Used by: Investigation UI
    └─ Blocks: Raw log access

[18] IOC Extraction Service
    ├─ Depends on: IOC Management Service
    ├─ Used by: Investigation UI, Case Management
    └─ Blocks: IOC identification


GROUP 5: CASE MANAGEMENT (Week 3)
└─ Depends on: Alert Management, Investigation Services

[19] Case Service
    ├─ Depends on: Alert Service, Database, Auth
    ├─ Used by: All case consumers
    └─ Blocks: Case creation/management

[20] Case Timeline Service
    ├─ Depends on: Timeline Service, Case Service
    ├─ Used by: Case Detail UI
    └─ Blocks: Case timeline reconstruction

[21] Evidence Collection Service
    ├─ Depends on: Case Service, File Storage, Cryptography
    ├─ Used by: Case Management, Forensics
    └─ Blocks: Evidence uploads

[22] Evidence Access Logger
    ├─ Depends on: Evidence Collection, Audit Logger
    ├─ Used by: Compliance, Audit
    └─ Blocks: Chain of custody

[23] Case Tasks Service
    ├─ Depends on: Case Service, Database
    ├─ Used by: Case Management, Notifications
    └─ Blocks: Task tracking

[24] Case Closure Service
    ├─ Depends on: Case Service, Database
    ├─ Used by: Case Management, Reporting
    └─ Blocks: Case archival


GROUP 6: THREAT INTELLIGENCE (Week 3-4, can start early)
└─ Mostly independent, enhances other services

[25] IOC Management Service
    ├─ Depends on: Database, IOC types
    ├─ Used by: IOC Extraction, Enrichment, Hunt
    └─ Blocks: IOC tracking

[26] IOC Deduplication Service
    ├─ Depends on: IOC Management
    ├─ Used by: IOC Management
    └─ Blocks: Duplicate IOC prevention

[27] IOC Correlation Service
    ├─ Depends on: IOC Management, OpenSearch
    ├─ Used by: IOC hunting, Analysis
    └─ Blocks: IOC relationship tracking

[28] Reputation Scoring Service
    ├─ Depends on: External APIs (optional), Database
    ├─ Used by: IOC Management, Alert Enrichment
    └─ Blocks: IOC threat scoring

[29] IOC Search Service
    ├─ Depends on: IOC Management, OpenSearch
    ├─ Used by: Investigation UI, Hunts
    └─ Blocks: IOC search capability

[30] Threat Feed Integration Service
    ├─ Depends on: IOC Management, External feeds
    ├─ Used by: IOC Management
    └─ Blocks: Threat feed ingestion

[31] IOC Lifecycle Manager
    ├─ Depends on: IOC Management, Database
    ├─ Used by: IOC Management
    └─ Blocks: IOC expiration/retirement


GROUP 7: RESPONSE AUTOMATION (Week 4)
└─ Depends on: Case Management, RBAC, Audit

[32] Playbook Engine
    ├─ Depends on: Approval Workflow, Scope Validator, Action Executor
    ├─ Used by: Alert/Case workflows
    └─ Blocks: Playbook execution

[33] Playbook Manager Service
    ├─ Depends on: Database, Auth
    ├─ Used by: Playbook Engine
    └─ Blocks: Playbook CRUD

[34] Action Executor Service
    ├─ Depends on: Lab infrastructure, Configuration
    ├─ Used by: Playbook Engine
    └─ Blocks: Action execution

[35] Approval Workflow Service
    ├─ Depends on: RBAC, Notification Service, Database
    ├─ Used by: Playbook Engine
    └─ Blocks: High-risk action approvals

[36] Scope Validator Service
    ├─ Depends on: Asset Service, Configuration
    ├─ Used by: Playbook Engine
    └─ Blocks: Scope enforcement

[37] Dry-Run Service
    ├─ Depends on: Playbook Engine, Action Executor
    ├─ Used by: Testing workflows
    └─ Blocks: Safe testing

[38] Rollback Manager
    ├─ Depends on: Action Executor, Audit Logger
    ├─ Used by: Playbook Engine
    └─ Blocks: Action reversal


GROUP 8: ASSET MANAGEMENT (Week 3-4)
└─ Depends on: Database, Wazuh Integration

[39] Asset Inventory Service
    ├─ Depends on: Database, Configuration
    ├─ Used by: Enrichment, Risk Scorer, Dashboards
    └─ Blocks: Asset tracking

[40] Agent Status Monitor
    ├─ Depends on: Wazuh Manager, Database
    ├─ Used by: Health monitoring, Dashboards
    └─ Blocks: Agent status tracking

[41] Telemetry Source Tracker
    ├─ Depends on: Asset Service, Database
    ├─ Used by: Data quality, Coverage
    └─ Blocks: Source tracking

[42] Asset Risk Scorer
    ├─ Depends on: Asset Service, Vulnerability DB (optional)
    ├─ Used by: Scoring Service, Risk reporting
    └─ Blocks: Risk calculation

[43] Asset Activity Logger
    ├─ Depends on: Asset Service, Audit Logger
    ├─ Used by: Reporting, Analysis
    └─ Blocks: Activity tracking

[44] Criticality Manager
    ├─ Depends on: Asset Service, Database
    ├─ Used by: Scoring Service
    └─ Blocks: Criticality assignment


GROUP 9: RBAC & AUTHENTICATION (Build first - TIER 1)
└─ Depends on: Database, Logging

[45] User Service
    ├─ Depends on: Database, Password hashing
    ├─ Used by: All authenticated operations
    └─ Blocks: User management

[46] Role Service
    ├─ Depends on: Database, User Service
    ├─ Used by: Authorization Service
    └─ Blocks: Permission management

[47] Session Manager
    ├─ Depends on: Database (or Redis), JWT library
    ├─ Used by: All authenticated requests
    └─ Blocks: Session tracking

[48] Authorization Service
    ├─ Depends on: Role Service, Session Manager
    ├─ Used by: All API endpoints
    └─ Blocks: Permission enforcement

[49] MFA Service
    ├─ Depends on: User Service, Database
    ├─ Used by: Authentication
    └─ Blocks: MFA enforcement

[50] Password Manager
    ├─ Depends on: User Service, Password hashing
    ├─ Used by: User Service
    └─ Blocks: Password management

[51] Auth Logger
    ├─ Depends on: Audit Logger
    ├─ Used by: Authentication flows
    └─ Blocks: Auth auditing


GROUP 10: REPORTING & ANALYTICS (Week 4+)
└─ Depends on: Alert/Case/Rule services, Database

[52] Report Generator
    ├─ Depends on: Report Templates, Case Service
    ├─ Used by: Report export
    └─ Blocks: Report generation

[53] Report Templates
    ├─ Depends on: Database, Configuration
    ├─ Used by: Report Generator
    └─ Blocks: Template management

[54] Metrics Collector
    ├─ Depends on: Alert Service, Case Service, Rule Service
    ├─ Used by: Dashboards, Reporting
    └─ Blocks: KPI calculation

[55] Dashboard Service
    ├─ Depends on: Metrics Collector, Alert/Case services
    ├─ Used by: Frontend Dashboards
    └─ Blocks: Dashboard data

[56] Coverage Reporter
    ├─ Depends on: Rule Manager, Attack data
    ├─ Used by: Coverage Matrix reporting
    └─ Blocks: Coverage reporting

[57] Performance Analytics
    ├─ Depends on: Rule/Alert/Response metrics
    ├─ Used by: Performance reporting
    └─ Blocks: Performance analysis

[58] Export Service
    ├─ Depends on: Report Generator, Data services
    ├─ Used by: CSV/JSON/PDF exports
    └─ Blocks: Export functionality


GROUP 11: AUDIT & COMPLIANCE (Build early - TIER 2)
└─ Depends on: Database, Logging

[59] Immutable Audit Logger
    ├─ Depends on: Database (append-only table)
    ├─ Used by: All mutation operations
    └─ Blocks: Audit trail

[60] Audit Query Service
    ├─ Depends on: Audit Logger
    ├─ Used by: Compliance, Investigation
    └─ Blocks: Audit log search

[61] Audit Export Service
    ├─ Depends on: Audit Logger
    ├─ Used by: Compliance exports
    └─ Blocks: Audit export

[62] Retention Policy Engine
    ├─ Depends on: Configuration, Database
    ├─ Used by: Data lifecycle
    └─ Blocks: Data retention

[63] Archive Service
    ├─ Depends on: File storage, Configuration
    ├─ Used by: Data archival
    └─ Blocks: Data archiving


GROUP 12: THREAT HUNTING (Week 3+)
└─ Depends on: Investigation services, OpenSearch

[64] Hunt Query Builder
    ├─ Depends on: OpenSearch, Investigation services
    ├─ Used by: Hunt interface
    └─ Blocks: Hunt query support

[65] Hunt Execution Service
    ├─ Depends on: OpenSearch, Hunt builder
    ├─ Used by: Hunt workflows
    └─ Blocks: Hunt execution

[66] Hunt Results Analytics
    ├─ Depends on: Hunt service, Timeline service
    ├─ Used by: Hunt UI, Detection candidate creation
    └─ Blocks: Results analysis

[67] Detection Gap Tracker
    ├─ Depends on: Hunt service, Rule Manager
    ├─ Used by: Detection engineering
    └─ Blocks: Gap identification
```

---

## FRONTEND MODULES

All frontend modules depend on:
- ✓ Backend API services (Tier 5+)
- ✓ Authentication (Tier 1)
- ✓ State management framework
- ✓ Design system / component library

### PARALLEL FRONTEND DEVELOPMENT

**Phase 1: Design System + Components (Can start in Week 2)**
- Design tokens, colors, typography, spacing
- Reusable components (buttons, cards, panels, etc.)

**Phase 2: Core Pages (Week 3, after APIs stabilize)**
- L1 Analyst Dashboard
- Alert Investigation Page
- Case Detail Page

**Phase 3: Advanced Features (Week 4+)**
- Threat Hunt Page
- Rule Editor Page
- Playbook Library Page
- Dashboards (Executive, Detection Engineer, etc.)

### Frontend Component Dependencies

```
[Component Library] ← Design System
└─ All pages depend on components

[Navigation Service] ← Design System, Auth
└─ Used by all pages

[State Management] ← Redux/Vuex store
└─ Shared by all pages

[Search Service] ← Global search
└─ Used by Dashboard, all investigation pages

[Real-time Service] ← WebSocket
└─ Used by Dashboard, Alert Queue

[L1 Dashboard] ← Search, State, Real-time
L2 Dashboard] ← Search, State, Cases API
[Investigation Page] ← Timeline component, Entity context, Raw event viewer
[Case Page] ← Case API, Evidence component, Timeline
[Hunt Page] ← Hunt API, Timeline component, Results visualization
[Rule Editor] ← Rule API, Test component
[Playbook] ← Playbook API, Approval component
[RBAC Admin] ← User API, Role API
[Audit Viewer] ← Audit API, Search
```

---

## BUILD ORDER RECOMMENDATION

### WEEK 1 (Foundation + Data Collection)
**Frontend-independent work**

**Day 1**: Tier 0 Infrastructure
- [ ] Configuration Service
- [ ] Logging & Monitoring
- [ ] Error Handling
- [ ] Type Definitions
- [ ] Database Schema

**Day 2**: Tier 1 RBAC (blocks everything)
- [ ] User Service
- [ ] Role Service
- [ ] Session Manager
- [ ] Authorization Service
- [ ] Auth Middleware

**Day 3**: Tier 2 Data Access
- [ ] PostgreSQL Client
- [ ] OpenSearch Client
- [ ] Audit Logger

**Day 4**: Tier 3 Event Pipeline
- [ ] Telemetry Collector
- [ ] Event Parser
- [ ] Event Normalizer
- [ ] Data Quality Service

### WEEK 2 (Detection Engine) - PARALLEL

**Backend Track:**
- [ ] Rule Engine (integrate Wazuh)
- [ ] Rule Manager Service
- [ ] Correlation Service
- [ ] Scoring Service
- [ ] Alert Lifecycle Service
- [ ] Alert API Service

**Frontend Track (can start):**
- [ ] Design System
- [ ] Component Library
- [ ] Navigation Service
- [ ] Start L1 Dashboard prototype

### WEEK 3 (Investigation & Cases) - PARALLEL

**Backend Track:**
- [ ] Deduplication Service
- [ ] Enrichment Service
- [ ] SLA Tracker
- [ ] Timeline Service
- [ ] Entity Context Service
- [ ] IOC Extraction Service
- [ ] Case Service
- [ ] Case Timeline Service
- [ ] Evidence Collection Service

**Frontend Track:**
- [ ] Investigation Workspace UI
- [ ] Case Detail Page
- [ ] Complete L1 Dashboard
- [ ] Start L2 Dashboard

**Parallel (Independent):**
- [ ] IOC Management Service (all IOC group)
- [ ] Asset Inventory Service (all Asset group)
- [ ] Threat Feed Integration

### WEEK 4 (Response + Final MVP Components) - PARALLEL

**Backend Track:**
- [ ] Playbook Engine
- [ ] Playbook Manager
- [ ] Action Executor
- [ ] Approval Workflow
- [ ] Scope Validator
- [ ] Dry-Run & Rollback
- [ ] Evidence Access Logger
- [ ] Case Tasks & Closure
- [ ] Metrics Collector
- [ ] Report Generator
- [ ] Dashboard Service

**Frontend Track:**
- [ ] Playbook Library UI
- [ ] Approval Dialog
- [ ] Executive Dashboard
- [ ] Alert acknowledgement workflow
- [ ] Case escalation workflow

**Testing:**
- [ ] Integration tests: Alert → Case → Playbook
- [ ] Scenario test: SSH brute force detection
- [ ] Docker Compose assembly

---

## DEPENDENCY VISUALIZATION

```
┌─────────────────────────────────────────────────────────┐
│  TIER 0: FOUNDATION (Logging, Config, Types, DB)      │
└──────────────────┬──────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
┌──────────────────┐ ┌──────────────────────┐
│ TIER 1: RBAC     │ │ TIER 2: Data Access  │
│ (Auth + Authz)   │ │ (PG, OS, Audit)      │
└────┬─────────────┘ └──────────┬───────────┘
     │                          │
     ├──────────────┬───────────┤
     ↓              ↓           ↓
┌────────────┐ ┌─────────────────────┐
│ TIER 3:    │ │ TIER 2-PARALLEL:    │
│ Event      │ │ - Asset Inventory   │
│ Pipeline   │ │ - IOC Management    │
└──┬──────────┘ │ - Threat Intel      │
   │            └─────────────────────┘
   ↓
┌──────────────┐
│ TIER 4:      │
│ Detection    │
└──┬───────────┘
   ↓
┌──────────────┐
│ TIER 5:      │
│ Alert Mgmt   │
└──┬───────────┘
   │
   ├─────────┬─────────┬──────────┐
   ↓         ↓         ↓          ↓
┌─────────┐┌──────┐┌────────┐┌────────┐
│Investig.││Cases ││Response││Reports │
│& Hunts  ││      ││Automat.││Analytic│
└─────────┘└──────┘└────────┘└────────┘
   │         │         │          │
   └─────────┴─────────┴──────────┘
            ↓
      ┌───────────────┐
      │ FRONTEND TIER │ (depends on above)
      │ - Pages       │
      │ - Components  │
      │ - Services    │
      └───────────────┘
```

---

## CRITICAL SUCCESS FACTORS

1. **Tier 0 must be 100% complete before moving to Tier 1**
   - All modules depend on these

2. **RBAC (Tier 1) is the absolute blocker**
   - Every API needs authentication
   - No excuses for skipping

3. **Parallel workstreams accelerate Week 3-4**
   - Investigation, Cases, Response, Threat Intel can proceed independently after Tier 5

4. **Frontend can start in Week 2** once API contracts are defined
   - Use mock APIs during Week 2-3

5. **Integration testing critical path**
   - Alert → Enrichment → Case → Playbook
   - Test this first in Week 4

---

## UNBLOCKING STRATEGIES

If a module is blocked:

1. **Mock the dependency** - Create a stub that returns expected data
2. **Async integration** - Integrate later, continue development
3. **Contract-first design** - Define API contract first, implement later
4. **Parallel sub-teams** - One team builds service, another builds consumer with mocks

Example: Frontend can build Investigation Page using mock API before Timeline Service is complete.

---

**Last Updated**: 2026-09-27  
**Version**: 1.0  
**Status**: Ready for execution
