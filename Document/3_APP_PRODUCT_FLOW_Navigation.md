# SOC Detection Lab
## Product Flow & Feature Navigation v1.0

---

## Executive Summary

This document outlines the complete user workflows, feature navigation, and operational flows within SOC Detection Lab. It covers how users move through the platform from initial login through alert investigation, case management, threat hunting, and response execution.

---

## 1. User Workflows by Role

### 1.1 SOC L1 Analyst Workflow

#### Workflow: Daily Triage and Alert Response

```
LOGIN
  ↓
[L1 ANALYST DASHBOARD]
├─ View Priority Queue (alerts sorted by priority)
├─ Unassigned Alerts Count
├─ SLA Timers and Escalations
└─ Recent High-Confidence Detections

ALERT TRIAGE LOOP:
├─ SELECT ALERT FROM QUEUE
│  └─ Review Alert Summary:
│     ├─ Rule Name and Description
│     ├─ Severity and Confidence Score
│     ├─ Source IP / Hostname / User
│     ├─ Timestamp and Related Events Count
│     └─ [ACKNOWLEDGE BUTTON] → [INVESTIGATE BUTTON] → [ESCALATE BUTTON]
│
├─ [INVESTIGATE] → INVESTIGATION WORKSPACE
│  ├─ Alert Summary Panel
│  ├─ Entity Context Panel
│  │  ├─ Source IP Details (geolocation, reputation)
│  │  ├─ Destination Host (OS, services, criticality)
│  │  ├─ User Account (privileges, activity history)
│  │  └─ Process Information (command line, parent process)
│  │
│  ├─ Event Timeline Panel
│  │  ├─ Related Events (5 min before, 5 min after alert)
│  │  ├─ Click to expand individual events
│  │  └─ View raw log data
│  │
│  ├─ IOC Extraction Panel
│  │  ├─ Auto-extracted IOCs (IPs, domains, hashes)
│  │  ├─ Reputation lookup (VirusTotal, AbuseIPDB)
│  │  └─ Add to alert notes
│  │
│  └─ Action Buttons:
│     ├─ [CLOSE AS BENIGN]
│     ├─ [ESCALATE TO L2 ANALYST]
│     ├─ [CREATE CASE]
│     └─ [EXECUTE PLAYBOOK]
│
├─ [ESCALATE TO CASE]
│  └─ Auto-creates case with:
│     ├─ Title (auto-generated from alert)
│     ├─ Related Alerts linked
│     ├─ Initial timeline from alert
│     ├─ Owner assigned to current analyst
│     └─ Status set to OPEN
│
└─ [EXECUTE PLAYBOOK] (if low-risk)
   ├─ Select playbook (e.g., "Collect Evidence")
   ├─ Review scope (which assets affected)
   ├─ [CONFIRM EXECUTION]
   └─ Monitor progress
```

**Key Features Used**:
- Alert Search and Filtering
- Alert Acknowledgement and Status Update
- Entity Context and Pivoting
- Timeline Visualization
- IOC Extraction and Lookup
- Quick Case Creation
- Playbook Execution (low-risk)

**Success Criteria**:
- Alert triaged within SLA (e.g., 30 minutes)
- Decision documented (closed, escalated, or cased)
- All relevant context captured

---

### 1.2 SOC L2 Analyst Workflow

#### Workflow: Deep Investigation and Threat Hunting

