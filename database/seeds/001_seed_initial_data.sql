-- ============================================================================
-- Database Seed Data - Phase 1, Week 2
-- Initial data for SOC Detection Lab testing and demo
-- ============================================================================

-- ============================================================================
-- 1. INSERT ROLES
-- ============================================================================

INSERT INTO roles (name, description, permissions) VALUES
  (
    'SOC_ANALYST',
    'Security Operations Center Analyst - Monitors and responds to alerts',
    '["alert:read", "alert:acknowledge", "alert:comment", "case:read", "case:create", "case:comment", "investigation:read", "investigation:comment", "report:read"]'::jsonb
  ),
  (
    'DETECTION_ENGINEER',
    'Develops and maintains detection rules',
    '["rule:create", "rule:read", "rule:edit", "rule:test", "rule:deploy", "rule:delete", "alert:read", "case:read", "investigation:read"]'::jsonb
  ),
  (
    'SOC_MANAGER',
    'SOC Team Manager - Oversees operations',
    '["alert:read", "alert:acknowledge", "case:read", "case:create", "case:assign", "case:close", "investigation:read", "investigation:create", "report:read", "report:generate", "user:read"]'::jsonb
  ),
  (
    'ADMIN',
    'System Administrator - Full platform access',
    '["*"]'::jsonb
  ),
  (
    'VIEWER',
    'Read-only access for stakeholders',
    '["alert:read", "case:read", "investigation:read", "report:read"]'::jsonb
  );

-- ============================================================================
-- 2. INSERT USERS
-- ============================================================================

-- Password hashes (bcrypt hashed 'SecurePassword123!')
-- For production, these should be changed immediately
INSERT INTO users (username, email, password_hash, role_id, status, profile_data) VALUES
  (
    'admin_user',
    'admin@soc.lab',
    '$2a$12$KIXxPfQrVyVIWZPurzx.TeBp5f/qzA97Aqe1xN6ZvZeN/VNSkkE.y',
    (SELECT id FROM roles WHERE name = 'ADMIN'),
    'active',
    '{"full_name": "Administrator", "department": "IT", "phone": "+1-555-0100"}'::jsonb
  ),
  (
    'alice_analyst',
    'alice.analyst@soc.lab',
    '$2a$12$KIXxPfQrVyVIWZPurzx.TeBp5f/qzA97Aqe1xN6ZvZeN/VNSkkE.y',
    (SELECT id FROM roles WHERE name = 'SOC_ANALYST'),
    'active',
    '{"full_name": "Alice Johnson", "department": "SOC", "phone": "+1-555-0101"}'::jsonb
  ),
  (
    'bob_analyst',
    'bob.analyst@soc.lab',
    '$2a$12$KIXxPfQrVyVIWZPurzx.TeBp5f/qzA97Aqe1xN6ZvZeN/VNSkkE.y',
    (SELECT id FROM roles WHERE name = 'SOC_ANALYST'),
    'active',
    '{"full_name": "Bob Smith", "department": "SOC", "phone": "+1-555-0102"}'::jsonb
  ),
  (
    'carol_engineer',
    'carol.engineer@soc.lab',
    '$2a$12$KIXxPfQrVyVIWZPurzx.TeBp5f/qzA97Aqe1xN6ZvZeN/VNSkkE.y',
    (SELECT id FROM roles WHERE name = 'DETECTION_ENGINEER'),
    'active',
    '{"full_name": "Carol Williams", "department": "Detection Engineering", "phone": "+1-555-0103"}'::jsonb
  ),
  (
    'dave_manager',
    'dave.manager@soc.lab',
    '$2a$12$KIXxPfQrVyVIWZPurzx.TeBp5f/qzA97Aqe1xN6ZvZeN/VNSkkE.y',
    (SELECT id FROM roles WHERE name = 'SOC_MANAGER'),
    'active',
    '{"full_name": "Dave Thompson", "department": "SOC", "phone": "+1-555-0104"}'::jsonb
  ),
  (
    'eve_viewer',
    'eve.viewer@soc.lab',
    '$2a$12$KIXxPfQrVyVIWZPurzx.TeBp5f/qzA97Aqe1xN6ZvZeN/VNSkkE.y',
    (SELECT id FROM roles WHERE name = 'VIEWER'),
    'active',
    '{"full_name": "Eve Davis", "department": "Executive", "phone": "+1-555-0105"}'::jsonb
  );

