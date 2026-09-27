# SOC Detection Lab
## Technical Requirements Document (TRD) v1.0

---

## Executive Summary

This Technical Requirements Document (TRD) provides the complete technical blueprint for SOC Detection Lab, detailing the system architecture, technology stack, data models, integration patterns, security controls, and implementation specifications. This document is intended for architects, engineers, and DevOps teams implementing the platform.

---

## 1. Technology Stack Overview

### 1.1 Core SIEM Stack (MVP)

| Layer | Component | Version | Purpose |
|---|---|---|---|
| **Orchestration** | Docker & Docker Compose | Latest | Container management and local orchestration |
| **SIEM Manager** | Wazuh Manager | 4.7+ | Rule engine, agent coordination, event processing |
| **Data Store** | Wazuh Indexer / OpenSearch | Compatible with Wazuh | Full-text indexing, event search, retention management |
| **Dashboard** | Wazuh Dashboard | 4.7+ | Default visualization and exploration interface |
| **Agents** | Wazuh Agent | 4.7+ | Telemetry collection from monitored hosts |

### 1.2 Lab Targets and Applications

| Component | Role | Technology |
|---|---|---|
| **DVWA** | Web application with vulnerabilities | PHP, MySQL, Docker |
| **Monitored Host** | Linux system generating telemetry | Ubuntu/Debian, auditd, syslog |
| **Network Telemetry** | Optional: packet capture and network logs | tcpdump, Zeek (future) |

### 1.3 Backend Services (Professional Phase)

| Service | Technology | Purpose |
|---|---|---|
| **API Server** | Node.js/Express or Python/FastAPI | REST API abstraction, business logic |
| **Case Management** | PostgreSQL or MongoDB | Structured case data, ACID transactions |
| **Event Processing** | Apache Kafka or Redis Streams | High-volume event stream processing |
| **Authentication** | Keycloak or internal JWT | OIDC/SAML/LDAP support, MFA |
| **Search Backend** | OpenSearch or Elasticsearch | Advanced analytics and aggregations |

### 1.4 Frontend (Professional Phase)

| Component | Technology | Purpose |
|---|---|---|
| **Web Framework** | React or Vue.js | Interactive analyst console |
| **State Management** | Redux or Vuex | Client-side state and caching |
| **UI Component Library** | Material-UI or Bootstrap Vue | Consistent, accessible UI |
| **Real-time Updates** | WebSocket or Server-Sent Events | Live alert and case updates |

---

## 2. System Architecture

### 2.1 Logical Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY SOURCES                             │
│  Linux Hosts | Windows/Sysmon | Web Apps | Network | Cloud     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              COLLECTORS & AGENTS                                │
│  Wazuh Agent | Syslog | Web Server | Audit | PCAP Replay      │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│         INGESTION GATEWAY                                       │
│  Wazuh Agent Communication Protocol (ACP) or Syslog            │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│      NORMALIZATION & PARSING                                    │
│  Source Identification | Field Extraction | Schema Mapping     │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
           ▼                              ▼
     ┌────────────┐              ┌──────────────┐
     │Event Stream│              │ Raw Evidence │
     │(Indexed)   │              │  (Preserved) │
     └────────────┘              └──────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│     DETECTION & CORRELATION                                     │
│  Wazuh Rules | Sigma | Thresholds | Sequences | Behavioral    │
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
           ▼                              ▼
      ┌─────────┐                  ┌──────────────┐
      │ Alerts  │                  │Risk / Context│
      └────┬────┘                  └──────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│      CASE & INVESTIGATION LAYER                                 │
│  Case Management | Timeline | Evidence | Investigation Workspace│
└──────────┬──────────────────────────────┬───────────────────────┘
           │                              │
           ▼                              ▼
     ┌─────────────┐           ┌──────────────┐
     │Threat Intel │           │  SOAR Engine │
     └─────────────┘           └────────┬─────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │ Controlled Response    │
                           │ Playbook Execution    │
                           └────────────┬───────────┘
                                        │
                                        ▼
                           ┌────────────────────────┐
                           │   Audit Log (Immutable)│
                           └────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│              WEB CONSOLE / ANALYST WORKSPACE                   │