```
LOGIN
  ↓
[L2 ANALYST DASHBOARD]
├─ Cases Assigned to Me
├─ Escalated Alerts Waiting Investigation
├─ Recent Threat Hunting Results
└─ Advanced Search Shortcuts

INVESTIGATION WORKFLOW:

1. SELECT CASE (from dashboard or search)
   ↓
   [CASE DETAIL VIEW]
   ├─ Case Metadata:
   │  ├─ Title, Description, Severity, Status
   │  ├─ Owner, Created Date, Timeline
   │  └─ Related Alerts (linked)
   │
   ├─ Case Timeline Tab:
   │  ├─ Chronological sequence of all evidence
   │  ├─ Filter by entity (IP, user, hostname)
   │  ├─ Expand individual events
   │  ├─ Add analyst notes at specific points
   │  └─ Timeline Visualization (Gantt-style)
   │
   ├─ Entities Tab:
   │  ├─ Assets (all hosts involved)
   │  ├─ Users (all accounts used/targeted)
   │  ├─ IPs (source and destination)
   │  ├─ Domains and URLs
   │  └─ Processes executed
   │
   ├─ Evidence Tab:
   │  ├─ List all collected evidence files
   │  ├─ Acquisition timestamp, hash, size
   │  ├─ [VIEW] raw evidence
   │  ├─ [DOWNLOAD] for forensic analysis
   │  └─ Access log (who viewed when)
   │
   ├─ IOCs Tab:
   │  ├─ Extracted indicators
   │  ├─ Reputation scores
   │  ├─ Mark as malicious / benign / unknown
   │  └─ Export for external tracking
   │
   ├─ Tasks Tab:
   │  ├─ Investigation tasks (auto-created)
   │  ├─ Remediation tasks (manual)
   │  ├─ Assign to team members
   │  ├─ Track completion status
   │  └─ [ADD NEW TASK]
   │
   └─ Actions:
      ├─ [PIVOT TO THREAT HUNT]
      ├─ [EXECUTE CONTAINMENT PLAYBOOK]
      ├─ [REQUEST APPROVAL FOR ACTION]
      ├─ [ADD EVIDENCE]
      ├─ [UPDATE STATUS]
      └─ [CLOSE CASE]

2. DEEP INVESTIGATION STEPS:
   
   a) Review Related Alerts
      ├─ All alerts linked to case
      ├─ Identify pattern or campaign
      └─ Assess severity escalation
   
   b) Analyze Timeline
      ├─ Identify attack sequence
      ├─ Determine entry point
      ├─ Trace lateral movement
      └─ Find data exfiltration evidence
   
   c) Entity Analysis
      ├─ Focus on compromised asset
      ├─ Review all activity by user
      ├─ Check network connections
      └─ Examine file modifications
   
   d) Threat Hunting
      ├─ Formulate hypothesis
      ├─ Query historical data
      ├─ [RUN HUNT] (see Threat Hunt Workflow)
      └─ Document findings
   
   e) Root Cause Analysis
      ├─ Determine attack vector
      ├─ Identify attacker technique (ATT&CK)
      ├─ Assess impact scope
      └─ Document in case notes

3. RESPONSE AUTHORIZATION
   
   High-Risk Playbook Execution:
   ├─ Review playbook actions:
   │  ├─ Disconnect asset from network?
   │  ├─ Kill malicious process?
   │  ├─ Block IP address?
   │  └─ Other destructive actions?
   │
   ├─ [APPROVE] or [REJECT]
   ├─ Add approval reason/timestamp
   ├─ Assign to responder
   └─ Monitor execution

4. CASE CLOSURE
   ├─ Root Cause Documented
   ├─ Lessons Learned Added
   ├─ All Evidence Collected
   ├─ Set Closure Code:
   │  ├─ TRUE_POSITIVE (confirmed attack)
   │  ├─ BENIGN (false alarm)
   │  ├─ DUPLICATE (merged with other case)
   │  └─ TEST (test scenario)
   ├─ [CLOSE CASE]
   └─ Generate Incident Report
```

**Threat Hunt Sub-Workflow**:

```
[THREAT HUNT WORKSPACE]

1. Define Hypothesis
   ├─ Question: "Are there other SSH connections from this attacker?"
   ├─ Expected Evidence: SSH auth logs
   └─ Time Range: Last 7 days

2. Build Hunt Query
   ├─ Filter by:
   │  ├─ Source IP (or CIDR range)
   │  ├─ Event type (authentication, process, network)
   │  ├─ Time range
   │  └─ Rule or field match
   │
   ├─ [PREVIEW RESULTS] (first 100 events)
   ├─ Adjust query if needed
   └─ [RUN HUNT] (full dataset)

3. Hunt Results Analysis
   ├─ Count of matches
   ├─ Timeline of activity
   ├─ Entity breakdown
   ├─ Export results to CSV
   ├─ Create detection candidate if pattern found
   └─ Link to case

4. Hunt Documentation
   ├─ Save hunt query
   ├─ Record hypothesis and findings
   ├─ Link to case or standalone
   └─ Mark as "Detection Opportunity" if repeatable behavior found
```

**Key Features Used**:
- Advanced Case Management
- Timeline Analysis and Pivoting
- Entity Context and Correlation
- Evidence Management with Integrity
- High-Risk Playbook Approval
- Threat Hunting Queries
- Root Cause Analysis Tools
- Report Generation

