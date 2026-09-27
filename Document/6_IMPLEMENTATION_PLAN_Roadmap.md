# SOC Detection Lab
## Implementation Plan & Roadmap v1.0

---

## Executive Summary

This document outlines the complete implementation strategy, phased delivery roadmap, sprint structure, success criteria, and post-MVP evolution for SOC Detection Lab. It aligns business goals with engineering capacity and provides clear milestones for both MVP and commercial product phases.

---

## 1. Overall Strategy

### 1.1 Guiding Principles

1. **MVP First**: Deliver core value quickly with Docker Compose in 4 weeks
2. **Production-Ready Foundation**: Even MVP components follow quality standards
3. **Incremental Enhancement**: Each phase adds capability without redesigning
4. **Open Source Foundation**: Leverage Wazuh and open standards; minimize proprietary code
5. **Demo-Driven**: Build features that are demo-able and immediately valuable
6. **Detection-Centric**: Focus on measurable security outcomes, not offensive capability

### 1.2 Delivery Model

- **MVP Phase (Weeks 1-4)**: Docker Compose lab with basic investigation capabilities
- **Professional Phase (Weeks 5-8)**: Production analyst console and advanced workflows
- **Commercial Phase (Weeks 9-12+)**: Enterprise features, scalability, and commercial support

---

## 2. Phase 0: Architecture & Planning (Days 1-2)

### 2.1 Objectives
- Finalize threat model and security requirements
- Design network and container architecture
- Set up repository structure and CI/CD framework
- Procure tools and licenses
- Establish development environment

### 2.2 Deliverables

| Item | Owner | Duration | Status |
|---|---|---|---|
| Architecture diagram | Architect | 4 hours | - |
| Threat model document | Security Eng | 4 hours | - |
| Network topology (Docker Compose) | Architect | 4 hours | - |
| Repository structure scaffold | Tech Lead | 3 hours | - |
| Development environment setup guide | DevOps | 3 hours | - |
| CI/CD pipeline skeleton | DevOps | 4 hours | - |
| Tool licenses and access provisioning | PM | 8 hours | - |

### 2.3 Success Criteria
- ✓ Diagram shows all services, data flows, and isolation boundaries
- ✓ Threat model identifies and mitigates critical risks
- ✓ All team members have functional development environment
- ✓ Repository is structured, gitignore in place, CI/CD running

### 2.4 Team Composition
- 1 Solutions Architect (0.5 FTE)
- 1 DevOps Engineer (1 FTE)
- 1 Backend Engineer (0.5 FTE)
- 1 Security Engineer (0.5 FTE)

---

## 3. Phase 1: Core Lab Foundation (Week 1)

### 3.1 Objectives
- Deploy functional Wazuh SIEM with ingestion pipeline
- Create monitored lab targets (DVWA, monitored Linux host)
- Establish telemetry gate validation
- Verify lab isolation and network security

### 3.2 Detailed Sprint Tasks

#### 3.2.1 Wazuh Infrastructure (Days 1-2)

```
TASK: Set up Wazuh Manager, Indexer, and Dashboard

Docker Services:
├─ wazuh-manager:latest
│  ├─ Port 1514/UDP (agent communication)
│  ├─ Port 1515/TCP (agent registration)
│  ├─ Port 514/UDP (syslog ingestion)
│  ├─ Volume: /var/ossec (persistent)
│  └─ Internal network only
│
├─ wazuh-indexer:latest (OpenSearch-based)
│  ├─ Port 9200 (REST API, internal only)
│  ├─ Port 9300 (node communication)
│  ├─ Volume: /var/lib/wazuh-indexer/data (persistent)
│  └─ Initial cluster setup
│
└─ wazuh-dashboard:latest
   ├─ Port 5601 (localhost only, dev access)
   ├─ Volume: /usr/share/wazuh-dashboard/certs
   └─ Pre-configured user (admin:admin)

Deliverables:
✓ docker-compose.yml with all three services
✓ Network bridge configuration (isolated)
✓ Volume mounts for data persistence
✓ Environment variables in .env.example
✓ Startup script: scripts/start-wazuh.sh
✓ Health check: scripts/check-health.sh
✓ Cleanup script: scripts/cleanup.sh
```

**Success Criteria**:
- `docker-compose up -d` starts all services without errors
- Wazuh Dashboard accessible at `http://localhost:5601` (dev only)
- Manager accepts syslog connections on port 514/UDP
- Indexer indexes events successfully

#### 3.2.2 Lab Targets Setup (Days 2-3)

