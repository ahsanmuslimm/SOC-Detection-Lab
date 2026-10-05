-- ============================================================================
-- Database Migrations - Phase 1, Week 2
-- Production Schema for SOC Detection Lab
-- ============================================================================
-- Migration: 001_init_schema.sql
-- Purpose: Initialize core database schema with all required tables
-- Tables: 15 core entities for SOC Detection Lab platform
-- IF NOT EXISTS guards make this idempotent (safe to re-run)
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- 1. ROLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);

-- ============================================================================
-- 2. USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  status VARCHAR(50) DEFAULT 'active',
  last_login TIMESTAMP,
  failed_login_attempts INT DEFAULT 0,
  locked_until TIMESTAMP,
  profile_data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================================
-- 3. USER SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_token_hash ON user_sessions(token_hash);

-- ============================================================================
-- 4. AUDIT LOG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  ip_address INET,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);

-- ============================================================================
-- 5. DETECTION RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS detection_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  rule_type VARCHAR(100) NOT NULL,
  mitre_technique_id VARCHAR(50),
  rule_definition JSONB NOT NULL DEFAULT '{}'::jsonb,
  test_data JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  enabled BOOLEAN DEFAULT TRUE,
  false_positive_count INT DEFAULT 0,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rules_status ON detection_rules(status);
CREATE INDEX IF NOT EXISTS idx_rules_severity ON detection_rules(severity);
CREATE INDEX IF NOT EXISTS idx_rules_created_at ON detection_rules(created_at);
CREATE INDEX IF NOT EXISTS idx_rules_enabled ON detection_rules(enabled);

-- ============================================================================
-- 6. DETECTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS detections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID NOT NULL REFERENCES detection_rules(id) ON DELETE CASCADE,
  source_ip INET,
  destination_ip INET,
  source_port INT,
  destination_port INT,
  protocol VARCHAR(50),
  payload_hash VARCHAR(255),
  matched_data JSONB DEFAULT '{}'::jsonb,
  severity VARCHAR(50),
  status VARCHAR(50) DEFAULT 'new',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_detections_rule_id ON detections(rule_id);
CREATE INDEX IF NOT EXISTS idx_detections_source_ip ON detections(source_ip);
CREATE INDEX IF NOT EXISTS idx_detections_destination_ip ON detections(destination_ip);
CREATE INDEX IF NOT EXISTS idx_detections_status ON detections(status);
CREATE INDEX IF NOT EXISTS idx_detections_created_at ON detections(created_at);

-- ============================================================================
-- 7. ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  alert_type VARCHAR(100) NOT NULL,
  source_system VARCHAR(100),
  source_ip VARCHAR(50),
  rule_id VARCHAR(100),
  detection_ids UUID[] DEFAULT '{}',
  assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
  closed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at TIMESTAMP,
  closed_at TIMESTAMP,
  created_by VARCHAR(255) DEFAULT 'system',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_assigned_to ON alerts(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);

-- ============================================================================
-- 8. CASES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_number VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'open',
  priority VARCHAR(50) DEFAULT 'medium',
  classification VARCHAR(100),
  assigned_to_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  closed_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  alert_ids UUID[] DEFAULT '{}',
  tags VARCHAR(100)[] DEFAULT '{}',
  sla_breached BOOLEAN DEFAULT FALSE,
  due_date TIMESTAMP,
  closed_at TIMESTAMP,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_severity ON cases(severity);
CREATE INDEX IF NOT EXISTS idx_cases_assigned_to ON cases(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);

-- ============================================================================
-- 9. INVESTIGATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS investigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  investigator_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'active',
  priority INT DEFAULT 1,
  evidence_ids UUID[] DEFAULT '{}',
  timeline_events JSONB DEFAULT '[]'::jsonb,
  findings TEXT,
  recommendation TEXT,
  closure_code VARCHAR(100),
  closure_notes TEXT,
  closed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_investigations_case_id ON investigations(case_id);