---

### 1.3 Detection Engineer Workflow

#### Workflow: Rule Development and Validation

```
LOGIN
  ↓
[DETECTION ENGINEER DASHBOARD]
├─ Detection Coverage (ATT&CK matrix)
├─ Missed-Technique Queue
├─ Rule Performance Metrics
├─ False-Positive Rate Tracking
└─ Recent Rule Versions

RULE DEVELOPMENT CYCLE:

1. IDENTIFICATION PHASE
   ├─ Select Missed Technique (from queue)
   │  ├─ Technique ID (e.g., T1110.001)
   │  ├─ Technique Name (Brute Force)
   │  ├─ Tactic (Credential Access)
   │  ├─ Expected Telemetry (auth logs)
   │  └─ Sample Attack Event
   │
   └─ [NEW RULE] button

2. RULE AUTHORING
   ├─ Wazuh XML Editor (or Sigma YAML)
   ├─ Define:
   │  ├─ Rule ID (auto-assigned)
   │  ├─ Description
   │  ├─ Match pattern (regex or field values)
   │  ├─ Severity (0-10)
   │  ├─ Confidence (%)
   │  ├─ ATT&CK Mapping
   │  ├─ Known False Positives
   │  └─ Related Rules
   │
   ├─ [SAVE AS DRAFT]
   └─ [PROCEED TO TESTING]

3. UNIT TESTING
   ├─ Create Test Cases:
   │  ├─ Positive Test: Sample event that should trigger
   │  │  └─ [ADD TEST EVENT] → paste/upload log
   │  └─ Negative Tests: Events that shouldn't trigger
   │     └─ [ADD NEGATIVE TEST]
   │
   ├─ [RUN TESTS]
   ├─ Review Results:
   │  ├─ Rule matched expected alert? ✓/✗
   │  ├─ Severity correct? ✓/✗
   │  ├─ Fields correctly extracted? ✓/✗
   │  └─ False positive cases? ✓/✗
   │
   └─ [DEBUG] if failures

4. FALSE POSITIVE EVALUATION
   ├─ Run against last 7 days of production telemetry
   ├─ Count benign matches
   ├─ Review high-frequency matches
   ├─ Adjust rule logic if needed
   ├─ Document known false-positive scenarios
   └─ [APPROVE FP ANALYSIS]

5. PEER REVIEW
   ├─ Submit for Review
   ├─ [ASSIGN REVIEWER]
   ├─ Reviewer checks:
   │  ├─ Logic correctness
   │  ├─ Completeness (all scenarios covered)
   │  ├─ Test coverage
   │  ├─ False positive acceptance
   │  └─ ATT&CK accuracy
   │
   ├─ Review Comments:
   │  ├─ [APPROVE] → proceed to deployment
   │  ├─ [REQUEST CHANGES] → return to authoring
   │  └─ [REJECT] → archive and note reason
   │
   └─ [UPDATE RULE] or [ACCEPT]

6. VERSIONED DEPLOYMENT
   ├─ Set Rule Status: PRODUCTION
   ├─ Version: 1.0.0 (semantic)
   ├─ Deployment Target: Lab or Production
   ├─ [DEPLOY RULE]
   ├─ Monitor for:
   │  ├─ Rule performance (latency)
   │  ├─ Match rate
   │  ├─ False positive rate
   │  └─ Related detections (overlaps)
   │
   └─ Rule Live ✓

7. ONGOING MAINTENANCE
   ├─ Monitor Rule Performance:
   │  ├─ View metrics dashboard
   │  ├─ Alert latency per rule
   │  ├─ False positive feedback
   │  └─ Related cases (rule effectiveness)
   │
   ├─ Version Management:
   │  ├─ [CREATE NEW VERSION] (for updates)
   │  ├─ Changelog (what changed)
   │  ├─ [DEPLOY] (gradual or immediate)
   │  └─ Previous versions archived
   │
   ├─ Retirement:
   │  └─ If rule becomes obsolete or superseded:
   │     ├─ Set Status: DEPRECATED
   │     ├─ Mark successor rule
   │     ├─ Stop new deployments
   │     └─ Archive for historical reference
   │
   └─ Detection Gaps:
      ├─ If technique missed in field:
      │  ├─ Case linked to rule
      │  ├─ Create "Detection Gap" task
      │  ├─ [INVESTIGATE] → update rule
      │  └─ [RETEST] and [REDEPLOY]
      │
      └─ Record lesson learned

8. COVERAGE REPORTING
   ├─ View Coverage Dashboard:
   │  ├─ By Tactic (Reconnaissance, Execution, etc.)
   │  ├─ By Technique (T1234.001)
   │  ├─ Overall Coverage %
   │  └─ Red flags (missed techniques)
   │
   ├─ Export Coverage Report:
   │  ├─ Timestamp
   │  ├─ Technique matrix with detection status
   │  └─ Roadmap for gaps
   │
   └─ Present to Management
```