```
TASK: Create DVWA and monitored Linux host containers

Docker Services:
├─ dvwa:latest
│  ├─ Apache + PHP
│  ├─ MySQL database (auto-created)
│  ├─ Port 80 (internal only, no external exposure)
│  ├─ Pre-configured vulnerable scenarios
│  └─ Volume: /app (logs)
│
└─ monitored-host:ubuntu
   ├─ Ubuntu 22.04 LTS
   ├─ Wazuh agent (auto-installed)
   ├─ auditd enabled
   ├─ syslog forwarding configured
   ├─ Pre-seeded with test data
   └─ Volume: /var/log (persistent logs)

Deliverables:
✓ Dockerfile for monitored-host with auditd
✓ docker-compose.yml entries for both targets
✓ Pre-configuration scripts for agent enrollment
✓ Test data generation script
✓ Documentation: docs/lab-targets.md
```

**Success Criteria**:
- DVWA container starts and MySQL initializes
- Monitored-host container connects Wazuh agent to manager
- Agent shows as "connected" in Wazuh dashboard
- Both containers isolated from external network

#### 3.2.3 Telemetry Gate Validation (Days 3-4)

```
TASK: Create known-good test event before attack scenarios

Process:
1. Generate test authentication event
   └─ Valid user login from known source
   
2. Verify ingestion pipeline
   └─ Event reaches Wazuh manager
   └─ Parsed correctly
   └─ Indexed in OpenSearch
   
3. Confirm dashboard visibility
   └─ Event appears in Wazuh Dashboard
   └─ Fields extracted correctly
   └─ Timestamp normalized
   
4. Create gate validation script
   └─ Automated check runs at startup
   └─ Fails startup if gate test fails
   └─ Operator sees clear error message

Deliverables:
✓ scripts/telemetry-gate.sh
✓ Test event fixture: test_data/gate_test_event.log
✓ Gate validation in docker-compose health checks
✓ Documentation: docs/telemetry-pipeline.md

Success Criteria:
✓ Test event generates same checksum every run
✓ Pipeline latency measured (target: <5 seconds)
✓ No events lost or corrupted
✓ Operator can run gate test manually anytime
```

#### 3.2.4 Network Isolation Verification (Day 4)

```
TASK: Verify lab is not exposed to real network

Tests:
1. No services listen on public interfaces
   └─ netstat/ss shows only localhost or docker0
   
2. Docker network is isolated
   └─ iptables rules block external access
   └─ Firewall policies configured
   
3. No real LAN traffic captured
   └─ PCAP shows only internal traffic
   
4. Security checklist
   └─ No credentials in logs
   └─ No PII data
   └─ All connections encrypted where applicable

Deliverables:
✓ scripts/verify-isolation.sh
✓ Firewall rules documentation
✓ Network topology diagram (ASCII or image)
✓ Security isolation checklist (docs/security-isolation.md)

Success Criteria:
✓ Isolation script passes all checks
✓ External scanning tool cannot reach lab services
✓ Team approves network design
```

### 3.3 Phase 1 Success Metrics

| Metric | Target |
|---|---|
| Wazuh manager uptime | 100% |
| Event ingestion success rate | 99%+ |
| Dashboard responsiveness | <2s page load |
| Telemetry pipeline latency | <5 seconds |
| Container health check pass rate | 100% |
| Isolation verification pass rate | 100% |

### 3.4 Phase 1 Testing

```
Unit Tests:
├─ Wazuh agent enrollment script
├─ Telemetry gate validation
└─ Network connectivity

Integration Tests:
├─ End-to-end event flow (source → indexer → dashboard)
├─ Agent reconnection behavior
└─ Service health checks

Manual Testing:
├─ Visual dashboard inspection
├─ Manual test event injection
└─ Isolation verification
```

### 3.5 Phase 1 Deliverables

```
├─ docker-compose.yml (all services)
├─ .env.example (configuration template)
├─ scripts/
│  ├─ start-wazuh.sh
│  ├─ check-health.sh
│  ├─ telemetry-gate.sh
│  ├─ verify-isolation.sh
│  └─ cleanup.sh
├─ docs/
│  ├─ lab-targets.md
│  ├─ telemetry-pipeline.md
│  ├─ network-architecture.md
│  └─ security-isolation.md
├─ test_data/
│  └─ gate_test_event.log
└─ README.md (updated with Phase 1)
```

---

## 4. Phase 2: Detection Engineering (Week 2)

