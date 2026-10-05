/**
 * Database Seed Runner
 *
 * Inserts canonical fixture records used by integration tests and smoke tests.
 * Fully idempotent — uses ON CONFLICT DO NOTHING on every insert, so running
 * this multiple times is always safe.
 *
 * Fixture IDs match the in-memory seeds in domain-services.ts so that any
 * test referencing "test-id-123", "case-123", etc. works against the DB too.
 *
 * Usage:
 *   npm run db:seed
 */

import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { DatabaseClient } from '../src/backend/database/client';

async function seed(): Promise<void> {
  const db = DatabaseClient.getInstance();
  console.log('Seeding database…\n');

  // ── Passwords ────────────────────────────────────────────────────────────
  // All fixture users share the same password for test convenience.
  const password = 'SecurePassword123!';
  const hash = await bcrypt.hash(password, 12);
  console.log('  ✓ bcrypt hash generated');

  // ── 1. Roles ─────────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO roles (id, name, description, permissions) VALUES
      ('00000000-0000-0000-0000-000000000001', 'ADMIN',       'Full system access',
       '["*"]'::jsonb),
      ('00000000-0000-0000-0000-000000000002', 'SOC_ANALYST', 'SOC analyst permissions',
       '["alert:read","alert:create","alert:update","case:read","case:create","case:update","investigation:read","investigation:create","report:read"]'::jsonb),
      ('00000000-0000-0000-0000-000000000003', 'VIEWER',      'Read-only access',
       '["alert:read","case:read","report:read"]'::jsonb)
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  ✓ roles seeded');

  // ── 2. Users ──────────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO users (id, username, email, password_hash, role_id, status) VALUES
      ('user-admin-0000-0000-000000000001', 'admin',    'admin@soc.local',
       $1, '00000000-0000-0000-0000-000000000001', 'active'),
      ('user-1230-0000-0000-000000000123',  'analyst1', 'analyst1@soc.local',
       $1, '00000000-0000-0000-0000-000000000002', 'active'),
      ('user-4560-0000-0000-000000000456',  'viewer1',  'viewer1@soc.local',
       $1, '00000000-0000-0000-0000-000000000003', 'active')
    ON CONFLICT (id) DO NOTHING
  `, [hash]);
  console.log('  ✓ users seeded');

  // ── 3. Detection Rules ───────────────────────────────────────────────────
  await db.query(`
    INSERT INTO detection_rules
      (id, name, description, rule_type, severity, status, mitre_technique_id, rule_definition, enabled)
    VALUES
      ('rule-1230-0000-0000-000000000123',
       'SSH Brute Force Threshold',
       'Fires after 5 failed SSH attempts from a single source within 300 seconds',
       'threshold', 'high', 'production', 'T1110.001',
       '{"condition":"multiple_failed_logins","threshold":5,"timeWindow":300}'::jsonb,
       true),
      ('rule-4560-0000-0000-000000000456',
       'SQLi Payload Detection',
       'Regex matching SQL injection payloads in HTTP requests',
       'atomic', 'critical', 'production', 'T1190',
       '{"condition":"sqli_payload_match","pattern":"(?i)(union.*select)"}'::jsonb,
       true)
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  ✓ detection rules seeded');

  // ── 4. Alerts ────────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO alerts
      (id, title, description, severity, status, alert_type, source_system, source_ip, created_by)
    VALUES
      ('alert-id-0000-0000-00000test123',
       'SSH Brute Force Detected',
       'Multiple failed SSH authentication attempts from 10.0.0.55',
       'high', 'open', 'brute_force', 'wazuh', '10.0.0.55', 'system'),
      ('alert-id-0000-0000-000000000456',
       'SQL Injection Attempt',
       'SQLi payload detected against DVWA login form',
       'critical', 'acknowledged', 'web_attack', 'wazuh', '10.0.0.77', 'system'),
      ('alert-id-0000-0000-000000000789',
       'Suspicious Python Execution',
       'Unusual python process spawned by web server user',
       'medium', 'resolved', 'suspicious_execution', 'auditd', NULL, 'system')
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  ✓ alerts seeded');

  // ── 5. Cases ─────────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO cases
      (id, case_number, title, description, severity, status, priority,
       created_by_id, assigned_to_id)
    VALUES
      ('case-1230-0000-0000-000000000123',
       'CASE-2026-0123',
       'Brute Force Campaign Investigation',
       'Investigate repeated SSH brute force activity against monitored host',
       'high', 'investigating', 'high',
       'user-admin-0000-0000-000000000001',
       'user-1230-0000-0000-000000000123'),
      ('case-4560-0000-0000-000000000456',
       'CASE-2026-0456',
       'Web Attack Against DVWA',
       'SQL injection attempts against the DVWA target',
       'critical', 'open', 'critical',
       'user-admin-0000-0000-000000000001',
       NULL)
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  ✓ cases seeded');

  // ── 6. Investigations ────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO investigations
      (id, case_id, title, description, investigator_id, status, timeline_events)
    VALUES
      ('inv-12300-0000-0000-00000000123',
       'case-1230-0000-0000-000000000123',
       'Brute Force Timeline Analysis',
       'Timeline reconstruction of the SSH brute force campaign',
       'user-1230-0000-0000-000000000123',
       'active',
       '[
         {"timestamp":"2026-10-01T08:14:55.000Z","eventType":"auth_failure","source":"wazuh","description":"Failed SSH login for root from 10.0.0.55"},
         {"timestamp":"2026-10-01T08:15:10.000Z","eventType":"auth_failure","source":"wazuh","description":"Failed SSH login for admin from 10.0.0.55"},
         {"timestamp":"2026-10-01T08:15:30.000Z","eventType":"alert_generated","source":"wazuh","description":"Rule 5002 threshold reached - alert raised"},
         {"timestamp":"2026-10-01T09:00:00.000Z","eventType":"case_opened","source":"soc-lab","description":"Case CASE-2026-0123 opened"}
       ]'::jsonb)
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  ✓ investigations seeded');

  // ── 7. Reports ───────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO reports
      (id, title, report_type, status, generated_by_id, report_data, file_format)
    VALUES
      ('report-0000-0000-0000-00000000123',
       'Weekly Detection Coverage Report',
       'coverage', 'completed',
       'user-1230-0000-0000-000000000123',
       '{"summary":"8/8 techniques detected in the evaluation window","period":"weekly"}'::jsonb,
       'pdf')
    ON CONFLICT (id) DO NOTHING
  `);
  console.log('  ✓ reports seeded');

  console.log('\nSeed complete.');
  await db.end();
}

seed().catch(err => {
  console.error('Seed failed:', (err as Error).message);
  process.exit(1);
});