CREATE INDEX IF NOT EXISTS idx_investigations_investigator_id ON investigations(investigator_id);
CREATE INDEX IF NOT EXISTS idx_investigations_status ON investigations(status);

-- ============================================================================
-- 10. EVIDENCE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
  investigation_id UUID REFERENCES investigations(id) ON DELETE SET NULL,
  evidence_type VARCHAR(100) NOT NULL,
  source_system VARCHAR(100),
  description TEXT,
  file_hash VARCHAR(255),
  file_size INT,
  storage_location VARCHAR(500),
  collected_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  chain_of_custody JSONB DEFAULT '[]'::jsonb,
  is_sensitive BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_case_id ON evidence(case_id);
CREATE INDEX IF NOT EXISTS idx_evidence_investigation_id ON evidence(investigation_id);
CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(evidence_type);

-- ============================================================================
-- 11. REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  generated_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  case_ids UUID[] DEFAULT '{}',
  alert_ids UUID[] DEFAULT '{}',
  date_range_start TIMESTAMP,
  date_range_end TIMESTAMP,
  report_data JSONB,
  file_format VARCHAR(50),
  file_location VARCHAR(500),
  distributed_to VARCHAR(100)[] DEFAULT '{}',
  distributed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at);

-- ============================================================================
-- 12. INTEGRATION_LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_name VARCHAR(100) NOT NULL,
  integration_type VARCHAR(100),
  event_type VARCHAR(100),
  status VARCHAR(50) DEFAULT 'success',
  records_processed INT,
  error_message TEXT,
  payload_sample JSONB,
  response_time_ms INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_integrations_type ON integration_logs(integration_type);
CREATE INDEX IF NOT EXISTS idx_integrations_created_at ON integration_logs(created_at);

-- ============================================================================
-- 13. NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  notification_type VARCHAR(100),
  related_id VARCHAR(255),
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- ============================================================================
-- 14. SYSTEM_CONFIG TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS system_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key VARCHAR(255) UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  is_secret BOOLEAN DEFAULT FALSE,
  modified_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_config_key ON system_config(config_key);

-- ============================================================================
-- 15. METRICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name VARCHAR(100) NOT NULL,
  metric_value NUMERIC(12, 2),
  metric_unit VARCHAR(50),
  metric_type VARCHAR(50),
  tags JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_metrics_created_at ON metrics(created_at);

-- ============================================================================
-- TRIGGERS (CREATE OR REPLACE — always idempotent)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_update_timestamp ON users;
CREATE TRIGGER user_update_timestamp
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_user_timestamp();

CREATE OR REPLACE FUNCTION update_case_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS case_update_timestamp ON cases;
CREATE TRIGGER case_update_timestamp
  BEFORE UPDATE ON cases
  FOR EACH ROW EXECUTE FUNCTION update_case_timestamp();

CREATE OR REPLACE FUNCTION update_alert_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS alert_update_timestamp ON alerts;
CREATE TRIGGER alert_update_timestamp
  BEFORE UPDATE ON alerts
  FOR EACH ROW EXECUTE FUNCTION update_alert_timestamp();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE roles IS 'Role definitions for RBAC system';
COMMENT ON TABLE users IS 'User accounts with authentication credentials';
COMMENT ON TABLE audit_logs IS 'Immutable audit trail of all system activities';
COMMENT ON TABLE detection_rules IS 'Threat detection rules';
COMMENT ON TABLE detections IS 'Individual detection events from rules';
COMMENT ON TABLE alerts IS 'Aggregated alerts for SOC team action';
COMMENT ON TABLE cases IS 'Investigation cases for incident response';
COMMENT ON TABLE investigations IS 'Investigation timelines with evidence';
COMMENT ON TABLE evidence IS 'Evidence artifacts linked to cases';
COMMENT ON TABLE reports IS 'Generated incident and threat reports';
COMMENT ON TABLE integration_logs IS 'External system integration logs';
COMMENT ON TABLE notifications IS 'User notifications';
COMMENT ON TABLE system_config IS 'System configuration and feature flags';
COMMENT ON TABLE metrics IS 'System metrics and performance data';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
