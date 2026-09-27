# SOC Detection Lab
## Backend Schema & Data Models v1.0

---

## Executive Summary

This document defines the complete backend data schema, database models, relationships, and storage specifications for SOC Detection Lab. It covers the data persistence layer, including relational schemas for cases, evidence, audit logs, and supporting indices for operational data.

---

## 1. Database Architecture Overview

### 1.1 Data Store Classification

| Store Type | Technology | Purpose | MVP | Professional |
|---|---|---|---|---|
| **Time-Series Events** | Wazuh Indexer (OpenSearch) | Raw events, alerts, telemetry | ✓ | ✓ |
| **Structured Cases** | PostgreSQL (or MongoDB) | Cases, tasks, evidence metadata | ✓ | ✓ |
| **Authentication** | Database | Users, roles, permissions | ✓ | ✓ |
| **Audit Logs** | Append-only storage | Immutable action logs | ✓ | ✓ |
| **Search Index** | Wazuh Indexer / OpenSearch | Full-text search on cases/logs | ✓ | ✓ |
| **Cache** | Redis (optional) | Session, rate limits, computed metrics | ✗ | ✓ |

### 1.2 MVP Database Choice

**Primary**: PostgreSQL (robust, ACID-compliant, open-source)  
**Search Engine**: Wazuh Indexer / OpenSearch (included with Wazuh)  
**Optional Cache**: Redis (can be added later)

---

## 2. PostgreSQL Schema

### 2.1 Core Entities

#### 2.1.1 Users Table

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role_id UUID NOT NULL,
  
  status VARCHAR(50) DEFAULT 'active',  -- active, disabled, deleted
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,
  
  FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
```

#### 2.1.2 Roles Table (RBAC)

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB,  -- Array of permission strings
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO roles (name, permissions) VALUES
('SOC_L1_ANALYST', '["alert:read", "alert:acknowledge", "case:create", "playbook:execute_low_risk"]'),
('SOC_L2_ANALYST', '["alert:*", "case:*", "hunt:*", "playbook:approve"]'),
('DETECTION_ENGINEER', '["rule:create", "rule:edit", "rule:test", "rule:deploy"]'),
('INCIDENT_RESPONDER', '["case:*", "evidence:*", "playbook:execute_high_risk"]'),
('SOC_MANAGER', '["dashboard:view", "case:view", "report:generate", "rbac:edit"]'),
('PLATFORM_ADMIN', '["*"]'),
('AUDITOR', '["*:read", "audit:read"]');
```

#### 2.1.3 Sessions Table

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  refresh_token_hash VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
```

---

### 2.2 Alert and Detection Tables

#### 2.2.1 Alerts Table

```sql
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_number BIGSERIAL UNIQUE,  -- Human-readable identifier
  
  -- Source Information
  source_event_id UUID,  -- Reference to event in Wazuh indexer
  rule_id VARCHAR(50) NOT NULL,
  rule_name VARCHAR(255) NOT NULL,
  rule_group VARCHAR(100),
  
  -- Alert Content
  severity INTEGER CHECK (severity >= 0 AND severity <= 10),
  confidence DECIMAL(3, 2) CHECK (confidence >= 0 AND confidence <= 1),
  priority INTEGER,  -- Calculated: severity * confidence * asset_criticality
  description TEXT,
  
  -- Entities
  source_ip INET,
  destination_ip INET,
  hostname VARCHAR(255),
  user_name VARCHAR(255),
  asset_id UUID,
  process_name VARCHAR(255),
  
  -- Status and Assignment
  status VARCHAR(50) DEFAULT 'NEW',  -- NEW, ACKNOWLEDGED, INVESTIGATING, ESCALATED, CONTAINED, RESOLVED, CLOSED
  assigned_analyst_id UUID,
  case_id UUID,
  
  -- ATT&CK Mapping
  mitre_tactic VARCHAR(100),
  mitre_techniques TEXT[],  -- Array of technique IDs: T1110.001, etc.
  
  -- Timestamps
  event_timestamp TIMESTAMP NOT NULL,  -- When the event occurred
  alert_created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  escalated_at TIMESTAMP,
  closed_at TIMESTAMP,
  
  FOREIGN KEY (assigned_analyst_id) REFERENCES users(id),
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE SET NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id)
);

CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_priority ON alerts(priority);
CREATE INDEX idx_alerts_assigned_analyst_id ON alerts(assigned_analyst_id);
CREATE INDEX idx_alerts_case_id ON alerts(case_id);
CREATE INDEX idx_alerts_event_timestamp ON alerts(event_timestamp);
CREATE INDEX idx_alerts_created_at ON alerts(alert_created_at);
```

#### 2.2.2 Alert Notes Table

```sql
CREATE TABLE alert_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID NOT NULL,
  author_id UUID NOT NULL,
  
  content TEXT NOT NULL,
  is_private BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (alert_id) REFERENCES alerts(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_alert_notes_alert_id ON alert_notes(alert_id);
```

#### 2.2.3 Detection Rules Table

```sql
CREATE TABLE detection_rules (
  id VARCHAR(50) PRIMARY KEY,  -- Wazuh rule ID (e.g., "5002")
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Rule Content
  rule_type VARCHAR(50),  -- ATOMIC, THRESHOLD, SEQUENCE, CORRELATION, BEHAVIORAL, FIM
  rule_xml TEXT,  -- Raw Wazuh XML or Sigma YAML
  rule_json JSONB,  -- Parsed rule structure
  
  -- Configuration
  severity INTEGER CHECK (severity >= 0 AND severity <= 10),
  confidence DECIMAL(3, 2),
  
  -- MITRE ATT&CK
  mitre_tactic VARCHAR(100),
  mitre_techniques TEXT[],
  
  -- Rule Status
  status VARCHAR(50),  -- DRAFT, TESTING, PRODUCTION, DEPRECATED
  version VARCHAR(20),  -- Semantic versioning: 1.0.0
  superseded_by VARCHAR(50),  -- If deprecated, which rule replaces it
  
  -- Metadata
  author_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deployed_at TIMESTAMP,
  last_triggered_at TIMESTAMP,
  
  -- Performance Metrics
  last_24h_matches BIGINT DEFAULT 0,
  last_24h_false_positives BIGINT DEFAULT 0,
  avg_latency_ms DECIMAL(10, 2),
  
  -- Documentation
  known_false_positives TEXT,
  required_fields TEXT[],
  required_data_source VARCHAR(100),
  
  FOREIGN KEY (author_id) REFERENCES users(id)
);

CREATE INDEX idx_detection_rules_status ON detection_rules(status);
CREATE INDEX idx_detection_rules_mitre_tactic ON detection_rules(mitre_tactic);
CREATE INDEX idx_detection_rules_created_at ON detection_rules(created_at);
```

#### 2.2.4 Rule Test Cases Table

```sql
CREATE TABLE rule_test_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id VARCHAR(50) NOT NULL,
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  test_type VARCHAR(50),  -- POSITIVE, NEGATIVE, FALSE_POSITIVE
  
  -- Test Data
  test_events JSONB,  -- Array of log lines or events
  expected_alert_generated BOOLEAN,
  expected_severity INTEGER,
  expected_fields JSONB,
  
  -- Results
  last_run_at TIMESTAMP,
  last_result VARCHAR(50),  -- PASS, FAIL, SKIPPED
  result_message TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (rule_id) REFERENCES detection_rules(id) ON DELETE CASCADE
);

CREATE INDEX idx_rule_test_cases_rule_id ON rule_test_cases(rule_id);
```

---

### 2.3 Case and Investigation Tables

#### 2.3.1 Cases Table

```sql
CREATE TABLE cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number BIGSERIAL UNIQUE,  -- Auto-increment case number
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  severity VARCHAR(50),  -- LOW, MEDIUM, HIGH, CRITICAL
  status VARCHAR(50) DEFAULT 'OPEN',  -- OPEN, INVESTIGATING, CONTAINED, RESOLVED, CLOSED
  
  -- Ownership and Assignment
  owner_id UUID NOT NULL,
  created_by_id UUID NOT NULL,
  updated_by_id UUID,
  
  -- Related Alerts
  related_alert_ids UUID[],
  
  -- Investigation Details
  root_cause TEXT,
  lessons_learned TEXT,
  closure_code VARCHAR(50),  -- BENIGN, TRUE_POSITIVE, DUPLICATE, TEST, OTHER
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  closed_at TIMESTAMP,
  
  FOREIGN KEY (owner_id) REFERENCES users(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id),
  FOREIGN KEY (updated_by_id) REFERENCES users(id)
);

CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_cases_severity ON cases(severity);
CREATE INDEX idx_cases_owner_id ON cases(owner_id);
CREATE INDEX idx_cases_created_at ON cases(created_at);
CREATE INDEX idx_cases_case_number ON cases(case_number);
```

#### 2.3.2 Case Timeline Entries Table

```sql
CREATE TABLE case_timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  
  event_type VARCHAR(100),  -- alert_triggered, evidence_collected, action_taken, note_added
  event_description TEXT,
  
  -- Reference to source
  related_alert_id UUID,
  related_action_id UUID,
  related_evidence_id UUID,
  
  event_timestamp TIMESTAMP NOT NULL,  -- When did this happen
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- When was it recorded
  recorded_by_id UUID,
  
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (related_alert_id) REFERENCES alerts(id),
  FOREIGN KEY (recorded_by_id) REFERENCES users(id)
);

CREATE INDEX idx_case_timeline_case_id ON case_timeline_entries(case_id);
CREATE INDEX idx_case_timeline_event_timestamp ON case_timeline_entries(event_timestamp);
```

#### 2.3.3 Evidence Files Table

```sql
CREATE TABLE evidence_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  
  filename VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),  -- log, screenshot, pcap, dump, text, other
  file_size_bytes BIGINT,
  
  -- Storage
  storage_url VARCHAR(1024),  -- S3, GCS, local path, etc.
  storage_path TEXT,
  
  -- Integrity
  hash_algorithm VARCHAR(50),  -- sha256, sha512
  hash_value VARCHAR(128),
  
  -- Metadata
  acquired_timestamp TIMESTAMP,  -- When was evidence acquired
  acquired_by_id UUID,
  acquired_from VARCHAR(255),  -- Evidence source (agent ID, system, tool)
  
  description TEXT,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accessed_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMP,
  
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (acquired_by_id) REFERENCES users(id)
);

CREATE INDEX idx_evidence_files_case_id ON evidence_files(case_id);
CREATE INDEX idx_evidence_files_hash_value ON evidence_files(hash_value);
```

#### 2.3.4 Evidence Access Log Table

```sql
CREATE TABLE evidence_access_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_file_id UUID NOT NULL,
  
  accessed_by_id UUID,
  action VARCHAR(50),  -- READ, DOWNLOAD, DELETE, EXPORT
  
  accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address INET,
  
  FOREIGN KEY (evidence_file_id) REFERENCES evidence_files(id) ON DELETE CASCADE,
  FOREIGN KEY (accessed_by_id) REFERENCES users(id)
);