### 4.1 Objectives
- Execute 8+ ATT&CK techniques in controlled environments
- Author 3+ custom detection rules
- Create detection validation matrix
- Demonstrate 80%+ detection coverage

### 4.2 Detailed Sprint Tasks

#### 4.2.1 ATT&CK Technique Implementation (Days 1-2)

```
TASK: Execute 8+ techniques across multiple tactics

Reconnaissance:
├─ T1046: Network Service Scanning
│  └─ Tool: nmap, trigger from monitored-host
│  └─ Evidence: Network traffic logs
│  
├─ T1592.001: Gather Victim Host Information
│  └─ Tool: Information gathering scripts
│  └─ Evidence: Web server access logs
│
└─ T1597: Search Repositories
   └─ Tool: Automated search script
   └─ Evidence: Application logs

Initial Access:
├─ T1190: Exploit Public-Facing Application
│  └─ Tool: SQLi payload against DVWA
│  └─ Evidence: DVWA access logs, HTTP payloads
│
└─ T1200: Hardware Additions
   └─ Simulated: Log injection + mock evidence

Credential Access:
├─ T1110.001: Brute Force SSH
│  └─ Tool: Hydra or custom script
│  └─ Evidence: Authentication logs (repeated failures)
│
├─ T1110.003: Credential Stuffing
│  └─ Tool: Custom script with wordlist
│  └─ Evidence: auth logs with various usernames
│
└─ T1056.001: Input Capture (Keylogging)
   └─ Simulated: Log injection with detected patterns

Execution:
└─ T1059.006: Python Execution
   └─ Tool: Payload execution from DVWA
   └─ Evidence: Process execution logs, auditd

Deliverables:
✓ scenarios/ directory structure
✓ scenarios/{technique_id}/ directories with:
  ├─ README.md (technique description, ATT&CK mapping)
  ├─ exploit.sh (execution script)
  ├─ expected_events.txt (known good output)
  └─ evidence/ (captures, screenshots)
✓ Technique-to-evidence mapping document
✓ Scenario validation checklist

Success Criteria:
✓ All 8+ techniques execute repeatably
✓ All techniques produce expected telemetry
✓ Evidence captured for each technique
```

#### 4.2.2 Custom Detection Rule Authoring (Days 2-3)

```
TASK: Author 3+ custom Wazuh/Sigma rules

Rule 1: SSH Brute Force (Threshold Detection)
├─ Rule ID: 5002 (custom)
├─ Description: Multiple failed SSH attempts from single source
├─ Technique: T1110.001
├─ Threshold: 5 failures in 300 seconds
├─ Expected Fields: failed_login, source_ip
├─ Test Events: 5 repeated failed login attempts
├─ False Positives: Account lockouts, typos
├─ Status: PRODUCTION

Rule 2: SQLi Detection (Atomic Detection)
├─ Rule ID: 5003
├─ Description: SQL injection payload in HTTP request
├─ Technique: T1190
├─ Pattern: Regex matching common SQLi payloads
├─ Expected Fields: http_request, payload
├─ Test Events: DVWA SQLi access logs
├─ False Positives: Legitimate parameterized queries
├─ Status: PRODUCTION

Rule 3: Privilege Escalation Attempt (Sequence Detection)
├─ Rule ID: 5004
├─ Description: Failed login followed by successful login from same source
├─ Technique: T1134 (Access Token Manipulation)
├─ Sequence: failed_login → successful_login (within 60s)
├─ Expected Fields: source_ip, username
├─ Test Events: 3 failed attempts + 1 successful from same source
├─ False Positives: Legitimate password retry
├─ Status: PRODUCTION

Deliverables:
✓ detections/wazuh/custom_rules.xml (or detections/sigma/ for Sigma format)
✓ detections/tests/ directory with unit test fixtures
✓ docs/detection-engineering/rule-authoring-guide.md
✓ detections/validation-matrix.md

Success Criteria:
✓ All 3+ rules written and validated
✓ Unit tests pass for all rules (positive and negative)
✓ False positive rate acceptable (<5% in 24h test)
✓ Rules deployed to Wazuh manager
```

#### 4.2.3 Detection Validation Matrix (Days 3-4)