**Key Features Used**:
- Detection Coverage Matrix
- Rule Editor (Wazuh/Sigma)
- Unit Testing Framework
- False Positive Evaluation
- Peer Review Workflow
- Versioned Deployment
- Performance Monitoring
- Coverage Reporting

---

### 1.4 Incident Responder Workflow

#### Workflow: Containment and Evidence Preservation

```
LOGIN
  ↓
[RESPONDER DASHBOARD]
├─ Cases Requiring Containment
├─ High-Risk Alerts
├─ Approved Playbooks Pending Execution
└─ Recent Response Actions

CONTAINMENT WORKFLOW:

1. ASSESS CASE
   ├─ Review Case Information:
   │  ├─ Title, severity, confirmed impact
   │  ├─ Compromised assets
   │  ├─ Affected users
   │  └─ Estimated scope
   │
   └─ [REVIEW EVIDENCE] tab

2. EVIDENCE PRESERVATION
   ├─ Collect Evidence:
   │  ├─ System memory capture (if applicable)
   │  ├─ Disk snapshot (VMDK or image)
   │  ├─ Network logs (PCAP)
   │  ├─ Full event log export from SIEM
   │  └─ Application-specific logs
   │
   ├─ For each evidence file:
   │  ├─ Record acquisition method
   │  ├─ Timestamp
   │  ├─ Compute hash (SHA256)
   │  ├─ [UPLOAD TO CASE]
   │  └─ Evidence appears in case with integrity info
   │
   └─ Chain of Custody Logged Automatically:
      └─ Who collected, when, from where, hash

3. CONTAINMENT ACTIONS
   ├─ Select Containment Playbook:
   │  ├─ "Isolate Asset" (disconnect from network)
   │  ├─ "Kill Process" (terminate malicious process)
   │  ├─ "Block IP" (add to firewall rules)
   │  ├─ "Disable Account" (disable user account)
   │  └─ "Collect IOCs" (export indicators)
   │
   ├─ [EXECUTE PLAYBOOK]
   ├─ Review Scope:
   │  └─ What assets will be affected?
   │     (Must be lab/test environment)
   │
   ├─ Approval Gate (if required):
   │  ├─ System requests SOC Manager approval
   │  ├─ Manager reviews and [APPROVES] / [REJECTS]
   │  ├─ If approved, playbook executes
   │  └─ If rejected, reason recorded
   │
   ├─ Monitor Execution:
   │  ├─ Dry-run first (if option available)
   │  ├─ Verify results
   │  ├─ Check for side effects
   │  └─ Document outcome
   │
   └─ Actions Recorded in Audit Log:
      ├─ What action taken
      ├─ When
      ├─ Who authorized
      ├─ Outcome
      └─ Reversible? (Yes/No with rollback option)

4. DOCUMENTATION
   ├─ Update Case with:
   │  ├─ Containment actions taken
   │  ├─ Timeline of response
   │  ├─ Who performed actions
   │  ├─ Authorization approvals
   │  └─ Results and effectiveness
   │
   ├─ Lessons Learned:
   │  ├─ What worked well?
   │  ├─ What should change?
   │  ├─ Process improvements
   │  └─ Training needs
   │
   └─ [CLOSE CASE] or [UPDATE STATUS]
```

**Key Features Used**:
- Case Management with Evidence Tab
- Evidence Upload and Hashing
- Chain of Custody Tracking
- Containment Playbook Library
- Playbook Execution with Approval
- Audit Trail and Immutable Logging
- IOC Collection and Export

---

### 1.5 Threat Hunter Workflow

#### Workflow: Hypothesis-Driven Hunting