CREATE INDEX idx_evidence_access_logs_evidence_file_id ON evidence_access_logs(evidence_file_id);
CREATE INDEX idx_evidence_access_logs_accessed_at ON evidence_access_logs(accessed_at);
```

#### 2.3.5 Case Tasks Table

```sql
CREATE TABLE case_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL,
  
  title VARCHAR(500) NOT NULL,
  description TEXT,
  
  status VARCHAR(50) DEFAULT 'OPEN',  -- OPEN, IN_PROGRESS, BLOCKED, COMPLETE
  priority VARCHAR(50),  -- LOW, MEDIUM, HIGH, CRITICAL
  
  assigned_to_id UUID,
  created_by_id UUID,
  
  due_date DATE,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_id) REFERENCES users(id),
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE INDEX idx_case_tasks_case_id ON case_tasks(case_id);
CREATE INDEX idx_case_tasks_status ON case_tasks(status);
```

---

### 2.4 Indicators of Compromise (IOC) Tables

#### 2.4.1 IOCs Table

```sql
CREATE TABLE iocs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  ioc_type VARCHAR(50) NOT NULL,  -- IPv4, IPv6, Domain, URL, Hash, Email, Process, User, Certificate
  ioc_value VARCHAR(500) NOT NULL,
  
  source VARCHAR(255),  -- Where extracted from: alert_id, case_id, hunt_id, feed_name
  source_ref UUID,  -- Reference to alert, case, or hunt
  
  confidence VARCHAR(50),  -- LOW, MEDIUM, HIGH
  threat_level VARCHAR(50),  -- GREEN, YELLOW, ORANGE, RED
  
  -- Intelligence
  threat_intel_context TEXT,
  reputation_score DECIMAL(3, 2),  -- 0.0 to 1.0
  threat_names TEXT[],  -- Malware families, campaign names
  
  -- Timestamps
  first_seen TIMESTAMP,
  last_seen TIMESTAMP,
  expires_at TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(ioc_type, ioc_value)
);

CREATE INDEX idx_iocs_ioc_value ON iocs(ioc_value);
CREATE INDEX idx_iocs_ioc_type ON iocs(ioc_type);
CREATE INDEX idx_iocs_threat_level ON iocs(threat_level);
CREATE INDEX idx_iocs_created_at ON iocs(created_at);
```

#### 2.4.2 IOC Relationships Table

```sql
CREATE TABLE ioc_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ioc_id UUID NOT NULL,
  related_ioc_id UUID NOT NULL,
  
  relationship_type VARCHAR(100),  -- resolved_to, communicates_with, related, etc.
  confidence DECIMAL(3, 2),
  source TEXT,
  
  FOREIGN KEY (ioc_id) REFERENCES iocs(id) ON DELETE CASCADE,
  FOREIGN KEY (related_ioc_id) REFERENCES iocs(id) ON DELETE CASCADE,
  
  UNIQUE(ioc_id, related_ioc_id)
);

CREATE INDEX idx_ioc_relationships_ioc_id ON ioc_relationships(ioc_id);
```

---

### 2.5 Asset and Risk Tables

#### 2.5.1 Assets Table

```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  hostname VARCHAR(255) UNIQUE NOT NULL,
  fqdn VARCHAR(255),
  ip_addresses INET[],
  
  os_type VARCHAR(100),  -- Linux, Windows, macOS, etc.
  os_version VARCHAR(100),
  
  environment VARCHAR(50),  -- PRODUCTION, TEST, LAB
  criticality VARCHAR(50),  -- LOW, MEDIUM, HIGH, CRITICAL
  owner VARCHAR(255),
  
  -- Wazuh Agent Info
  agent_id VARCHAR(100),
  agent_status VARCHAR(50),  -- CONNECTED, DISCONNECTED, UNHEALTHY
  last_seen TIMESTAMP,
  
  -- Telemetry
  telemetry_sources TEXT[],  -- agent, syslog, web_logs, etc.
  
  -- Risk and Vulnerabilities
  risk_score INTEGER CHECK (risk_score >= 0 AND risk_score <= 100),
  vulnerability_count INTEGER DEFAULT 0,
  exposed_services TEXT[],
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(hostname)
);

CREATE INDEX idx_assets_hostname ON assets(hostname);
CREATE INDEX idx_assets_agent_id ON assets(agent_id);
CREATE INDEX idx_assets_environment ON assets(environment);
CREATE INDEX idx_assets_criticality ON assets(criticality);
CREATE INDEX idx_assets_risk_score ON assets(risk_score);
```

#### 2.5.2 Asset Activity Table

```sql
CREATE TABLE asset_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL,
  
  activity_type VARCHAR(100),  -- alert_generated, vulnerability_detected, change_detected
  description TEXT,
  severity VARCHAR(50),
  
  triggered_at TIMESTAMP NOT NULL,
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