-- ============================================================================
-- 3. INSERT DETECTION RULES
-- ============================================================================

INSERT INTO detection_rules (name, description, severity, status, rule_type, rule_definition, created_by_id) VALUES
  (
    'SSH Brute Force Attack',
    'Detects multiple failed SSH login attempts from single source',
    'high',
    'active',
    'signature',
    '{
      "detection_type": "threshold",
      "source": "syslog",
      "threshold": 10,
      "time_window": 300,
      "field": "failed_auth_count"
    }'::jsonb,
    (SELECT id FROM users WHERE username = 'carol_engineer')
  ),
  (
    'SQL Injection Attempt',
    'Detects SQL injection patterns in web application logs',
    'critical',
    'active',
    'signature',
    '{
      "detection_type": "pattern_match",
      "source": "waf_logs",
      "patterns": ["union select", "or 1=1", "drop table"]
    }'::jsonb,
    (SELECT id FROM users WHERE username = 'carol_engineer')
  ),
  (
    'Ransomware File Behavior',
    'Detects ransomware-like file access patterns',
    'critical',
    'active',
    'behavioral',
    '{
      "detection_type": "anomaly",
      "source": "endpoint_logs",
      "behaviors": ["rapid_file_encryption", "file_deletion", "registry_modification"]
    }'::jsonb,
    (SELECT id FROM users WHERE username = 'carol_engineer')
  ),
  (
    'Privilege Escalation',
    'Detects attempts to escalate privileges',
    'high',
    'active',
    'signature',
    '{
      "detection_type": "pattern_match",
      "source": "system_logs",
      "patterns": ["sudo", "elevation", "runas", "admin"]
    }'::jsonb,
    (SELECT id FROM users WHERE username = 'carol_engineer')
  ),
  (
    'Data Exfiltration',
    'Detects large outbound data transfers to suspicious IPs',
    'high',
    'active',
    'behavioral',
    '{
      "detection_type": "threshold",
      "source": "network_flow",
      "threshold": 5368709120,
      "time_window": 3600,
      "field": "bytes_out"
    }'::jsonb,
    (SELECT id FROM users WHERE username = 'carol_engineer')
  );

-- ============================================================================
-- 4. INSERT SAMPLE DETECTIONS
-- ============================================================================

INSERT INTO detections (rule_id, source_ip, destination_ip, source_port, destination_port, protocol, severity, status) VALUES
  (
    (SELECT id FROM detection_rules WHERE name = 'SSH Brute Force Attack'),
    '192.168.1.50'::inet,
    '10.0.0.100'::inet,
    45322,
    22,
    'TCP',
    'high',
    'new'
  ),
  (
    (SELECT id FROM detection_rules WHERE name = 'SQL Injection Attempt'),
    '203.0.113.45'::inet,
    '10.0.0.200'::inet,
    54321,
    443,
    'TCP',
    'critical',
    'new'
  ),
  (
    (SELECT id FROM detection_rules WHERE name = 'Privilege Escalation'),
    '10.0.0.150'::inet,
    '10.0.0.100'::inet,
    NULL,
    NULL,
    'LOCAL',
    'high',
    'new'
  );

-- ============================================================================
-- 5. INSERT SAMPLE ALERTS
-- ============================================================================