```
LOGIN
  ↓
[THREAT HUNTER DASHBOARD]
├─ Recent Hunt Queries
├─ Saved Hunt Notebooks
├─ Hunting Hypotheses (to investigate)
└─ Detection Gap Queue

THREAT HUNT WORKFLOW:

1. HYPOTHESIS FORMULATION
   ├─ Question: "What's the scope of this technique in our environment?"
   │  ├─ Example: "Are there other SSH brute-force attempts from different sources?"
   │  └─ Example: "Who's accessing /etc/shadow files?"
   │
   ├─ Expected Evidence:
   │  ├─ What telemetry should prove/disprove?
   │  └─ What fields to search?
   │
   └─ Time Window: Last 7/30/90 days?

2. QUERY BUILDING
   ├─ [NEW HUNT] or [USE SAVED TEMPLATE]
   ├─ Query Builder:
   │  ├─ Add Filters:
   │  │  ├─ Event Type (authentication, process, file)
   │  │  ├─ Source IP / Hostname
   │  │  ├─ User
   │  │  ├─ Rule Name
   │  │  ├─ Severity Range
   │  │  └─ Time Range
   │  │
   │  ├─ Advanced Search (raw query):
   │  │  ├─ Field operators: equals, contains, regex
   │  │  ├─ Boolean: AND, OR, NOT
   │  │  └─ Query suggestions
   │  │
   │  ├─ [PREVIEW] (first 100 results)
   │  ├─ Review results, adjust if needed
   │  └─ [RUN FULL HUNT]

3. RESULTS ANALYSIS
   ├─ Hunt Returns: 523 matches
   ├─ Results Tabs:
   │  ├─ Timeline: Events in chronological order
   │  ├─ Heatmap: Activity by hour/day
   │  ├─ Entity Breakdown: By IP, user, hostname
   │  └─ Distribution: By rule or event type
   │
   ├─ Drill Down:
   │  ├─ Click on time period to zoom
   │  ├─ Click on entity to filter
   │  ├─ Sort by timestamp, frequency, severity
   │  └─ [PIVOT] to related entities
   │
   ├─ Raw Event Viewer:
   │  ├─ Select individual event
   │  ├─ View parsed fields and raw log
   │  ├─ [EXTRACT IOC]
   │  └─ [ADD TO CASE]
   │
   └─ Export:
      ├─ [EXPORT CSV]
      ├─ [EXPORT JSON]
      └─ Use for external analysis

4. FINDINGS DOCUMENTATION
   ├─ Save Hunt:
   │  ├─ Name: "SSH Brute Force - Scope Assessment"
   │  ├─ Description: What did we learn?
   │  ├─ Query: Saved for reuse
   │  ├─ Findings: Documented
   │  └─ Related Cases/Alerts: Linked
   │
   ├─ Create Detection Candidate (if repeatable pattern found):
   │  ├─ [NEW DETECTION RULE]
   │  ├─ Pre-populate with hunting logic
   │  ├─ Route to detection engineer for development
   │  └─ Link back to hunt
   │
   └─ Notebook Entry:
      ├─ Add to Hunt Notebook
      ├─ Hypothesis, query, results, lessons
      ├─ Share with team
      └─ Reference for future hunts

5. RETROSPECTIVE VALIDATION
   ├─ Cross-reference hunt results with:
   │  ├─ Alerts generated (detection effectiveness)
   │  ├─ Cases created (analyst activity)
   │  └─ Threat intelligence (known bad actors)
   │
   ├─ If detection missed:
   │  └─ Flag as detection gap
   │     ├─ Create detection engineering task
   │     ├─ Attach hunting evidence
   │     └─ Route to detection engineer
   │
   └─ If detection overfires:
      └─ Flag for rule tuning
         ├─ High false positive rate
         ├─ Attach evidence
         └─ Route to detection engineer
```

**Key Features Used**:
- Hunt Query Builder
- Saved Queries and Templates
- Results Visualization and Drilling
- Entity Pivoting
- IOC Extraction
- Detection Candidate Creation
- Notebook Documentation
- Export for External Analysis

---

## 2. Navigation Architecture

### 2.1 Main Navigation Structure