CREATE INDEX idx_asset_activity_asset_id ON asset_activity(asset_id);
CREATE INDEX idx_asset_activity_triggered_at ON asset_activity(triggered_at);
```

---

### 2.6 Response Automation Tables

#### 2.6.1 Playbooks Table

```sql
CREATE TABLE playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playbook_id VARCHAR(50) UNIQUE,  -- Human readable: PB-01, PB-02
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Trigger Condition
  trigger_type VARCHAR(100),  -- alert_pattern, manual, scheduled
  trigger_condition JSONB,
  
  -- Actions
  actions JSONB,  -- Array of action objects
  
  -- Safety
  approval_required BOOLEAN DEFAULT TRUE,
  dry_run_available BOOLEAN DEFAULT TRUE,
  rollback_available BOOLEAN DEFAULT TRUE,
  scope_validation BOOLEAN DEFAULT TRUE,
  
  -- Status
  status VARCHAR(50),  -- DRAFT, ACTIVE, DISABLED
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_playbooks_status ON playbooks(status);
```

#### 2.6.2 Playbook Executions Table

```sql
CREATE TABLE playbook_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id VARCHAR(100) UNIQUE,  -- exec-123456
  
  playbook_id UUID NOT NULL,
  triggered_by_id UUID,  -- Alert ID or manual user
  triggered_by_user_id UUID,
  
  case_id UUID,
  
  -- Execution Details
  status VARCHAR(50),  -- PENDING, APPROVED, RUNNING, SUCCESS, FAILED
  approval_required BOOLEAN,
  approved_by_id UUID,
  approval_timestamp TIMESTAMP,
  approval_reason TEXT,
  
  dry_run BOOLEAN,
  
  -- Execution Results
  actions_completed BIGINT DEFAULT 0,
  actions_total BIGINT,
  results JSONB,  -- Array of action results
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  
  FOREIGN KEY (playbook_id) REFERENCES playbooks(id),
  FOREIGN KEY (triggered_by_user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by_id) REFERENCES users(id),
  FOREIGN KEY (case_id) REFERENCES cases(id)
);

CREATE INDEX idx_playbook_executions_playbook_id ON playbook_executions(playbook_id);
CREATE INDEX idx_playbook_executions_status ON playbook_executions(status);
CREATE INDEX idx_playbook_executions_case_id ON playbook_executions(case_id);
```

---

### 2.7 Audit Logging Tables

#### 2.7.1 Audit Logs Table (Immutable)

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  actor_id UUID,  -- User who performed the action
  action VARCHAR(100) NOT NULL,  -- create, update, delete, execute, approve
  resource_type VARCHAR(100),  -- alert, case, rule, user, evidence
  resource_id UUID,
  
  changes JSONB,  -- Before/after values for updates
  reason TEXT,  -- Why was action taken
  
  ip_address INET,
  user_agent TEXT,
  
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- This table is append-only; no updates or deletes allowed
CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Function to enforce immutability
CREATE OR REPLACE FUNCTION audit_log_immutable()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_no_update_delete
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE PROCEDURE audit_log_immutable();
```

#### 2.7.2 Authentication Audit Table

```sql
CREATE TABLE auth_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  user_id UUID,
  username VARCHAR(255),
  action VARCHAR(100),  -- login_success, login_failed, logout, password_change, mfa_enabled
  
  ip_address INET,
  user_agent TEXT,
  reason TEXT,  -- For failures: reason code
  
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_auth_audit_logs_user_id ON auth_audit_logs(user_id);
CREATE INDEX idx_auth_audit_logs_timestamp ON auth_audit_logs(timestamp);
```

---

### 2.8 Threat Hunt Tables

#### 2.8.1 Hunts Table

```sql
CREATE TABLE hunts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id VARCHAR(50) UNIQUE,
  
  title VARCHAR(500) NOT NULL,
  hypothesis TEXT,
  description TEXT,
  
  -- Hunt Query
  query_type VARCHAR(50),  -- elasticsearch_query, wazuh_rule, custom_query
  query JSONB,
  
  -- Scope
  time_range_start TIMESTAMP,
  time_range_end TIMESTAMP,
  
  -- Status
  status VARCHAR(50),  -- DRAFT, RUNNING, COMPLETED
  
  -- Results
  result_count BIGINT DEFAULT 0,
  detection_gap_found BOOLEAN DEFAULT FALSE,
  
  -- Ownership
  created_by_id UUID,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);

CREATE INDEX idx_hunts_created_by_id ON hunts(created_by_id);
CREATE INDEX idx_hunts_status ON hunts(status);
```