│  REST API | WebSocket | Dashboards | Cases | Hunts            │
└────────────────────────────────────────────────────────────────┘
```

### 2.2 MVP Deployment Architecture (Docker Compose)

```yaml
# Docker Compose Network: soc-lab-net (internal bridge)
# All services communicate via internal container DNS
# No ports exposed except dashboard (localhost:5601 optional for dev)

Services:
├── wazuh-manager
│   ├── Port 1514/UDP: Agent communication (ACP)
│   ├── Port 1515/TCP: Agent registration
│   ├── Port 514/UDP: Syslog ingestion
│   └── Volumes: /var/ossec (config, rules, logs)
│
├── wazuh-indexer (OpenSearch-based)
│   ├── Port 9200: REST API (internal only)
│   ├── Port 9300: Node communication
│   └── Volumes: /var/lib/wazuh-indexer/data (persistent)
│
├── wazuh-dashboard
│   ├── Port 5601: Web UI (localhost)
│   └── Volumes: /usr/share/wazuh-dashboard/certs
│
├── dvwa (Docker Web Vulnerability App)
│   ├── Port 80: Internal HTTP
│   ├── MySQL database
│   └── Pre-configured with test scenarios
│
├── monitored-host (Ubuntu with Wazuh agent)
│   ├── Wazuh Agent -> Manager connection
│   ├── auditd for process/file monitoring
│   ├── syslog for system events
│   └── Volumes: /var/log/audit (persistent)
│
└── [Optional] network-telemetry (Zeek/tcpdump)
    └── Captures and logs network metadata
```

### 2.3 Data Flow Pipeline

```
1. COLLECTION PHASE
   ├─ Wazuh agents on monitored hosts send events via ACP
   ├─ syslog streams to Wazuh Manager port 514/UDP
   ├─ Web server logs volume-mounted to Wazuh
   └─ auditd logs sent via syslog forwarding

2. INGESTION PHASE
   ├─ Wazuh Manager receives and validates events
   ├─ Deduplication based on source + fingerprint
   └─ Events queued for processing

3. PROCESSING PHASE
   ├─ Parser identifies log source type
   ├─ Field extraction to structured data
   ├─ Timestamp normalization to UTC
   └─ Source identity enrichment (agent metadata)

4. DETECTION PHASE
   ├─ Atomic rules (pattern matching)
   ├─ Threshold rules (rate-based)
   ├─ Sequence rules (multi-step)
   ├─ Correlation rules (cross-source)
   └─ Scoring with severity and confidence

5. INDEXING PHASE
   ├─ Normalized event sent to Wazuh Indexer (OpenSearch)
   ├─ Raw event preserved alongside
   ├─ Retention policy applied
   └─ Full-text and field indexing

6. ALERTING PHASE
   ├─ Alert generated if rule matches
   ├─ Alert properties: timestamp, source, rule, severity
   ├─ Deduplication and suppression
   └─ Presented in dashboard and API

7. INVESTIGATION PHASE
   ├─ Analyst pivots from alert
   ├─ Timeline reconstruction
   ├─ Related events fetched
   └─ Case created if needed

8. RESPONSE PHASE
   ├─ Playbook triggered (manual or auto)
   ├─ Approval gate (if required)
   ├─ Actions executed (in lab scope)
   └─ Audit trail recorded