```
┌─────────────────────────────────────────────────────────────────┐
│  SOC DETECTION LAB  [Search]  [? Help]  [⚙ Settings]  [👤 User]  │
├─────────────────────────────────────────────────────────────────┤
│  ├─ DASHBOARDS                                                  │
│  │  ├─ Executive Dashboard (KPIs, metrics)                      │
│  │  ├─ L1 Analyst Dashboard (priority queue)                    │
│  │  ├─ L2 Analyst Dashboard (cases, hunts)                      │
│  │  ├─ Detection Engineer Dashboard (coverage, rules)           │
│  │  └─ Health Dashboard (system status)                         │
│  │                                                              │
│  ├─ ALERTS                                                      │
│  │  ├─ Alert Queue (filterable list)                            │
│  │  ├─ Search Alerts (advanced)                                 │
│  │  └─ Alert Detail (investigation workspace)                   │
│  │                                                              │
│  ├─ CASES                                                       │
│  │  ├─ Cases List (all cases)                                   │
│  │  ├─ My Cases (assigned to current user)                      │
│  │  ├─ Create New Case                                          │
│  │  └─ Case Detail (timeline, evidence, tasks)                  │
│  │                                                              │
│  ├─ THREAT HUNTING                                              │
│  │  ├─ New Hunt (query builder)                                 │
│  │  ├─ Saved Hunts (library)                                    │
│  │  ├─ Hunt Results (visualization)                             │
│  │  ├─ Hunt Notebooks (documented hunts)                        │
│  │  └─ Detection Gaps (missed techniques)                       │
│  │                                                              │
│  ├─ DETECTIONS                                                  │
│  │  ├─ Detection Rules (library)                                │
│  │  ├─ New Rule (authoring)                                     │
│  │  ├─ Coverage Matrix (ATT&CK)                                 │
│  │  ├─ Rule Performance (metrics)                               │
│  │  └─ Test Cases (rule validation)                             │
│  │                                                              │
│  ├─ RESPONSE                                                    │
│  │  ├─ Playbooks (library)                                      │
│  │  ├─ Execution History (logs)                                 │
│  │  ├─ Pending Approvals (high-risk actions)                    │
│  │  └─ Automation Settings                                      │
│  │                                                              │
│  ├─ THREAT INTELLIGENCE                                         │
│  │  ├─ IOCs (indicators library)                                │
│  │  ├─ Reputation Lookup (VirusTotal, etc.)                     │
│  │  ├─ IOC Search (find related indicators)                     │
│  │  └─ Intelligence Feeds                                       │
│  │                                                              │
│  ├─ ASSETS                                                      │
│  │  ├─ Asset Inventory (all hosts)                              │
│  │  ├─ Asset Health (connectivity, telemetry)                   │
│  │  └─ Asset Detail (risks, services, activity)                 │
│  │                                                              │
│  ├─ REPORTING                                                   │
│  │  ├─ Incident Reports (generate)                              │
│  │  ├─ Executive Reports (KPIs, trends)                         │
│  │  ├─ Coverage Reports (ATT&CK)                                │
│  │  ├─ Report Templates                                         │
│  │  └─ Report Archive                                           │
│  │                                                              │
│  ├─ ADMINISTRATION                                              │
│  │  ├─ Users & Roles (RBAC management)                          │
│  │  ├─ Integrations (connected systems)                         │
│  │  ├─ Configuration (system settings)                          │
│  │  ├─ Health Monitoring (system status)                        │
│  │  ├─ Backup & Restore                                         │
│  │  └─ Audit Logs (all system activity)                         │
│  │                                                              │
│  └─ HELP & DOCUMENTATION                                        │
│     ├─ Getting Started                                          │
│     ├─ User Guide                                               │
│     ├─ API Documentation                                        │
│     ├─ Playbook Library                                         │
│     └─ Contact Support                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Contextual Navigation

#### From Alert
```
Alert Detail View
├─ [View Related Alerts]
├─ [View Timeline]
├─ [View Asset Details]
├─ [Search by Source IP]
├─ [Search by User]
├─ [Create Case]
├─ [Create Hunt]
├─ [Execute Playbook]
└─ [View Rule Details]
```

#### From Case
```
Case Detail View
├─ [View All Related Alerts]
├─ [View Timeline]
├─ [View Asset Details]
├─ [Search for Similar Cases]
├─ [Run Threat Hunt]
├─ [Execute Containment Playbook]
├─ [View Evidence]
├─ [Export Report]
└─ [Close Case]
```

#### From Rule
```
Detection Rule Detail View
├─ [Test Rule]
├─ [View Recent Matches]
├─ [View Coverage %]
├─ [Edit Rule]
├─ [Deploy New Version]
├─ [View Alerts from Rule]
├─ [View Related Detections]
└─ [Create Hunt from Rule Logic]
```

---

## 3. Feature Matrix by Role

| Feature | L1 | L2 | Eng | Resp | Hunter | Mgr | Admin |
|---|---|---|---|---|---|---|---|
| **Dashboard** | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| **Alert Queue** | ✓ | ✓ |  |  |  | ✓ |  |
| **Acknowledge Alert** | ✓ | ✓ |  |  |  |  |  |
| **Create Case** | ✓ | ✓ |  | ✓ | ✓ |  |  |
| **Case Management** | ✓ | ✓ |  | ✓ |  | ✓ |  |
| **Investigation Workspace** | ✓ | ✓ |  |  |  |  |  |
| **Evidence Management** |  | ✓ | ✓ | ✓ |  |  |  |
| **Threat Hunt** |  | ✓ |  |  | ✓ |  |  |
| **Create Hunt** |  | ✓ |  |  | ✓ |  |  |
| **Rule Editor** |  |  | ✓ |  |  |  |  |
| **Rule Testing** |  |  | ✓ |  |  |  |  |
| **Coverage Matrix** |  |  | ✓ |  |  | ✓ |  |
| **Execute Playbook (Low-Risk)** | ✓ | ✓ |  |  |  |  |  |
| **Execute Playbook (High-Risk)** |  |  |  | ✓ |  |  |  |
| **Approve Playbooks** |  | ✓ |  |  |  | ✓ |  |
| **IOC Management** |  | ✓ |  | ✓ | ✓ |  |  |
| **Asset Inventory** |  | ✓ |  |  | ✓ | ✓ |  |
| **Generate Reports** |  | ✓ |  |  |  | ✓ |  |
| **User Management** |  |  |  |  |  |  | ✓ |
| **System Configuration** |  |  |  |  |  |  | ✓ |
| **Audit Logs** |  |  |  |  |  | ✓ | ✓ |
| **View All Data (Read-Only)** |  |  |  |  |  |  | ✓ |

---

## 4. Key Feature Flows

### 4.1 Alert to Case to Response

```
ALERT TRIGGERED
  ↓