```
TASK: Create ATT&CK-to-Detection mapping

Matrix Format:
┌─────────────────────────────────────────────┐
│ TECHNIQUE | TACTIC | DETECTED | STATUS      │
├─────────────────────────────────────────────┤
│ T1046     | Recon  | ✓        | VALIDATED   │
│ T1592.001 | Recon  | ✓        | VALIDATED   │
│ T1597     | Recon  | ○        | MISSED      │
│ T1190     | Initial| ✓        | VALIDATED   │
│ T1110.001 | Cred   | ✓        | VALIDATED   │
│ T1110.003 | Cred   | ✓        | VALIDATED   │
│ T1056.001 | Cred   | ○        | PARTIALLY   │
│ T1059.006 | Exec   | ✓        | VALIDATED   │
└─────────────────────────────────────────────┘

Deliverables:
✓ detections/coverage-matrix.md (ATT&CK table)
✓ detections/coverage-matrix.json (machine-readable)
✓ Coverage report: 8 techniques, 7 detected (87.5%)
✓ docs/detection-validation.md

Success Criteria:
✓ Matrix shows at least 8 techniques
✓ At least 80% (6/8) are DETECTED or VALIDATED
✓ Each row has evidence reference
✓ Missed/partial detections have notes for future work
```

### 4.3 Phase 2 Testing

```
Rule Unit Tests:
├─ Each rule tested against positive and negative cases
├─ False positive scenarios validated
└─ Performance validated (latency <100ms per rule)

Scenario Tests:
├─ Each technique scenario executes repeatably
├─ Expected evidence appears in SIEM
└─ Alert generated within SLA (<60s)

Coverage Tests:
├─ All 8+ techniques tested
├─ Coverage matrix populated
└─ Gaps identified and documented
```

### 4.4 Phase 2 Success Metrics

| Metric | Target |
|---|---|
| Techniques executed | ≥8 |
| Detection coverage | ≥80% |
| Custom rules authored | ≥3 |
| Rule test pass rate | 100% |
| Alert generation latency | <60s |

---

## 5. Phase 3: Investigation & Triage (Week 3)

### 5.1 Objectives
- Build investigation workspace UI
- Implement case management and evidence collection
- Create threat hunting interface
- Enable analyst workflows

### 5.2 Detailed Sprint Tasks

#### 5.2.1 Investigation Workspace (Days 1-2)

```
TASK: Build basic investigation interface

UI Components:
├─ Alert Detail View
│  ├─ Alert summary (rule, severity, confidence)
│  ├─ Entity context panel (IP, hostname, user)
│  ├─ Timeline of related events
│  └─ Action buttons (acknowledge, investigate, escalate)
│
├─ Investigation Panel
│  ├─ Tabbed interface (Summary, Timeline, Entities, IOC)
│  ├─ Timeline visualization with events
│  ├─ Raw event viewer (JSON/text)
│  └─ IOC extraction preview
│
└─ Search Interface
   ├─ Query builder or free-form search
   ├─ Filters (severity, date range, rule, asset)
   └─ Results list with inline actions

Backend API:
├─ GET /api/v1/alerts/{alert_id}
├─ GET /api/v1/alerts/{alert_id}/timeline
├─ GET /api/v1/events/search
├─ POST /api/v1/alerts/{alert_id}/acknowledge
└─ POST /api/v1/alerts/{alert_id}/escalate

Deliverables:
✓ Frontend: UI components (React/Vue)
✓ Backend: API endpoints (Node.js/FastAPI)
✓ Database: Alert tables and indexes
✓ docs/investigation-workspace.md

Success Criteria:
✓ Alert detail loads in <2 seconds
✓ Timeline shows all related events
✓ Raw event viewer displays correctly parsed JSON
✓ Search returns results in <5 seconds
```

#### 5.2.2 Case Management (Days 2-3)

```
TASK: Implement case creation and tracking

Features:
├─ Create Case (from alert or manual)
│  ├─ Auto-populate title, description
│  ├─ Link related alerts
│  ├─ Initialize timeline from alerts
│  └─ Assign owner/analyst
│
├─ Case Detail View
│  ├─ Case metadata (title, severity, status, owner)
│  ├─ Timeline tab (chronological event sequence)
│  ├─ Entities tab (assets, users, IPs, processes)
│  ├─ Evidence tab (uploaded files with metadata)
│  ├─ IOCs tab (indicators extracted and tracked)
│  ├─ Tasks tab (investigation and remediation tasks)
│  └─ Notes tab (analyst free-form notes)
│
└─ Case Lifecycle
   ├─ Status transitions: OPEN → INVESTIGATING → CONTAINED → CLOSED
   ├─ Close case with closure code (TRUE_POSITIVE, BENIGN, DUPLICATE)
   └─ Archive closed cases

Backend:
├─ POST /api/v1/cases
├─ GET /api/v1/cases/{case_id}
├─ PUT /api/v1/cases/{case_id}
├─ POST /api/v1/cases/{case_id}/evidence (upload evidence)
├─ POST /api/v1/cases/{case_id}/timeline
├─ POST /api/v1/cases/{case_id}/close
└─ GET /api/v1/cases (list with filters)

Database:
✓ Cases table
✓ Case timeline entries table
✓ Evidence files table
✓ Case tasks table

Deliverables:
✓ Case creation workflow UI
✓ Case detail dashboard
✓ Evidence upload and hashing
✓ API endpoints
✓ docs/case-management.md

Success Criteria:
✓ Create case from alert in 1 click
✓ Evidence upload with hash verification
✓ Timeline reconstruction within 5s
✓ Case closure captures root cause
```

