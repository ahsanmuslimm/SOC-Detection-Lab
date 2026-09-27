# SOC Detection Lab
## Product Requirements Document (PRD) v1.0

---

## Executive Summary

**SOC Detection Lab** is a production-inspired, self-contained security operations platform designed to demonstrate and operationalize the complete defensive lifecycle. The product enables organizations and security teams to collect telemetry from controlled lab environments, detect suspicious behavior through deterministic and behavioral detection rules, investigate incidents with contextual enrichment, execute controlled response playbooks, and maintain auditable evidence trails.

This PRD outlines what we are building: a reproducible SOC platform that transforms attack activity into detection signals, analyst workflows, response actions, and measurable security outcomes.

---

## 1. Product Vision

### 1.1 Vision Statement
Build a professional SOC platform that ingests security telemetry from controlled lab assets, identifies suspicious behavior using deterministic and behavioral detections, enriches alerts with contextual intelligence, guides analysts through investigation workflows, executes controlled response playbooks, and preserves an auditable evidence trail.

### 1.2 Product Category
- **Primary Category**: Security Operations / Detection Engineering / DFIR Lab Platform
- **Secondary Use Cases**: Threat Hunting, Incident Response, Security Training, Purple-team Validation

### 1.3 Core Value Proposition

| Stakeholder | Value Delivered |
|---|---|
| SOC Analyst | Prioritized alerts, investigation pivots, timelines, evidence trails, guided playbooks |
| Detection Engineer | Rule lifecycle management, test data, ATT&CK mapping, validation and tuning framework |
| Incident Responder | Integrated case management, IOC collection, evidence preservation, containment actions |
| SOC Manager | Coverage metrics, SLA tracking, MTTD/MTTR visibility, alert quality, analyst workload insights |
| Security Engineer | Telemetry health monitoring, integration status, data quality metrics, deployment controls |
| Training/Hiring Teams | Reproducible attack-to-detection scenarios, measurable analyst competency outcomes |

---

## 2. Problem Statement

### 2.1 Core Problems Solved

1. **Fragmented Security Telemetry**: No unified analyst view across collection sources
2. **Alert Overload Without Context**: High-volume alerts lacking severity, context, or ownership assignment
3. **Unvalidated Detection Rules**: Detection rules not mapped to adversary behavior or validated against real events
4. **Slow Incident Reconstruction**: Evidence scattered across logs, making forensic analysis time-intensive
5. **Manual Response with Weak Controls**: Response actions lack approval workflows and audit trails
6. **Unmeasurable Detection Gaps**: No repeatable mechanism to measure what was missed
7. **Weak Training Environments**: Demonstrations of attacks without operational SOC workflows

### 2.2 Business Impact
- Reduce Mean Time To Detect (MTTD)
- Improve detection fidelity and reduce false-positive alert fatigue
- Enable repeatable validation of detection engineering
- Create production-ready framework for SOC platforms
- Support security teams in hiring and training

---

## 3. Product Scope

### 3.1 In Scope
- ✅ Log and telemetry collection from monitored sources
- ✅ Detection rules and behavioral analytics
- ✅ Alert triage and case management workflows
- ✅ Threat hunting and ATT&CK mapping
- ✅ Controlled automated response actions
- ✅ Evidence collection and incident reporting
- ✅ API and integration foundation

### 3.2 Out of Scope
- ❌ Replacing every enterprise SIEM capability in v1
- ❌ Unbounded ML research without operational value
- ❌ Offensive tooling outside isolated lab environments
- ❌ Unauthorized scanning/exploitation of third-party systems
- ❌ Unreviewed destructive remediation actions
- ❌ Guaranteed enterprise HA in single-host MVP
- ❌ Paid cloud dependencies for zero-budget build

---

## 4. Product Goals and Success Metrics

### 4.1 MVP Definition of Done