```

---

## 3. Data Model

### 3.1 Core Event Schema

Every normalized event must include these fields:

```json
{
  "event": {
    "timestamp": "2024-09-27T14:32:45.123Z",        // UTC ISO 8601
    "source_timestamp": "2024-09-27T14:32:45.123Z", // Original timezone preserved separately
    "source": {
      "ip": "192.168.1.100",
      "port": 22,
      "agent_id": "agent-ubuntu-01"
    },
    "destination": {
      "ip": "192.168.1.1",
      "port": 2222,
      "hostname": "ssh-server"
    },
    "process": {
      "id": 1234,
      "name": "sshd",
      "command_line": "/usr/sbin/sshd -D",
      "parent_id": 1
    },
    "user": {
      "name": "attacker",
      "id": 1001,
      "groups": ["sudo", "docker"]
    },
    "file": {
      "path": "/etc/shadow",
      "action": "opened",
      "hash": "sha256:abc123..."
    },
    "raw_event": "{original log line here}",
    "parser": {
      "status": "success",
      "parser_name": "auth_parser_v1",
      "extraction_confidence": 0.99
    }
  },
  "detection": {
    "rule_id": "5501",
    "rule_name": "Multiple SSH Authentication Failures",
    "rule_group": "authentication",
    "mitre": {
      "tactic": "credential-access",
      "technique": ["T1110.001", "T1110.003"]
    },
    "severity": 8,
    "confidence": 0.95,
    "description": "Multiple SSH login failures detected from single source"
  },
  "alert": {
    "id": "alert-20240927-001234",
    "status": "new",
    "priority": 8,
    "acknowledged_at": null,
    "assignee": null
  },
  "metadata": {
    "asset_criticality": "medium",
    "data_source": "wazuh_agent",
    "ingestion_lag_ms": 234,
    "indexed_timestamp": "2024-09-27T14:32:45.500Z"
  }
}
```

### 3.2 Alert Entity Model

```
Alert
├── id: UUID
├── timestamp: ISO 8601
├── rule_id: string
├── rule_name: string
├── severity: 0-10
├── confidence: 0-1
├── status: NEW | ACKNOWLEDGED | INVESTIGATING | ESCALATED | CONTAINED | RESOLVED | CLOSED
├── priority: calculated (Severity × Confidence × AssetCriticality × ThreatContext × SpreadAdjustment)
├── source_event_id: UUID
├── related_event_ids: UUID[]
├── assigned_analyst: string (L1/L2 analyst username)
├── source_ip: IPv4/IPv6
├── destination_ip: IPv4/IPv6
├── hostname: string
├── user_name: string
├── asset_id: UUID
├── iocs_extracted: IOC[]
├── case_id: UUID (nullable, escalated to case)
├── notes: string[] (analyst-added)
├── timestamps:
│   ├── created_at: ISO 8601
│   ├── acknowledged_at: ISO 8601
│   ├── escalated_at: ISO 8601
│   ├── contained_at: ISO 8601
│   ├── closed_at: ISO 8601
└── audit_log: AuditEntry[]
```

### 3.3 Case Entity Model

```
Case
├── id: UUID
├── case_number: string (auto-incremented)
├── title: string
├── description: string
├── severity: LOW | MEDIUM | HIGH | CRITICAL
├── status: OPEN | INVESTIGATING | CONTAINED | RESOLVED | CLOSED
├── owner: string (analyst username)
├── created_at: ISO 8601
├── updated_at: ISO 8601
├── closed_at: ISO 8601
├── related_alerts: Alert[]
├── entities:
│   ├── assets: Asset[]
│   ├── users: User[]
│   ├── ips: IP[]
│   ├── domains: Domain[]
│   └── processes: Process[]
├── timeline: TimelineEntry[]
├── iocs: IOC[]
├── evidence: EvidenceFile[]
│   ├── id: UUID
│   ├── type: log | screenshot | pcap | file
│   ├── filename: string
│   ├── acquired_timestamp: ISO 8601
│   ├── hash: string (SHA256)
│   ├── size_bytes: integer
│   ├── url: string (artifact location)
│   └── access_log: AccessLogEntry[]
├── tasks: Task[]
│   ├── id: UUID
│   ├── title: string
│   ├── status: OPEN | IN_PROGRESS | COMPLETE
│   ├── assigned_to: string
│   └── due_date: ISO 8601
├── root_cause: string (nullable)
├── lessons_learned: string (nullable)
├── closure_code: BENIGN | TRUE_POSITIVE | DUPLICATE | TEST | OTHER
└── audit_log: AuditEntry[]
```

### 3.4 Detection Rule Model

```
DetectionRule
├── id: string (rule ID in Wazuh)
├── name: string
├── description: string
├── rule_type: ATOMIC | THRESHOLD | SEQUENCE | CORRELATION | BEHAVIORAL | FIM
├── logic:
│   ├── pattern: regex or matching criteria
│   ├── threshold: { count: integer, timeframe_seconds: integer }
│   ├── sequence: Event[]
│   └── raw_rule: (Wazuh XML or Sigma YAML)
├── mitre:
│   ├── tactic: string (ATT&CK tactic ID)
│   └── techniques: string[] (ATT&CK technique IDs)
├── severity: 0-10
├── confidence: 0-1
├── required_fields: string[]
├── required_data_source: string[]
├── known_false_positives: string[]
├── test_event: Event (fixture for validation)
├── metadata:
│   ├── author: string
│   ├── created_at: ISO 8601
│   ├── version: string (semantic)
│   ├── status: DRAFT | TESTING | PRODUCTION | DEPRECATED
│   └── superseded_by: string (nullable)
└── validation:
    ├── unit_tests: Test[]
    ├── last_tested_at: ISO 8601
    └── pass_rate: percentage