#### 5.2.3 Threat Hunting Interface (Days 3-4)

```
TASK: Build query builder and hunt results visualization

Components:
├─ Hunt Query Builder
│  ├─ Filter panel (add filters by field)
│  ├─ Advanced search (raw query mode)
│  ├─ Time range picker
│  ├─ Preview results (first 100)
│  └─ Run full hunt button
│
├─ Hunt Results Visualization
│  ├─ Timeline view (events in chronological order)
│  ├─ Heatmap (activity by time)
│  ├─ Entity breakdown (pivot by IP, user, hostname)
│  ├─ Distribution chart (by rule, event type)
│  └─ Raw event viewer
│
└─ Hunt Documentation
   ├─ Save hunt with name and description
   ├─ Findings section (what did we learn?)
   ├─ Detection candidate creation
   └─ Link to case

Backend:
├─ POST /api/v1/hunts (create new hunt)
├─ POST /api/v1/hunts/search (execute query)
├─ GET /api/v1/hunts/{hunt_id}/results
└─ POST /api/v1/hunts/{hunt_id}/save

Database:
✓ Hunts table
✓ Hunt results table

Deliverables:
✓ Hunt query builder UI
✓ Results visualization (timeline, heatmap)
✓ Hunt documentation UI
✓ API endpoints
✓ docs/threat-hunting.md

Success Criteria:
✓ Query builder intuitive for L1 analysts
✓ Hunt executes in <10s (up to 10k results)
✓ Results display multiple perspectives
✓ Can pivot between entities easily
```

### 5.3 Phase 3 Testing

```
UI/UX Testing:
├─ Investigator workflow timing (reach raw event in 2 clicks)
├─ Case creation from alert
├─ Timeline reconstruction accuracy

API Testing:
├─ Load test alert detail endpoint (100 concurrent requests)
├─ Search performance (various query sizes)
├─ Evidence upload (file integrity)

Integration Testing:
├─ Alert → Case → Timeline
├─ Hunt query → Results → Detection candidate
└─ Evidence upload → Chain of custody logging
```

### 5.4 Phase 3 Success Metrics

| Metric | Target |
|---|---|
| Investigation workspace responsiveness | <2s page load |
| Case creation time | <10s |
| Timeline reconstruction | <5s |
| Hunt query execution (10k results) | <10s |
| Evidence hash verification | 100% accuracy |

---

## 6. Phase 4: Response Automation (Week 4)

### 6.1 Objectives
- Implement SOAR-style playbooks
- Build approval workflow for high-risk actions
- Create audit trail for all response actions
- Enable automated containment

### 6.2 Detailed Sprint Tasks

#### 6.2.1 Playbook Engine (Days 1-2)