| Metric | Target | Rationale |
|---|---|---|
| ATT&CK Coverage | ≥8 techniques across ≥4 tactics | Demonstrates breadth across tactic spectrum |
| Detection Coverage | ≥80% of executed techniques generate alert | Validates detection engineering effectiveness |
| Custom Detections | ≥3 documented detections | Proves customization and rule authoring capability |
| Capstone Chain | 1 multi-stage attack with 3-4 techniques | Demonstrates end-to-end visibility |
| Incident Report | SOC-standard report with timeline, IOCs, detections | Validates investigation and reporting capability |
| Reproducibility | Clean deployment from repository | Ensures knowledge transfer and operability |
| Isolation | No lab exposure to real LAN/internet | Enforces safety and compliance |
| Telemetry Gate | Known-good test event before attack | Verifies telemetry pipeline health |

### 4.2 Commercial Product KPIs

| KPI | Definition | Target Direction |
|---|---|---|
| MTTD | Time from source event to actionable alert | Lower (improve) |
| MTTA | Time from alert creation to analyst acknowledgement | Lower (improve) |
| MTTR | Time from confirmed incident to containment | Lower (improve) |
| Detection Coverage | Validated ATT&CK techniques with working detections | Higher (improve) |
| False-Positive Rate | Benign alerts / total alerts | Lower (improve) |
| Alert Fidelity | Actionable alerts / total alerts | Higher (improve) |
| Telemetry Health | Healthy sources / configured sources | Higher (improve) |
| Playbook Success | Successful response runs / attempted runs | Higher (improve) |
| Evidence Completeness | Required case evidence present / required | Higher (improve) |

---

## 5. User Personas and Roles

### 5.1 Primary Personas

**L1 SOC Analyst**
- Monitors alerts, acknowledges incidents, performs triage
- Enriches alerts with context and escalates when needed
- Executes approved low-risk playbooks
- Key Need: Streamlined alert workflow and quick investigative pivots

**L2 SOC Analyst**
- Conducts deep investigation, correlation analysis, threat hunting
- Owns complex cases and approves response actions within scope
- Key Need: Advanced search, pivoting, case ownership controls

**Detection Engineer**
- Builds, tests, and tunes detection rules
- Maps detections to ATT&CK framework
- Manages detection content lifecycle
- Key Need: Rule validation environment, test data, versioning

**Incident Responder**
- Manages cases, collects IOCs, preserves evidence
- Executes containment playbooks
- Key Need: Evidence integrity, case collaboration, audit trails

**Threat Hunter**
- Performs hypothesis-driven hunts
- Analyzes timelines and trends
- Creates new detection candidates
- Key Need: Query power, hunt notebooks, hypothesis tracking

**SOC Manager**
- Views KPIs, queue status, SLAs, quality metrics
- Sets policies and approves high-risk actions
- Key Need: Dashboards, reporting, workload visibility

**Platform Admin**
- Manages users, integrations, infrastructure
- Controls RBAC, connectors, health monitoring
- Key Need: Centralized configuration, audit logs

**Security Auditor**
- Read-only access to cases, evidence, reports
- Verifies compliance and security controls
- Key Need: Complete audit trail, exportable evidence

---

## 6. Product Capabilities

### 6.1 Core Capabilities

| Capability | Scope |
|---|---|
| **Telemetry & Collectors** | Wazuh agents, syslog, web logs, auditd, network/PCAP metadata, extensible to Windows/Sysmon and cloud |
| **Normalization** | Common event schema, UTC timestamps, source identity, parser status, severity, raw-event preservation |
| **Detection Engine** | Wazuh rules, Sigma-compatible content, correlation, thresholds, sequence detections, behavioral analytics |
| **Alert Management** | Deduplication, suppression, grouping, severity, priority, assignment, SLA, lifecycle tracking |
| **Investigation** | Event pivoting, entity context, timeline reconstruction, raw evidence, related alerts, IOC extraction |
| **Threat Hunting** | Search, saved queries, hunt notebooks, ATT&CK hypotheses, retrospective validation |
| **Case Management** | Incident records, tasks, evidence linkage, notes, IOCs, timeline, approvals, closure codes |
| **SOAR Response** | Playbooks, approval gates, action execution, rollback capability, audit trails |
| **Threat Intelligence** | IOC enrichment, reputation scoring, feed ingestion, confidence levels |
| **Asset & Risk** | Asset inventory, criticality, exposure, vulnerability context, risk scoring |
| **Reporting** | Incident reports, executive metrics, coverage reports, audit exports |
| **Administration** | User management, RBAC, integrations, retention policies, health monitoring, backup/restore |