```

### 3.5 Asset Model

```
Asset
├── id: UUID
├── hostname: string
├── fqdn: string
├── ip_addresses: IPv4/IPv6[]
├── os: string (Ubuntu 22.04 LTS, Windows Server 2022, etc.)
├── environment: PRODUCTION | TEST | LAB
├── criticality: LOW | MEDIUM | HIGH | CRITICAL
├── owner: string (team/individual)
├── services: Service[]
│   ├── port: integer
│   ├── protocol: TCP | UDP
│   ├── service_name: string
│   └── exposure: INTERNAL | EXTERNAL
├── vulnerability_context: Vulnerability[]
├── agent_status: CONNECTED | DISCONNECTED | UNHEALTHY
├── last_seen: ISO 8601
├── telemetry_sources: string[] (agent, syslog, etc.)
└── risk_score: 0-100
```

### 3.6 IOC Model

```
IOC
├── id: UUID
├── type: IPv4 | IPv6 | Domain | URL | Hash | Email | Process | User | Certificate
├── value: string
├── source: string (where extracted from: alert ID, hunt ID, threat feed)
├── confidence: LOW | MEDIUM | HIGH
├── threat_level: GREEN | YELLOW | ORANGE | RED
├── first_seen: ISO 8601
├── last_seen: ISO 8601
├── expires_at: ISO 8601 (nullable)
├── threat_intel_context: string (reputation, known C2, malware family)
├── related_cases: Case[]
├── related_alerts: Alert[]
├── hunt_results: Hunt[]
└── audit_log: AuditEntry[]
```

---

## 4. Wazuh Rule Engine Specification

### 4.1 Supported Rule Types

#### Atomic Rules
```xml
<rule id="5001" level="7">
  <match>failed password</match>
  <description>SSH failed password</description>
  <group>authentication</group>
  <mitre>
    <tactic>credential-access</tactic>
    <id>T1110.001</id>
  </mitre>
</rule>
```

#### Threshold Rules
```xml
<rule id="5002" level="8" frequency="5" timeframe="300">
  <match>failed password</match>
  <same_source_ip />
  <description>Multiple failed SSH login attempts</description>
  <group>authentication</group>
  <mitre>
    <id>T1110.001</id>
  </mitre>
</rule>
```

#### Sequence Rules
```xml
<rule id="5003" level="9" type="frequency" frequency="5" timeframe="300">
  <prematch>failed password</prematch>
  <match>Connection closed by</match>
  <same_source_ip />
  <description>Multiple failed SSH logins followed by disconnect</description>