#### 2.8.2 Hunt Results Table

```sql
CREATE TABLE hunt_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunt_id UUID NOT NULL,
  
  result_type VARCHAR(50),  -- event, alert, match
  result_data JSONB,
  
  related_alert_id UUID,
  related_case_id UUID,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (hunt_id) REFERENCES hunts(id) ON DELETE CASCADE,
  FOREIGN KEY (related_alert_id) REFERENCES alerts(id),
  FOREIGN KEY (related_case_id) REFERENCES cases(id)
);

CREATE INDEX idx_hunt_results_hunt_id ON hunt_results(hunt_id);
```

---

## 3. OpenSearch / Wazuh Indexer Schema

### 3.1 Normalized Event Index

**Index Name**: `wazuh-events-*` (time-series)

```json
{
  "mappings": {
    "properties": {
      "event": {
        "type": "nested",
        "properties": {
          "timestamp": { "type": "date" },
          "source_timestamp": { "type": "keyword" },
          "source": {
            "properties": {
              "ip": { "type": "ip" },
              "port": { "type": "integer" },
              "agent_id": { "type": "keyword" }
            }
          },
          "destination": {
            "properties": {
              "ip": { "type": "ip" },
              "port": { "type": "integer" },
              "hostname": { "type": "keyword" }
            }
          },
          "user": {
            "properties": {
              "name": { "type": "keyword" },
              "id": { "type": "keyword" }
            }
          },
          "process": {
            "properties": {
              "id": { "type": "integer" },
              "name": { "type": "keyword" },
              "command_line": { "type": "text" }
            }
          },
          "file": {
            "properties": {
              "path": { "type": "keyword" },
              "action": { "type": "keyword" },
              "hash": { "type": "keyword" }
            }
          },
          "raw_event": { "type": "text" },
          "parser": {
            "properties": {
              "status": { "type": "keyword" },
              "parser_name": { "type": "keyword" }
            }
          }
        }
      },
      "detection": {
        "properties": {
          "rule_id": { "type": "keyword" },
          "rule_name": { "type": "text" },
          "severity": { "type": "integer" },
          "confidence": { "type": "float" },
          "mitre": {
            "properties": {
              "tactic": { "type": "keyword" },
              "technique": { "type": "keyword" }
            }
          }
        }
      },
      "metadata": {
        "properties": {
          "asset_criticality": { "type": "keyword" },
          "data_source": { "type": "keyword" },
          "ingestion_lag_ms": { "type": "integer" }
        }
      }
    }
  }
}
```

### 3.2 Alert Index

**Index Name**: `wazuh-alerts-*` (time-series)

```json
{
  "mappings": {
    "properties": {
      "alert_id": { "type": "keyword" },
      "alert_number": { "type": "keyword" },
      "timestamp": { "type": "date" },
      "rule_id": { "type": "keyword" },
      "rule_name": { "type": "text" },
      "severity": { "type": "integer" },
      "source_ip": { "type": "ip" },
      "destination_ip": { "type": "ip" },
      "hostname": { "type": "keyword" },
      "user": { "type": "keyword" },
      "status": { "type": "keyword" },
      "case_id": { "type": "keyword" }
    }
  }
}
```

---

## 4. Retention and Archive Policy

### 4.1 Data Retention Matrix

| Data Type | Hot (Days) | Warm (Days) | Archive (Days) | Total | Policy |
|---|---|---|---|---|---|
| Raw Events | 7 | 30 | 90 | 127 | Automatic daily roll-over, archive to S3 |
| Alerts | 30 | 90 | 365 | 485 | Keep in ES; export yearly to archive |
| Cases | Indefinite | - | - | Indefinite | Never auto-delete; immutable |
| Evidence | 30 | - | 365 | 395 | Preserve evidence; offload to archive after 1 year |
| Audit Logs | 90 | 90 | 730 | 910 | Never delete; compliance hold |