```
TASK: Implement playbook execution framework

Playbooks:
├─ PB-01: Brute Force Response
│  ├─ Trigger: Multiple failed SSH attempts (rule 5002)
│  ├─ Actions:
│  │  ├─ Collect evidence (auth logs)
│  │  ├─ Block source IP (in lab firewall)
│  │  ├─ Verify containment
│  │  └─ Log action with audit trail
│  ├─ Approval: Optional for lab, required for production
│  └─ Rollback: Unblock IP if false alarm
│
├─ PB-02: Web Attack Response
│  ├─ Trigger: SQLi/command injection detected
│  ├─ Actions:
│  │  ├─ Enrich IOC
│  │  ├─ Isolate web server (snapshot state)
│  │  ├─ Capture context
│  │  └─ Create case
│  ├─ Approval: Recommended
│  └─ Rollback: Restore from snapshot
│
├─ PB-03: Host Quarantine
│  ├─ Trigger: Confirmed compromise on critical asset
│  ├─ Actions:
│  │  ├─ Preserve evidence (memory dump simulation)
│  │  ├─ Disconnect from network (in lab)
│  │  ├─ Snapshot filesystem
│  │  └─ Alert security team
│  ├─ Approval: Required
│  └─ Rollback: Restore network connectivity
│
├─ PB-04: IOC Sweep
│  ├─ Trigger: Manual or malicious IOC detected
│  ├─ Actions:
│  │  ├─ Search historical telemetry
│  │  ├─ Generate impacted asset list
│  │  ├─ Export IOC report
│  │  └─ Cross-reference with threat intelligence
│  ├─ Approval: No (read-only)
│  └─ Rollback: N/A
│
└─ PB-05: Detection Gap
   ├─ Trigger: Technique with no detection found
   ├─ Actions:
   │  ├─ Create detection engineering task
   │  ├─ Attach evidence
   │  ├─ Assign to engineer
   │  └─ Add to coverage backlog
   ├─ Approval: No
   └─ Rollback: N/A

Playbook Structure (YAML/JSON):
{
  "id": "pb-01",
  "name": "Brute Force Response",
  "trigger": { "rule_id": "5002" },
  "approval_required": false,
  "actions": [
    {
      "name": "collect_evidence",
      "type": "query",
      "query": "SELECT * FROM alerts WHERE rule_id='5002' AND timestamp > NOW()-6h"
    },
    {
      "name": "block_ip",
      "type": "firewall",
      "action": "block",
      "target": "{{ alert.source_ip }}"
    },
    {
      "name": "verify_containment",
      "type": "health_check",
      "check": "ssh_attempts_from_ip"
    }
  ],
  "rollback": [
    { "name": "unblock_ip", "type": "firewall", "action": "unblock" }
  ]
}

Backend:
├─ POST /api/v1/playbooks/{playbook_id}/execute
├─ GET /api/v1/playbooks/{playbook_id}/runs
├─ POST /api/v1/playbooks/{playbook_id}/approve
├─ POST /api/v1/playbooks/{playbook_id}/rollback
└─ GET /api/v1/audit-logs (execution history)

Database:
✓ Playbooks table
✓ Playbook executions table
✓ Audit logs table (immutable)

Deliverables:
✓ Playbook definitions (YAML/JSON)
✓ Playbook execution engine
✓ Approval workflow UI
✓ API endpoints
✓ docs/playbooks-and-automation.md

Success Criteria:
✓ All 5 playbooks execute without errors
✓ Actions recorded in audit log
✓ Rollback functionality works
✓ Approval workflow enforced for high-risk actions
```

#### 6.2.2 Approval Workflow (Days 2-3)

```
TASK: Implement playbook approval system

Workflow:
1. Playbook triggered (by alert or manual)
   ↓
2. System checks: approval_required flag
   ↓
3. If approval_required:
   ├─ Create approval request
   ├─ Route to authorized approver (L2 analyst or manager)
   ├─ Notify approver (dashboard, email, Slack)
   └─ Playbook waits (timeout: 15 minutes)
   ↓
4. Approver reviews:
   ├─ Scope: Which assets will be affected?
   ├─ Actions: What exactly will be executed?
   ├─ Risk: Reversibility? Side effects?
   └─ [APPROVE] or [REJECT]
   ↓
5. If approved:
   ├─ Approval recorded in audit log
   ├─ Playbook executes immediately
   └─ Actions logged
   ↓
6. If rejected:
   ├─ Rejection reason recorded
   ├─ Playbook aborted
   └─ Analyst notified

UI Components:
├─ Approval Request Dashboard
│  ├─ Pending approvals list
│  ├─ Request details (playbook, trigger, scope)
│  ├─ Action preview (what will execute)
│  └─ [APPROVE] [REJECT] buttons
│
└─ Execution History
   ├─ Playbook runs log
   ├─ Approval history
   └─ Action results

Backend:
├─ POST /api/v1/playbooks/{id}/approve (action: approve/reject)
├─ GET /api/v1/approvals/pending
├─ GET /api/v1/playbooks/executions/{exec_id}
└─ Approval notifications (email/Slack)

Deliverables:
✓ Approval dashboard UI
✓ Approval workflow backend
✓ Audit logging for approvals
✓ Notification system

Success Criteria:
✓ High-risk playbook cannot execute without approval
✓ Approval requests timeout after 15 minutes
✓ All approvals recorded in audit log
✓ Approvers notified in real-time
```

#### 6.2.3 Audit Trail and Immutable Logging (Days 3-4)