L1 ANALYST REVIEWS
  ├─ Acknowledge
  ├─ Investigate (2 clicks to raw event)
  └─ [DECISION]
      ├─ FALSE ALARM? → Close
      ├─ INVESTIGATE? → Create Case
      └─ LOW-RISK ACTION? → Execute Playbook
  ↓
[IF CASE CREATED]
L2 ANALYST INVESTIGATES
  ├─ Review timeline
  ├─ Analyze entities
  ├─ Hunt for scope
  └─ [ASSESSMENT]
      ├─ Root cause identified
      ├─ Impact scoped
      └─ Actions Required
  ↓
CONTAINMENT
  ├─ High-Risk? → Seek L2 approval
  ├─ Execute Playbook
  ├─ Preserve Evidence
  └─ [CLOSE CASE]
  ↓
REPORTING
  └─ Incident Report Generated
```

### 4.2 Detection Gap to New Rule to Deployment

```
DETECTION GAP IDENTIFIED
  ├─ In case analysis
  ├─ In threat hunt
  └─ In coverage review
  ↓
CREATE DETECTION TASK
  ├─ Technique: T1110.001
  ├─ Evidence attached
  └─ Assigned to Detection Engineer
  ↓
DETECTION ENGINEER
  ├─ Creates new rule (Wazuh/Sigma)
  ├─ Author test cases
  ├─ Run unit tests
  ├─ Evaluate false positives
  └─ Submit for peer review
  ↓
PEER REVIEW
  ├─ Reviewer checks logic
  ├─ Verifies test coverage
  ├─ Approves or requests changes
  └─ [IF APPROVED] Deploy
  ↓
PRODUCTION MONITORING
  ├─ Track rule performance
  ├─ Monitor false positive rate
  ├─ Watch for related cases
  └─ [IF EFFECTIVE] Archive for continuous use
```

### 4.3 Threat Hunt to Detection Candidate

```
HYPOTHESIS FORMULATED
  ├─ "Where else does this technique appear?"
  └─ "Is there a pattern we're missing?"
  ↓