</rule>
```

### 4.2 Rule Metadata Standard

Every custom rule must document:

- **Unique rule ID**: Stable, never recycled
- **Technique ID**: MITRE ATT&CK ID (e.g., T1110.001)
- **Rationale**: Why native Wazuh coverage missed this
- **Test Event**: Sample log that triggers the rule
- **Expected Output**: Alert structure and fields
- **Known False Positives**: Documented scenarios
- **Validation Command**: How to reproduce the trigger

### 4.3 Rule Testing Framework

```
Rule Test Artifact: /detections/tests/{rule_id}_test.json

{
  "rule_id": "5002",
  "test_events": [
    {
      "name": "positive_test_brute_force",
      "events": [
        "failed password for admin from 192.168.1.50",
        "failed password for admin from 192.168.1.50",
        "failed password for admin from 192.168.1.50",
        "failed password for admin from 192.168.1.50",
        "failed password for admin from 192.168.1.50"
      ],
      "timeframe_seconds": 300,
      "expected_alert": true,
      "expected_severity": 8
    },
    {
      "name": "negative_test_single_failure",
      "events": ["failed password for admin from 192.168.1.50"],
      "expected_alert": false
    }
  ]
}
```

---

## 5. API Specification

### 5.1 Authentication & Authorization

```
POST /api/v1/auth/login
Request:
{
  "username": "analyst@company.com",
  "password": "secure_password"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "expires_in": 3600,
  "user": {
    "id": "user-123",
    "username": "analyst@company.com",
    "roles": ["SOC_L1_ANALYST", "USER"]
  }
}
```

All protected endpoints require:
```
Authorization: Bearer {access_token}
```

### 5.2 Alert API

```
GET /api/v1/alerts
Query Parameters:
  - status: NEW | ACKNOWLEDGED | INVESTIGATING | ...
  - severity: 0-10
  - asset_id: UUID
  - limit: 1-1000
  - offset: 0-*
  - sort_by: timestamp | severity | priority
  - sort_order: asc | desc

Response:
{
  "data": [
    {
      "id": "alert-123",
      "timestamp": "2024-09-27T14:32:45Z",
      "rule_name": "SSH Brute Force",
      "severity": 8,
      "confidence": 0.95,
      "source_ip": "192.168.1.50",
      "hostname": "ubuntu-monitored-01",
      "status": "NEW",
      "case_id": null
    }
  ],
  "pagination": {
    "total": 1234,
    "limit": 50,
    "offset": 0
  }
}
```

```
POST /api/v1/alerts/{alert_id}/acknowledge
Request:
{
  "assigned_to": "analyst-01",
  "note": "Acknowledged, investigating"
}

Response:
{
  "id": "alert-123",
  "status": "ACKNOWLEDGED",
  "acknowledged_at": "2024-09-27T14:35:22Z",
  "assigned_to": "analyst-01"
}
```

### 5.3 Case API

```
POST /api/v1/cases
Request:
{
  "title": "SSH Brute Force Attack - 192.168.1.50",
  "description": "Detected coordinated SSH login attempts",
  "severity": "HIGH",
  "related_alert_ids": ["alert-123", "alert-124"]
}

Response:
{
  "id": "case-001",
  "case_number": 1,
  "title": "SSH Brute Force Attack - 192.168.1.50",
  "severity": "HIGH",
  "status": "OPEN",
  "created_at": "2024-09-27T14:35:45Z"
}

GET /api/v1/cases/{case_id}/timeline
Response:
{
  "id": "case-001",
  "timeline": [
    {
      "timestamp": "2024-09-27T14:00:00Z",
      "event_type": "authentication_failure",
      "source_ip": "192.168.1.50",
      "user": "admin",
      "hostname": "ssh-server",
      "raw_event": "{...}"
    },
    ...
  ]
}
```

### 5.4 Events/Search API

```
POST /api/v1/events/search
Request:
{
  "query": {
    "time_range": {
      "start": "2024-09-27T10:00:00Z",
      "end": "2024-09-27T15:00:00Z"
    },
    "filters": [
      { "field": "source_ip", "operator": "equals", "value": "192.168.1.50" },
      { "field": "rule_name", "operator": "contains", "value": "SSH" }
    ],
    "limit": 100
  }
}