```
TASK: Implement comprehensive audit logging

Audit Log Captures:
├─ Authentication events
│  ├─ Login success/failure
│  ├─ Password changes
│  └─ MFA events
│
├─ Authorization events
│  ├─ Permission changes
│  ├─ Role assignment
│  └─ Access denials
│
├─ Data events
│  ├─ Case created/updated
│  ├─ Evidence uploaded
│  ├─ Alert escalated
│  └─ IOC extracted
│
└─ Action events
   ├─ Playbook executed
   ├─ Playbook approved/rejected
   ├─ Containment action taken
   └─ Rollback executed

Audit Log Entry Format:
{
  "event_id": "uuid",
  "timestamp": "2024-09-27T14:35:22Z",
  "actor_id": "user-123",
  "action": "playbook_executed",
  "resource_type": "playbook",
  "resource_id": "pb-01",
  "changes": {
    "status": ["pending", "running"],
    "actions_completed": [0, 3]
  },
  "ip_address": "192.168.1.50",
  "user_agent": "Mozilla/5.0...",
  "immutable": true
}

Immutability Enforcement:
├─ Append-only table (no UPDATE/DELETE)
├─ Database trigger prevents modifications
├─ Separate read-only replica for queries
└─ Regular exports to immutable archive

Backend:
├─ POST /api/v1/audit-logs (append only)
├─ GET /api/v1/audit-logs (with filters)
└─ POST /api/v1/audit-logs/export (compliance export)

Deliverables:
✓ Audit logs table (PostgreSQL)
✓ Audit logging middleware
✓ Audit log viewer UI
✓ Export function for compliance

Success Criteria:
✓ All significant actions logged
✓ Audit logs are immutable
✓ Queries return results in <5s
✓ Compliance export works
```

### 6.3 Phase 4 Testing

```
Playbook Testing:
├─ Each playbook dry-run
├─ Action validation (correct IP blocked, evidence collected, etc.)
├─ Rollback verification

Approval Testing:
├─ High-risk playbook requires approval
├─ Timeout handling (15 min expiry)
├─ Notification delivery

Audit Testing:
├─ All actions logged
├─ Immutability enforcement
├─ Export function validation
```

### 6.4 Phase 4 Success Metrics

| Metric | Target |
|---|---|
| Playbook execution success rate | 100% |
| Approval workflow enforcement | 100% |
| Audit log immutability | Guaranteed |
| Audit query latency | <5s |

---

## 7. Phase 5-6: Professional UX & Intelligence (Weeks 5-8)

### 7.1 Objectives (High-Level Overview)

**Phase 5: Dedicated Analyst Console**
- Professional frontend for SOC operations
- RBAC and user management
- Dashboards and reporting
- Integration with threat intelligence

**Phase 6: Intelligence & Advanced Analytics**
- IOC enrichment and tracking
- Asset risk scoring
- Threat intelligence feeds
- Automated report generation

### 7.2 Major Deliverables

- Dedicated analyst console (replacing Wazuh Dashboard for core workflows)
- Executive and L1/L2 dashboards
- API versioning and documentation
- RBAC implementation
- Threat intelligence module
- Reporting engine

---

## 8. Phase 7: Commercial Hardening (Weeks 9-12)

### 8.1 Objectives
- Production-grade CI/CD pipeline
- Security testing and hardening
- Performance optimization
- Documentation and packaging
- Upgrade and backup procedures

### 8.2 Major Activities

| Activity | Timeline | Effort |
|---|---|---|
| CI/CD pipeline expansion | Week 9 | 20 days |
| Security testing (penetration, SAST, DAST) | Week 10 | 20 days |
| Performance testing and optimization | Week 10 | 15 days |
| Documentation writing | Weeks 9-12 | 40 days |
| Upgrade path validation | Week 11 | 10 days |
| Disaster recovery testing | Week 11 | 10 days |
| Commercial packaging (licenses, etc.) | Week 12 | 10 days |

---

## 9. Team Structure and Capacity Planning

### 9.1 MVP Team (Weeks 1-4)

| Role | FTE | Responsibilities |
|---|---|---|
| **Tech Lead** | 1.0 | Architecture, code review, technical decisions |
| **Backend Engineer** | 1.5 | API, database, core logic |
| **Frontend Engineer** | 1.0 | UI/UX, investigation workspace, dashboards |
| **DevOps/Infra** | 1.0 | Docker, CI/CD, deployment |
| **Detection Engineer** | 1.0 | Wazuh rules, scenarios, validation |
| **Security Engineer** | 0.5 | Threat model, isolation, compliance |
| **QA/Testing** | 1.0 | Testing, validation, automation |
| **Product Manager** | 0.5 | Requirements, prioritization, stakeholder mgmt |