---

## 7. Product Architecture Overview

### 7.1 Deployment Model

**MVP (Weeks 1-4)**: Single-host Docker Compose deployment
- All services (Wazuh Manager, Indexer, Dashboard, DVWA, monitored hosts) run on internal Docker bridge network
- No exposure to real LAN or public internet
- Reproducible from repository with docker-compose.yml

**Professional (Weeks 5-8)**: Production-style analyst console
- Dedicated frontend UI
- API abstraction layer
- Cases, enrichment, threat intelligence, response playbooks
- Advanced observability and monitoring

**Commercial (Phase 7+)**: Enterprise-grade platform
- Multi-tenant controls and isolation
- Scalable collectors and processing
- HA data services (Wazuh, OpenSearch replicas)
- Enterprise identity (OIDC/SAML/LDAP) and SSO
- Kubernetes-ready deployment
- Commercial support and SLAs

### 7.2 Core Components

1. **Data Collection**: Wazuh agents, syslog, web server logs, auditd, network metadata
2. **Ingestion & Normalization**: Log parsing, field extraction, common event schema mapping
3. **Detection & Correlation**: Wazuh rule engine, Sigma-compatible rules, threshold and sequence detections
4. **Alert Management**: Deduplication, suppression, priority scoring, lifecycle management
5. **Investigation Workspace**: Timeline, pivoting, entity context, raw event viewer
6. **Case Management**: Incident tracking, evidence collection, task assignment, closure tracking
7. **Response Automation**: Playbook engine, approval gates, action execution, rollback
8. **Reporting & Analytics**: Coverage dashboards, incident reports, KPI tracking
9. **Administration**: User/role management, system health, configuration management

---

## 8. Feature Requirements

### 8.1 Telemetry Pipeline

The product must implement an end-to-end telemetry pipeline:

1. **Collect**: Acquire events from approved sources (agents, syslog, log files)
2. **Transport**: Securely and reliably send events to ingestion endpoint
3. **Parse**: Identify source type and extract structured fields
4. **Normalize**: Map to platform event schema with common fields
5. **Enrich**: Add asset, user, ATT&CK, IOC, and reputation context
6. **Detect**: Execute atomic, threshold, sequence, and behavioral rules
7. **Correlate**: Group related events into alert/incident hypotheses
8. **Persist**: Store normalized events and raw evidence per retention policy
9. **Present**: Expose to analyst console, API, and reports
10. **Respond**: Optionally trigger approved playbooks

### 8.2 Alert Lifecycle

```
NEW → ACKNOWLEDGED → INVESTIGATING → ESCALATED / CONTAINED → RESOLVED → CLOSED
```

Each state transition must be tracked with timestamp, user, and reason.

### 8.3 Investigation Workspace

An analyst must reach raw evidence within **two interactions** from an alert:

- Alert summary and detection rationale
- Entity panel (source IP, destination, hostname, user, process, asset)
- Event pivots showing all related events
- Timeline with ordered evidence and relative timestamps
- Raw event viewer for original log data
- IOC extraction and enrichment indicators
- Related alerts and previous activity
- ATT&CK technique context
- Analyst notes and evidence attachments
- One-click escalation to case

### 8.4 Case Management

Cases must support:

- Stable incident identifier
- Title, description, severity, status, owner
- Related alerts and linked entities
- Chronological timeline
- IOC collection and tracking
- Evidence with acquisition timestamp and cryptographic hash
- Task tracking and assignment
- Root cause and lessons learned documentation
- Closure code (benign, true positive, duplicate, test, other)

### 8.5 Response Automation (SOAR)

Playbooks must include:

- **Trigger condition** (alert pattern, manual invocation, scheduled)
- **Actions** (collect evidence, block source, isolate target, search IOCs, create detection task)
- **Approval gate** (required, recommended, optional based on policy)
- **Scope validation** (target must be in approved lab/test environment)
- **Dry-run mode** for safe testing
- **Idempotency** to prevent duplicate execution
- **Rollback action** where technically possible
- **Complete audit log** of all actions