HUNT EXECUTED
  ├─ Query built
  ├─ Results analyzed
  └─ Pattern identified (repeatable behavior)
  ↓
IF PATTERN REPEATABLE
  └─ [CREATE DETECTION CANDIDATE]
      ├─ Rule logic pre-populated from hunt
      ├─ Routed to Detection Engineer
      ├─ Linked back to hunt for reference
      └─ Enters rule development workflow
```

---

## 5. Data Visualization Patterns

### 5.1 Timeline Visualization

```
Timeline View (Incident Case):
═══════════════════════════════════════════════════════════════

14:00 |●
      | Attack Begins
      |
14:15 |  ●●●
      |  Failed SSH Logins (3)
      |
14:30 |      ●
      |      SSH Breach Successful
      |
14:45 |        ●●●●●
      |        Command Execution (5 events)
      |
15:00 |            ●
      |            Privilege Escalation
      |
15:15 |              ●
      |              Data Exfiltration Detected
      |
15:30 |                ●
      |                Alert Generated

Key: ● = Individual event, clickable for details
Hover: Shows alert summary + raw event
Filters: By entity (IP, user, hostname), by type
```

### 5.2 Coverage Matrix

```
MITRE ATT&CK Coverage Matrix

TACTICS:
        Recon  Initial  Exec   Persist  Priv    Defend   Disc   Lateral   Collect  Exfil   Impact
                Access        Esc      Evasion

T1592   ✓              Detected
T1592   ✓              Detected
T1201         ✓        Detected
T1040               ✓  Partially Detected (evidence weak)
T1485                                              ✓       ✓     Missed
T1234         ✓    ✓       ✓                       ✓       ✓     Detected
...

Colors:
  🟢 Green = Detected (rule exists, validated)
  🟡 Yellow = Partially Detected (some evidence)
  🔴 Red = Missed (no detection)
  ⚪ Grey = Not Tested
  ⬜ White = Retired

Summary:
  Total Techniques: 45
  Detected: 38 (84%)
  Partially: 4 (9%)
  Missed: 3 (7%)
```

---

## 6. Mobile / Responsive Considerations

### 6.1 Mobile Optimized Views

- **Alert Queue**: Simplified view (title, severity, assignee)
- **Case Quick View**: Summary + pending actions
- **Alert Detail**: Collapse/expand sections
- **Push Notifications**: High-severity alerts, pending approvals

### 6.2 Offline Capabilities (Future)

- Cached alert data for read-only browsing
- Queued actions submitted when online
- Local search on cached dataset

---

## 7. Search and Discovery

### 7.1 Global Search

```
[Search Box]

Supports:
- Alert Search: "SSH failed password 192.168.1.50"
- Case Search: "SSH brute force Sept 2024"
- IOC Search: "192.168.1.50" or "malware.domain.com"
- Rule Search: "brute force" or "T1110.001"
- Asset Search: "ubuntu-monitored" or "192.168.1.100"

Results Show:
- Type of result (alert, case, IOC, rule, asset)
- Relevance score
- Quick preview on hover
- [VIEW DETAILS] link
```

### 7.2 Saved Searches

- **By Role**: Pre-built searches for each role
- **By Technique**: Save hunts by ATT&CK technique
- **By Scenario**: Save searches for training/testing
- **Custom**: Users create and save custom searches

---

## 8. Notifications and Alerts

### 8.1 Alert Types

| Alert Type | Severity | Trigger | Action |
|---|---|---|---|
| **Critical Alert** | High | New critical-severity alert | Dashboard + email + Slack |
| **Escalation SLA** | Medium | Alert approaching SLA | Dashboard + email |
| **Pending Approval** | Medium | High-risk playbook awaiting approval | In-app + email |
| **Case Status Change** | Low | Case closed or reassigned | Dashboard + assigned user email |
| **Rule Deployment** | Low | New rule version deployed | Detection engineer email |

### 8.2 Notification Preferences

- Users configure channels: Dashboard, Email, Slack, SMS
- Users configure filter: By role, by severity, by topic

---

## 9. Accessibility Requirements

- **WCAG 2.1 Level AA** compliance
- Keyboard navigation throughout
- Screen reader support for all content
- High contrast mode available
- Readable font sizes and spacing
- No auto-playing audio/video

---

**Document Version**: 1.0  
**Status**: Target Architecture / Build Specification  
**Last Updated**: 2026-09-27