Response:
{
  "results": [
    {
      "timestamp": "2024-09-27T14:32:45Z",
      "source_ip": "192.168.1.50",
      "rule_name": "SSH Authentication Failed",
      "raw_event": "{...}"
    }
  ]
}
```

### 5.5 Detection Rules API

```
GET /api/v1/detections
Response:
{
  "data": [
    {
      "id": "5001",
      "name": "SSH Failed Password",
      "rule_type": "atomic",
      "status": "PRODUCTION",
      "severity": 7,
      "mitre": {
        "tactic": "credential-access",
        "techniques": ["T1110.001"]
      },
      "version": "1.2.3",
      "last_updated": "2024-09-15T10:00:00Z"
    }
  ]
}

POST /api/v1/detections/{rule_id}/test
Request:
{
  "test_event": "failed password for admin from 192.168.1.50"
}

Response:
{
  "matched": true,
  "rule_id": "5001",
  "alert_generated": true,
  "severity": 7
}
```

### 5.6 Playbook Execution API

```
POST /api/v1/playbooks/{playbook_id}/execute
Request:
{
  "trigger_id": "alert-123",
  "case_id": "case-001",
  "dry_run": false,
  "approval_code": "APPROVAL_TOKEN_123"
}

Response:
{
  "execution_id": "exec-456",
  "playbook_id": "pb-01",
  "status": "RUNNING",
  "actions_completed": 0,
  "actions_total": 3,
  "created_at": "2024-09-27T14:40:00Z"
}

GET /api/v1/playbooks/{playbook_id}/runs/{execution_id}
Response:
{
  "execution_id": "exec-456",
  "status": "COMPLETED",
  "actions": [
    {
      "name": "collect_evidence",
      "status": "success",
      "output": "Evidence collected"
    },
    {
      "name": "block_source_ip",
      "status": "success",
      "output": "Source IP 192.168.1.50 blocked in lab firewall"
    }
  ],
  "completed_at": "2024-09-27T14:41:30Z",
  "audit_entries": [...]
}
```

---

## 6. Security Architecture

### 6.1 Secure-by-Design Controls

#### Network Security
- **Default-Deny**: All inter-service communication via internal Docker bridge
- **No Public Exposure**: All services listen on localhost or container-only networks
- **Port Isolation**: Only necessary ports exposed between containers
- **Secrets Management**: Credentials stored in `.env` (git-ignored), loaded at runtime

#### Identity & Access Control
- **RBAC**: Role-based access control enforced server-side
- **UI Visibility**: Not a security boundary (server-side authorization mandatory)
- **MFA**: Required for production deployments
- **Audit Logging**: Every privileged action logged immutably

#### Data Protection
- **Encryption in Transit**: TLS for inter-service communication (production)
- **Encryption at Rest**: Sensitive fields encrypted in database
- **Evidence Integrity**: Cryptographic hashing, immutable storage for finalized evidence
- **Retention Policy**: Automated purging of data past retention window

#### Compliance & Audit
- **Immutable Audit Log**: All authentication, authorization, mutations logged
- **Evidence Chain of Custody**: Acquisition timestamp, accessor logs, hash verification
- **Data Retention**: Policy-driven retention with compliance exports
- **Access Logs**: Who accessed what, when, from where

### 6.2 Lab Isolation Requirements

- ✅ Internal Docker networking only
- ✅ All services listen on localhost or container hostnames
- ✅ No LAN/public internet exposure
- ✅ Firewall rules blocking external access
- ✅ No real production data in lab environment
- ✅ Snapshot and reset discipline to prevent state leakage

### 6.3 Container Security

- **Non-Root Execution**: Services run as unprivileged users where possible
- **Minimal Base Images**: Use slim/alpine variants to reduce attack surface
- **Dependency Scanning**: Automated scanning for known vulnerabilities
- **Image Pinning**: Fixed, reviewed container image versions
- **Read-Only Filesystems**: Where applicable, mount non-writable volumes

---

## 7. Deployment Specifications

### 7.1 MVP Deployment (Docker Compose)

**Prerequisites**:
- Docker Engine 20.10+
- Docker Compose 2.0+
- 16GB RAM minimum (8GB for Wazuh, 4GB for indexer, 2GB for DVWA, 2GB buffer)
- 50GB disk space (configurable retention)
- Linux host (Ubuntu 20.04 LTS or later recommended)

**Deployment Steps**:

```bash
# 1. Clone repository
git clone https://github.com/your-org/soc-detection-lab.git
cd soc-detection-lab