### 8.6 Threat Intelligence

IOC lifecycle:
```
Extract → Normalize → Deduplicate → Enrich → Score → Correlate → Hunt → Case Link → Expire/Retire
```

Support IOC types: IPv4, IPv6, domains, URLs, file hashes, emails, processes, users, certificates.

Every IOC must expose source, timestamp, confidence, and freshness.

---

## 9. User Interface Requirements

### 9.1 Executive Dashboard
- Open incidents count
- MTTD/MTTR metrics
- Detection coverage percentage
- Top techniques observed
- Top affected assets
- Telemetry health status
- Response playbook success rate
- Alert volume trend

### 9.2 Analyst Dashboard (L1/L2)
- Priority-sorted alert queue
- Unassigned alerts count
- SLA timers and escalations
- Recent high-confidence detections
- Quick investigation shortcuts
- Current active incidents
- Saved searches and hunts

### 9.3 Detection Engineer Dashboard
- Detection coverage by technique
- Missed-technique queue
- Rule performance metrics (latency, matches)
- False-positive rate tracking
- Rule version history
- Validation status per rule

### 9.4 UX Design Principles
- **Two-click rule**: Raw evidence accessible within two interactions from any alert
- **Show your work**: Every automated action displays the reasoning
- **No black boxes**: Never hide raw events behind opaque AI scores
- **Visible controls**: Critical actions show approval state and reasons
- **Persistent context**: Time, identity, and asset context remain visible during investigation

---

## 10. MITRE ATT&CK Integration

Every detection should map to an ATT&CK technique where applicable.

**Coverage States**:
- **Detected**: Executed behavior generated the expected detection
- **Partially Detected**: Some evidence detected but important context missing
- **Missed**: Behavior executed without actionable detection
- **Not Tested**: No validation evidence exists
- **Retired**: Detection previously existed but no longer supported

The platform supports coverage reporting at tactic, technique, and sub-technique levels.

---

## 11. Data Quality and Integrity

### 11.1 Data Quality Controls

| Control | Requirement |
|---|---|
| Timestamp | Normalize to UTC; retain source timezone where available |
| Raw Evidence | Preserve original event for forensic verification |
| Source Identity | Every event identifies source/agent/collector |
| Parser Status | Malformed events must be measurable and tracked |
| Ingestion Lag | Track event_time → indexed_time latency |
| Duplicate Handling | Event fingerprinting or source identifiers |
| Retention | Policy-driven hot/warm/archive retention |

### 11.2 Evidence Integrity

- Record acquisition timestamp and source
- Compute cryptographic hash for exported evidence
- Preserve original evidence separately from annotations
- Record who accessed, modified, or exported evidence
- Use immutable/audit-protected storage for finalized case packages

---

## 12. API Contract

### 12.1 API Domains

| Endpoint Group | Examples |
|---|---|
| **Auth** | POST /api/v1/auth/login, POST /api/v1/auth/refresh |
| **Alerts** | GET /api/v1/alerts, GET /api/v1/alerts/{id} |
| **Cases** | GET /api/v1/cases, GET /api/v1/cases/{id}/timeline |
| **Events** | POST /api/v1/events/search |
| **Assets** | GET /api/v1/assets, GET /api/v1/assets/{id} |
| **Detections** | GET /api/v1/detections, GET /api/v1/detections/{id}/versions |
| **Hunts** | GET /api/v1/hunts, GET /api/v1/hunts/{id}/results |
| **Playbooks** | GET /api/v1/playbooks, GET /api/v1/playbooks/{id}/runs |
| **Threat Intel** | GET /api/v1/intel/iocs, POST /api/v1/intel/enrich |
| **Reports** | GET /api/v1/reports, GET /api/v1/reports/{id}/export |
| **Health** | GET /api/v1/health, GET /api/v1/metrics |

### 12.2 API Requirements

- Versioned endpoints (v1, v2, etc.)
- Authentication and authorization on every protected route
- Request validation and bounded query ranges
- Pagination for list endpoints
- Consistent error schema with error codes
- Correlation/request ID for tracing
- Audit logging for all mutations
- Rate limiting for exposed interfaces