### 4.2 Archive Strategy

```yaml
# In docker-compose or K8s config
retention_policy:
  raw_events:
    hot_days: 7
    warm_days: 30
    archive_days: 90
    archive_destination: "s3://soc-lab-archive/events/"
  
  alerts:
    hot_days: 30
    warm_days: 90
    archive_days: 365
    archive_destination: "s3://soc-lab-archive/alerts/"
  
  cases:
    retention: "indefinite"
  
  audit_logs:
    retention: "indefinite"
```

---

## 5. Indexing and Query Optimization

### 5.1 Critical Indexes

```sql
-- Frequently queried columns should be indexed
CREATE INDEX idx_alerts_status_severity ON alerts(status, severity);
CREATE INDEX idx_alerts_assigned_analyst_created ON alerts(assigned_analyst_id, alert_created_at DESC);
CREATE INDEX idx_cases_owner_status ON cases(owner_id, status);
CREATE INDEX idx_audit_logs_resource_timestamp ON audit_logs(resource_type, timestamp DESC);

-- Full-text search on case titles and descriptions
CREATE INDEX idx_cases_title_search ON cases USING GIN(to_tsvector('english', title || ' ' || description));

-- IOC lookups
CREATE INDEX idx_iocs_value_type ON iocs(ioc_type, ioc_value);
```

### 5.2 Query Patterns and Optimization

```sql
-- Example: Get analyst's pending alerts with timeline
SELECT a.id, a.alert_number, a.rule_name, a.severity, a.priority, a.status
FROM alerts a
WHERE a.assigned_analyst_id = $1 AND a.status IN ('NEW', 'ACKNOWLEDGED')
ORDER BY a.priority DESC, a.alert_created_at DESC
LIMIT 50;

-- Performance: Uses index on (assigned_analyst_id, status, priority)
```

---

## 6. Backup and Disaster Recovery

### 6.1 PostgreSQL Backup Strategy

```bash
# Daily incremental backup
pg_basebackup -D /backup/soc-lab-$(date +%Y%m%d) -Ft -z -P

# Weekly full backup
pg_dump -Fc soc_lab > /backup/soc-lab-full-$(date +%Y%m%d).dump

# Archive to S3
aws s3 cp /backup/soc-lab-*.dump s3://soc-lab-backups/postgresql/
```

### 6.2 OpenSearch Backup Strategy

```bash
# Create snapshot repository
curl -X PUT "localhost:9200/_snapshot/backup_repo?pretty" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/backup/opensearch-snapshots"
  }
}
'

# Create daily snapshot
curl -X PUT "localhost:9200/_snapshot/backup_repo/daily-$(date +%Y%m%d)?wait_for_completion=true"
```

---

## 7. Data Migration (MVP to Professional)

### 7.1 Migration Strategy

From single Docker PostgreSQL instance to managed database (RDS, Cloud SQL):

```yaml
Phase 1: Replication
  - Enable logical replication on MVP database
  - Set up target database on managed service
  - Stream changes from MVP to target

Phase 2: Validation
  - Compare row counts, checksums
  - Run integration tests against target
  - Validate application queries

Phase 3: Cutover
  - Stop application writes
  - Sync final changes
  - Point application to new database
  - Monitor for issues

Phase 4: Cleanup
  - Archive MVP database
  - Decommission old infrastructure
```

---

## 8. Schema Versioning

### 8.1 Migration Management

```sql
-- Create migrations table
CREATE TABLE schema_migrations (
  version BIGINT PRIMARY KEY,
  description TEXT,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Example migration
-- File: migrations/20240927_001_create_users.sql
BEGIN;
CREATE TABLE users (...);
INSERT INTO schema_migrations (version, description) VALUES (20240927001, 'Create users table');
COMMIT;
```

---

**Document Version**: 1.0  
**Status**: Target Architecture / Build Specification  
**Last Updated**: 2026-09-27