# 2. Configure environment
cp .env.example .env
# Edit .env with custom passwords and settings

# 3. Initialize certificates (Wazuh requires SSL)
./scripts/init_certs.sh

# 4. Start services
docker-compose up -d

# 5. Validate telemetry gate (known-good test)
./scripts/telemetry_gate.sh

# 6. Run attack scenario
./scripts/scenarios/ssh_brute_force.sh

# 7. Verify alerts generated
curl http://localhost:9200/wazuh-alerts-*/_search
```

### 7.2 Data Persistence

```yaml
volumes:
  wazuh-manager:
    driver: local
    driver_opts:
      type: tmpfs  # Or local directory for production
  
  wazuh-indexer-data:
    driver: local  # Persistent storage for indices
  
  dvwa-db:
    driver: local  # Persistent MySQL volume
  
  monitored-host:
    driver: local  # Preserve audit logs
```

### 7.3 Backup & Recovery

```bash
# Backup Wazuh Manager and rules
docker exec wazuh-manager tar -czf /backup/wazuh-backup.tar.gz /var/ossec

# Backup OpenSearch indices
curl -X POST "localhost:9200/_snapshot/backup/my_snapshot?wait_for_completion=true"

# Restore from backup
docker cp backup.tar.gz wazuh-manager:/
docker exec wazuh-manager tar -xzf /backup.tar.gz
```

---

## 8. Observability & Monitoring

### 8.1 Health Checks

Every service exposes a health endpoint:

```
GET /healthz
Response:
{
  "status": "healthy",
  "timestamp": "2024-09-27T14:32:45Z",
  "components": {
    "wazuh_manager": "connected",
    "wazuh_indexer": "connected",
    "agents": {
      "connected": 2,
      "total": 2
    }
  }
}
```

### 8.2 Key Metrics to Monitor

- **Ingestion Rate**: Events/sec from agents
- **Indexing Latency**: event_time → indexed_time (target: <5sec)
- **Alert Rate**: Alerts generated per hour
- **Detection Performance**: Rule execution time, matches per rule
- **Storage Usage**: Current storage / capacity
- **Collector Health**: Agents connected / agents configured
- **Search Performance**: Query latency, slow queries

---

## 9. Wazuh-Specific Integration Points

### 9.1 Wazuh Manager Configuration

**Key Configuration Files**:
- `/var/ossec/etc/ossec.conf`: Main configuration
- `/var/ossec/etc/rules/local_rules.xml`: Custom rules
- `/var/ossec/etc/decoders/local_decoders.xml`: Custom parsers
- `/var/ossec/etc/lists/`: IOC lists and reference data

### 9.2 Wazuh Agent Configuration

**Default Agent Configuration**:
```xml
<agent_config>
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/auth.log</location>
  </localfile>
  <localfile>
    <log_format>syslog</log_format>
    <location>/var/log/audit/audit.log</location>
  </localfile>
  <fim>
    <directories check_all="yes">/etc, /usr/bin, /usr/sbin</directories>
  </fim>