---

## 13. Success Criteria (Acceptance Checklist)

- ☐ Clean deployment creates all required services and internal networking
- ☐ Lab services are not exposed to real LAN or public internet
- ☐ Known-good authentication failure reaches SIEM before attack testing
- ☐ At least eight ATT&CK techniques executed in controlled scope
- ☐ At least 80% of executed techniques generate actionable alert
- ☐ At least three custom detections authored, tested, and version-controlled
- ☐ Every tested technique has detected/missed evidence recorded
- ☐ Capstone chain reconstructable from telemetry without operator memory
- ☐ Alert escalatable to case with timeline and evidence
- ☐ Approved response playbook executes safe containment action with audit trail
- ☐ Detection gaps generate documented engineering task
- ☐ Third party can reproduce MVP from repository instructions

---

## 14. Product Roadmap

### Phase 0 (Days 1-2): Architecture
- Repository structure and threat model
- Network design and service inventory

### Phase 1 (Week 1): Core Lab
- Wazuh Manager, Indexer, Dashboard deployment
- DVWA and monitored host containers
- Telemetry gate validation
- Lab isolation verification

### Phase 2 (Week 2): Detection Engineering
- 8+ ATT&CK techniques execution
- Custom rule authoring (≥3 rules)
- Detection matrix documentation

### Phase 3 (Week 3): Investigation Capabilities
- Timeline and case management
- Evidence linking
- Threat hunting workflow
- Capstone chain reconstruction

### Phase 4 (Week 4): Response Automation
- Controlled playbooks (brute-force, web attack, quarantine, IOC sweep)
- Approval gates and rollback
- Audit trail recording

### Phase 5-6 (Weeks 5-8): Professional UX
- Dedicated frontend analyst console
- API abstraction layer
- RBAC and dashboards
- Threat intelligence integration

### Phase 7+ (Weeks 9-12): Commercial Hardening
- CI/CD pipelines and security testing
- Observability and monitoring
- Packaging and licensing
- Upgrade and backup procedures

---

## 15. Design Principles

1. **Detection First**: The product measures success by detection and operational evidence, not offensive capability
2. **Lab Isolation**: All offensive activity remains inside explicitly authorized lab/test environments
3. **Reproducibility**: Every important component must be version-controlled and reproducible from repository
4. **Auditability**: Every significant action (detection, investigation, response) must be logged and immutable
5. **Zero-Trust Response**: No automated destructive action without approval, scope validation, and reversal capability
6. **User-Centric**: Analysts and engineers are primary users; UX decisions prioritize their workflows
7. **Security by Default**: Least privilege, no public exposure, default-deny networking, secrets externalized

---

## 16. Constraints and Dependencies

### 16.1 Technical Constraints
- MVP must run on single host with Docker Compose (no cloud dependency)
- Must be reproducible from public repository
- Must not require enterprise licensing to run core functionality
- Must use open-source SIEM core (Wazuh)

### 16.2 External Dependencies
- Docker and Docker Compose
- Wazuh Manager, Indexer, Dashboard (open-source)
- OpenSearch (Wazuh default datastore)
- DVWA for web application telemetry

### 16.3 Team/Skills Required
- Detection engineering expertise (Wazuh, Sigma)
- Incident response and SOC operations
- Full-stack development (backend, frontend, API)
- DevSecOps and container orchestration
- Security architecture and threat modeling

---

## 17. Post-MVP Roadmap

- Windows/Sysmon telemetry support
- OWASP Juice Shop as additional application target
- Zeek and Suricata network telemetry
- IoT-specific protocol and device profiling
- Behavioral anomaly detection
- Automated ATT&CK coverage scoring
- Detection-as-code CI pipeline
- Advanced case collaboration
- Multi-tenant MSSP architecture
- High availability and disaster recovery
- Cloud and Kubernetes telemetry
- Purple-team validation and continuous control testing

---

**Document Version**: 1.0  
**Status**: Target Architecture / Build Specification  
**Last Updated**: 2026-09-27  
**Next Review**: Upon Phase 1 completion