INSERT INTO alerts (title, description, severity, status, alert_type, source_system, detection_ids, assigned_to_id) VALUES
  (
    'Multiple SSH Login Failures from 192.168.1.50',
    'Detected 15 failed SSH login attempts against corporate firewall in the last 5 minutes. Source IP appears to be from external network.',
    'high',
    'open',
    'network_attack',
    'IDS',
    ARRAY[(SELECT id FROM detections WHERE source_ip = '192.168.1.50'::inet)],
    (SELECT id FROM users WHERE username = 'alice_analyst')
  ),
  (
    'Potential SQL Injection Attack Detected',
    'Web Application Firewall detected SQL injection patterns in HTTP requests. Payloads include common SQL injection techniques (UNION SELECT, OR 1=1).',
    'critical',
    'open',
    'web_attack',
    'WAF',
    ARRAY[(SELECT id FROM detections WHERE source_ip = '203.0.113.45'::inet)],
    (SELECT id FROM users WHERE username = 'bob_analyst')
  ),
  (
    'Suspicious Privilege Escalation Attempt',
    'System logs indicate unauthorized attempt to escalate privileges on CORP-SERVER-01. User context: service account.',
    'high',
    'acknowledged',
    'endpoint_threat',
    'EDR',
    ARRAY[(SELECT id FROM detections WHERE protocol = 'LOCAL')],
    (SELECT id FROM users WHERE username = 'alice_analyst')
  );

-- ============================================================================
-- 6. INSERT SAMPLE CASES
-- ============================================================================

INSERT INTO cases (case_number, title, description, severity, status, classification, assigned_to_id, created_by_id) VALUES
  (
    'INC-2024-001',
    'SSH Brute Force Campaign Against Corporate Infrastructure',
    'Coordinated brute force attack targeting SSH services. Multiple IPs involved. Potential nation-state activity.',
    'high',
    'investigating',
    'unauthorized_access',
    (SELECT id FROM users WHERE username = 'alice_analyst'),
    (SELECT id FROM users WHERE username = 'dave_manager')
  ),
  (
    'INC-2024-002',
    'SQL Injection Vulnerability in Web Portal',
    'SQL injection attack discovered in customer-facing web application. Potential data breach. Database tables may have been accessed.',
    'critical',
    'open',
    'data_exposure',
    (SELECT id FROM users WHERE username = 'bob_analyst'),
    (SELECT id FROM users WHERE username = 'dave_manager')
  ),
  (
    'INC-2024-003',
    'Unauthorized Privilege Escalation - CORP-SERVER-01',
    'Service account attempted privilege escalation. Escalation was blocked by EDR. Investigation underway.',
    'medium',
    'resolved',
    'unauthorized_access',
    (SELECT id FROM users WHERE username = 'alice_analyst'),
    (SELECT id FROM users WHERE username = 'dave_manager')
  );

-- ============================================================================
-- 7. INSERT SYSTEM CONFIGURATION
-- ============================================================================

INSERT INTO system_config (config_key, config_value, description, is_secret) VALUES
  (
    'alert_severity_thresholds',
    '{"critical": 100, "high": 75, "medium": 50, "low": 25}'::jsonb,
    'Threshold scores for alert severity levels',
    FALSE
  ),
  (
    'retention_policy',
    '{"alerts": 365, "logs": 730, "cases": 2555}'::jsonb,
    'Data retention policy (days) for different data types',
    FALSE
  ),
  (
    'sla_response_times',
    '{"critical": 30, "high": 120, "medium": 480, "low": 1440}'::jsonb,
    'SLA response times in minutes by severity',
    FALSE
  ),
  (
    'email_notifications_enabled',
    'true'::jsonb,
    'Enable email notifications for alerts',
    FALSE
  ),
  (
    'slack_webhook_url',
    '""'::jsonb,
    'Slack webhook URL for alert notifications',
    TRUE
  );

-- ============================================================================
-- 8. STATISTICS AND SUMMARY
-- ============================================================================

SELECT 
  (SELECT COUNT(*) FROM roles) as total_roles,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM detection_rules) as total_rules,
  (SELECT COUNT(*) FROM detections) as total_detections,
  (SELECT COUNT(*) FROM alerts) as total_alerts,
  (SELECT COUNT(*) FROM cases) as total_cases,
  NOW() as seed_timestamp;

-- ============================================================================
-- END OF SEED DATA
-- ============================================================================