</agent_config>
```

### 9.3 Alert Field Mapping

Wazuh alerts include these key fields:

```
alert.rule.id              → Detection rule ID
alert.rule.mitre.id        → ATT&CK technique ID
alert.rule.level           → Wazuh severity (0-15, map to 0-10)
alert.rule.description     → Rule description
alert.agent.name           → Source agent/hostname
alert.data.srcip           → Source IP
alert.data.dstip           → Destination IP
alert.data.dstuser         → Destination user
alert.data.srcuser         → Source user
alert.data.audit.exe       → Executed command
alert.full_log             → Original event
```

---

## 10. Data Retention Policy

### 10.1 Default Retention Strategy

| Data Class | Hot Storage | Warm Storage | Archive | Total |
|---|---|---|---|---|
| Raw Events | 7 days | 30 days | 90 days | 127 days |
| Alerts | 30 days | 90 days | 1 year | 425 days |
| Cases | Indefinite (immutable) | - | - | Indefinite |
| Evidence | 1 year | - | - | 1 year |
| Audit Logs | 1 year | - | - | 1 year |

### 10.2 Retention Policy Configuration

```yaml
retention:
  events:
    hot_days: 7
    warm_days: 30
    archive_days: 90
  alerts:
    hot_days: 30
    warm_days: 90
    archive_days: 365
  cases:
    retention: "indefinite"
  evidence:
    retention_days: 365
```

---

## 11. Integration Points

### 11.1 Third-Party Integrations (Future)

- **Threat Intelligence Feeds**: AlienVault OTX, Abuse.ch, OSINT feeds
- **Ticketing**: Jira, ServiceNow
- **Communication**: Slack, Teams (alert notifications)
- **SOAR Platforms**: Splunk SOAR, Demisto, Swimlane
- **Cloud Platforms**: AWS CloudTrail, Azure Monitor logs
- **Container Registries**: Pull security scanning results

---

## 12. Performance & Scalability

### 12.1 MVP Performance Targets

| Metric | Target | Notes |
|---|---|---|
| Alert Latency | <60 seconds | Event to indexed alert |
| Concurrent Users | 5-10 | Single host MVP |
| Event Throughput | 1,000 events/sec peak | Wazuh default configuration |
| Search Query Latency | <2 seconds | 30-day window |
| Dashboard Load Time | <3 seconds | With cached queries |

### 12.2 Scalability Roadmap (Commercial)

- **Horizontal Scaling**: Multiple Wazuh managers with load balancer
- **Distributed Indexing**: OpenSearch cluster for high-volume environments
- **Collector Scale**: Agent-manager communication protocol supports 10k+ agents
- **Query Optimization**: Aggregation pipelines, materialized views

---

## 13. Testing Strategy

### 13.1 Test Levels

| Level | Scope | Examples |
|---|---|---|
| **Unit** | Individual components | Parser, scoring function, validation |
| **Rule Unit** | Detection rules | Individual rule against test events |
| **Integration** | Collector → Manager → Indexer → Alert | End-to-end telemetry pipeline |
| **Scenario** | Full attack chain | SSH brute-force + escalation |
| **Regression** | Ensure fixes hold | Rule changes don't break existing detections |
| **Security** | Auth, RBAC, injection | Penetration testing, input validation |
| **Performance** | Burst ingestion, latency | Sustained 5,000 events/sec |

### 13.2 Continuous Integration Gates

```
CI Pipeline:
1. ✓ Lint configuration (yamllint, shellcheck)
2. ✓ Validate Docker Compose
3. ✓ Build images and scan dependencies (Trivy)
4. ✓ Run unit tests
5. ✓ Run rule syntax tests
6. ✓ Replay known attack fixtures
7. ✓ Verify expected alerts generated
8. ✓ Publish versioned artifacts
```

---

**Document Version**: 1.0  
**Status**: Target Architecture / Build Specification  
**Last Updated**: 2026-09-27