**Total MVP Team**: 7.5 FTE

### 9.2 Professional Phase Team (Weeks 5-8)

Add:
- **Frontend Lead**: 1.0 FTE (professional console)
- **Data Scientist/Analytics**: 0.5 FTE (risk scoring, anomaly detection)
- Additional **Backend Engineer**: 0.5 FTE

**Total Phase 5-6 Team**: 9.5 FTE

### 9.3 Commercial Hardening Team (Weeks 9-12)

Add:
- **Security Architect**: 1.0 FTE (hardening review)
- **Technical Writer**: 0.5 FTE (documentation)
- **Release Manager**: 0.5 FTE (packaging, versioning)

**Total Phase 7 Team**: 11.5 FTE

---

## 10. Risk Register and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| **Wazuh integration issues** | High | Medium | Early PoC, reference architecture from Wazuh docs |
| **Telemetry pipeline reliability** | Critical | Medium | Telemetry gate at Phase 1 completion, extensive testing |
| **False positive overload** | High | Medium | Rule tuning, suppression lists, feedback loop |
| **Scope creep** | Medium | High | Phase gates, explicit MVP boundary, strict backlog mgmt |
| **Performance under load** | Medium | Low | Load testing in Phase 7, profiling in Phase 4 |
| **Security/compliance gaps** | High | Low | Security review in Phase 0, penetration testing Phase 7 |
| **Team knowledge gaps** | Medium | Medium | Pairing, documentation, external training |

---

## 11. Success Criteria by Phase

### MVP (End of Week 4)
- ☑ Clean Docker Compose deployment
- ☑ 8+ ATT&CK techniques detected
- ☑ 3+ custom rules validated
- ☑ 80%+ detection coverage
- ☑ Basic investigation workspace
- ☑ Case management functional
- ☑ Playbooks execute and log actions
- ☑ Third-party can reproduce from GitHub

### Professional (End of Week 8)
- ☑ Dedicated analyst console
- ☑ RBAC fully implemented
- ☑ Dashboards for all roles
- ☑ Threat intelligence integrated
- ☑ Reports generated and exported
- ☑ API fully documented
- ☑ Performance meets targets

### Commercial (End of Week 12)
- ☑ Production CI/CD pipeline
- ☑ Security testing complete
- ☑ Documentation comprehensive
- ☑ Upgrade path validated
- ☑ Disaster recovery tested
- ☑ Commercial packaging ready

---

## 12. Metrics and KPIs

### Development Metrics

| Metric | Target |
|---|---|
| Code coverage | >80% |
| CI/CD pipeline pass rate | >95% |
| Security scan findings (critical/high) | 0 |
| Performance regression | <5% |
| Deployment success rate | >99% |

### Product Metrics

| Metric | MVP Target | Professional Target |
|---|---|---|
| MTTD (Mean Time To Detect) | <60s (validation gate) | <5s (real-time) |
| Detection coverage | 80% | 90%+ |
| False positive rate | <10% | <5% |
| Alert latency | <60s | <5s |
| API availability | Best effort | 99.9% |

---

## 13. Deployment and Release Strategy

### MVP Deployment
- Docker Compose on single host
- No external dependencies
- Reproducible from repository

### Professional Deployment
- Kubernetes-ready but optional
- Database separation possible
- Multi-container orchestration

### Commercial Deployment
- Managed container platform (Kubernetes, ECS, etc.)
- Managed database service
- Auto-scaling and HA
- Commercial support SLAs

---

## 14. Post-MVP Roadmap (Commercial Future)

### Q1: Windows and Multi-Cloud
- Windows/Sysmon telemetry
- AWS CloudTrail logs
- Azure audit logs

### Q2: Advanced Detection and Hunting
- Behavioral anomaly detection
- Automated ATT&CK coverage scoring
- Detection-as-code CI pipeline

### Q3: Enterprise Features
- Multi-tenant MSSP architecture
- High availability and disaster recovery
- Advanced case collaboration

### Q4: Purple Team and Training
- Purple team validation framework
- Continuous control testing
- Training modules and certifications

---

**Document Version**: 1.0  
**Status**: Target Architecture / Build Specification  
**Last Updated**: 2026-09-27  
**Next Milestone**: Phase 0 Architecture Review
