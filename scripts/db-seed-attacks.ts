/**
 * Realistic Attack Scenarios Seed
 *
 * Adds 20 real-world attack scenarios covering:
 * - Network attacks
 * - Web application attacks
 * - Endpoint threats
 * - Insider threats
 * - Ransomware / malware
 * - Lateral movement
 *
 * Usage: npx tsx scripts/db-seed-attacks.ts
 */

import 'dotenv/config';
import { DatabaseClient } from '../src/backend/database/client';

async function seedAttacks(): Promise<void> {
  const db = DatabaseClient.getInstance();
  console.log('Seeding realistic attack scenarios...\n');

  // ── Detection Rules ─────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO detection_rules (name, description, rule_type, severity, status, mitre_technique_id, rule_definition, enabled)
    VALUES
      ('Ransomware File Extension Change',
       'Mass file extension changes detected (.locked, .encrypted, .crypto)',
       'behavioral', 'critical', 'production', 'T1486',
       '{"condition":"mass_file_extension_change","threshold":100,"timeWindow":60}'::jsonb, true),

      ('Mimikatz Credential Dump',
       'LSASS memory access pattern matching Mimikatz tool signature',
       'signature', 'critical', 'production', 'T1003.001',
       '{"condition":"lsass_access","process":"mimikatz","pattern":"sekurlsa"}'::jsonb, true),

      ('PowerShell Encoded Command',
       'PowerShell executed with Base64 encoded payload - common malware delivery',
       'signature', 'high', 'production', 'T1059.001',
       '{"condition":"powershell_encoded","pattern":"-EncodedCommand|-enc"}'::jsonb, true),

      ('Port Scan Detected',
       'Sequential port scanning from single source IP',
       'threshold', 'medium', 'production', 'T1046',
       '{"condition":"port_scan","threshold":100,"timeWindow":30}'::jsonb, true),

      ('DNS Tunneling Detected',
       'Unusually large DNS queries indicating data exfiltration via DNS',
       'anomaly', 'high', 'production', 'T1071.004',
       '{"condition":"dns_query_size","threshold":512,"timeWindow":300}'::jsonb, true)

    ON CONFLICT DO NOTHING
  `);
  console.log('  ✓ Detection rules seeded (5 new rules)');

  // Fetch user IDs for assignments
  const users = await db.query<{ id: string; email: string }>(
    `SELECT id, email FROM users WHERE email IN ('admin@soc.local','analyst1@soc.local')`
  );
  const adminId   = users.find(u => u.email === 'admin@soc.local')?.id   ?? null;
  const analystId = users.find(u => u.email === 'analyst1@soc.local')?.id ?? null;

  // ── 20 Alerts ───────────────────────────────────────────────────────────────
  await db.query(`
    INSERT INTO alerts (title, description, severity, status, alert_type, source_system, source_ip, created_by, created_at)
    VALUES
      -- Ransomware
      ('Ransomware Activity Detected on FILESERVER-01',
       'Over 500 files encrypted within 2 minutes on FILESERVER-01. Extensions changed to .locked. Possible WannaCry variant.',
       'critical', 'open', 'ransomware', 'wazuh', '192.168.1.45', 'system',
       NOW() - INTERVAL '2 hours'),

      -- Credential Theft
      ('Mimikatz Execution Detected',
       'LSASS memory dump attempted on DC-01 using Mimikatz. Credential theft in progress.',
       'critical', 'investigating', 'credential_theft', 'wazuh', '192.168.1.12', 'system',
       NOW() - INTERVAL '4 hours'),

      -- Lateral Movement
      ('Lateral Movement via Pass-the-Hash',
       'Suspicious authentication using NTLM hash detected across 6 workstations from single source.',
       'critical', 'open', 'lateral_movement', 'wazuh', '192.168.1.12', 'system',
       NOW() - INTERVAL '3 hours'),

      -- PowerShell Attack
      ('Malicious PowerShell Payload Executed',
       'Base64 encoded PowerShell command executed on WKS-042. Downloads and runs remote script from 185.220.101.55.',
       'high', 'open', 'malware_execution', 'wazuh', '192.168.1.88', 'system',
       NOW() - INTERVAL '1 hour'),

      -- Port Scan
      ('Network Port Scan from Internal Host',
       'WKS-019 scanned 1,024 ports across subnet 192.168.1.0/24 in under 60 seconds. Possible compromised endpoint.',
       'high', 'acknowledged', 'reconnaissance', 'suricata', '192.168.1.19', 'system',
       NOW() - INTERVAL '6 hours'),

      -- Data Exfiltration
      ('Large Data Transfer to External IP',
       '4.2GB transferred to 185.220.101.55 (known Tor exit node) over 3 hours via HTTPS.',
       'critical', 'investigating', 'data_exfiltration', 'zeek', '192.168.1.34', 'system',
       NOW() - INTERVAL '5 hours'),

      -- DNS Tunneling
      ('DNS Tunneling Detected',
       'Abnormally large DNS TXT queries to domain tunnel.attacker.xyz. Possible C2 communication.',
       'high', 'open', 'command_and_control', 'zeek', '192.168.1.67', 'system',
       NOW() - INTERVAL '30 minutes'),

      -- Phishing
      ('Phishing Email with Macro Payload Opened',
       'User opened Invoice_Q4_2026.xlsm containing malicious VBA macro. Macro executed and spawned cmd.exe.',
       'high', 'open', 'phishing', 'email_gateway', '192.168.1.23', 'system',
       NOW() - INTERVAL '45 minutes'),

      -- Privilege Escalation
      ('Privilege Escalation via Token Impersonation',
       'Low-privileged process escalated to SYSTEM using token impersonation on WKS-007.',
       'critical', 'open', 'privilege_escalation', 'wazuh', '192.168.1.7', 'system',
       NOW() - INTERVAL '2 hours'),

      -- Web Shell
      ('Web Shell Uploaded to Web Server',
       'PHP web shell (c99.php) uploaded to /var/www/html/uploads/ on WEB-01. Remote code execution possible.',
       'critical', 'resolved', 'web_attack', 'wazuh', '10.0.0.44', 'system',
       NOW() - INTERVAL '1 day'),

      -- RDP Brute Force
      ('RDP Brute Force Attack',
       '847 failed RDP authentication attempts against SRV-DC01 from 185.156.72.11 in 10 minutes.',
       'high', 'acknowledged', 'brute_force', 'wazuh', '185.156.72.11', 'system',
       NOW() - INTERVAL '3 hours'),

      -- Insider Threat
      ('Insider Threat - Bulk Data Download',
       'Employee john.smith downloaded 15,000 customer records at 2:47 AM outside normal working hours.',
       'high', 'investigating', 'insider_threat', 'dlp', '192.168.1.99', 'system',
       NOW() - INTERVAL '8 hours'),

      -- Cryptominer
      ('Cryptominer Detected on Server',
       'XMRig cryptocurrency miner detected running on APP-SERVER-03. CPU usage at 98%.',
       'medium', 'resolved', 'malware', 'wazuh', '192.168.1.130', 'system',
       NOW() - INTERVAL '2 days'),

      -- Zero Day
      ('Log4Shell Exploitation Attempt',
       'JNDI injection string detected in HTTP User-Agent header targeting LOG4J vulnerability (CVE-2021-44228).',
       'critical', 'resolved', 'exploitation', 'suricata', '45.142.212.100', 'system',
       NOW() - INTERVAL '3 days'),

      -- Account Takeover
      ('Account Takeover - Impossible Travel',
       'User admin@company.com logged in from New York then Lagos within 12 minutes. Impossible travel detected.',
       'high', 'resolved', 'account_compromise', 'azure_ad', '102.89.23.145', 'system',
       NOW() - INTERVAL '1 day'),

      -- DDoS
      ('DDoS Attack on Public Web Server',
       'Volumetric DDoS attack — 450,000 requests/second targeting WEB-DMZ-01 from botnet (2,400+ source IPs).',
       'high', 'resolved', 'ddos', 'cloudflare', '0.0.0.0', 'system',
       NOW() - INTERVAL '4 days'),

      -- Supply Chain
      ('Suspicious NPM Package Execution',
       'Recently installed npm package "helper-utils@2.1.1" executing outbound connections to C2 server.',
       'medium', 'investigating', 'supply_chain', 'wazuh', '192.168.1.55', 'system',
       NOW() - INTERVAL '12 hours'),

      -- Persistence
      ('Malicious Scheduled Task Created',
       'New scheduled task "WindowsUpdate_Helper" created running Base64 PowerShell every 15 minutes.',
       'high', 'open', 'persistence', 'wazuh', '192.168.1.77', 'system',
       NOW() - INTERVAL '5 hours'),

      -- Kerberoasting
      ('Kerberoasting Attack Detected',
       'Unusual number of Kerberos TGS requests for service accounts detected. Password cracking likely.',
       'high', 'open', 'credential_theft', 'wazuh', '192.168.1.12', 'system',
       NOW() - INTERVAL '7 hours'),

      -- Zero-day Exploit
      ('Zero-Day Buffer Overflow Exploit',
       'Stack-based buffer overflow detected in custom ERP application. Possible remote code execution attempt.',
       'critical', 'open', 'exploitation', 'suricata', '91.219.236.14', 'system',
       NOW() - INTERVAL '20 minutes')

    ON CONFLICT DO NOTHING
  `);
  console.log('  ✓ 20 realistic attack alerts seeded');

  // ── Cases for the critical alerts ───────────────────────────────────────────
  await db.query(`
    INSERT INTO cases (case_number, title, description, severity, status, priority, created_by_id, assigned_to_id, created_at)
    VALUES
      ('CASE-2026-0003',
       'Ransomware Incident Response - FILESERVER-01',
       'Active ransomware infection on FILESERVER-01. File encryption in progress. Immediate containment required.',
       'critical', 'investigating', 'critical', $1, $2,
       NOW() - INTERVAL '2 hours'),

      ('CASE-2026-0004',
       'Credential Theft + Lateral Movement Investigation',
       'Mimikatz detected on DC-01 followed by pass-the-hash across 6 workstations. Full domain compromise possible.',
       'critical', 'investigating', 'critical', $1, $2,
       NOW() - INTERVAL '3 hours'),

      ('CASE-2026-0005',
       'Data Exfiltration to Tor Exit Node',
       '4.2GB of data transferred to known Tor exit node. Possible insider threat or compromised endpoint.',
       'critical', 'open', 'high', $1, NULL,
       NOW() - INTERVAL '5 hours'),

      ('CASE-2026-0006',
       'Web Shell on WEB-01 - Remediated',
       'PHP web shell found and removed. Root cause analysis underway. Access logs reviewed.',
       'high', 'resolved', 'high', $1, $2,
       NOW() - INTERVAL '1 day')

    ON CONFLICT (case_number) DO NOTHING
  `, [adminId, analystId]);
  console.log('  ✓ 4 incident cases seeded');

  // ── Investigations ───────────────────────────────────────────────────────────
  const cases = await db.query<{ id: string; case_number: string }>(
    `SELECT id, case_number FROM cases WHERE case_number IN ('CASE-2026-0003','CASE-2026-0004')`
  );

  for (const c of cases) {
    const timeline = c.case_number === 'CASE-2026-0003' ? [
      { timestamp: new Date(Date.now() - 7200000).toISOString(), eventType: 'alert_generated', source: 'wazuh', description: 'Mass file encryption detected on FILESERVER-01' },
      { timestamp: new Date(Date.now() - 7100000).toISOString(), eventType: 'case_opened', source: 'soc-lab', description: 'Incident case opened - P1 critical' },
      { timestamp: new Date(Date.now() - 7000000).toISOString(), eventType: 'containment', source: 'analyst', description: 'FILESERVER-01 isolated from network' },
      { timestamp: new Date(Date.now() - 6800000).toISOString(), eventType: 'evidence_collected', source: 'analyst', description: 'Memory dump and disk image acquired' },
      { timestamp: new Date(Date.now() - 6600000).toISOString(), eventType: 'finding', source: 'analyst', description: 'Ransomware identified as LockBit 3.0 variant' },
    ] : [
      { timestamp: new Date(Date.now() - 14400000).toISOString(), eventType: 'alert_generated', source: 'wazuh', description: 'Mimikatz detected on DC-01' },
      { timestamp: new Date(Date.now() - 14300000).toISOString(), eventType: 'alert_generated', source: 'wazuh', description: 'Pass-the-hash detected from 192.168.1.12' },
      { timestamp: new Date(Date.now() - 14000000).toISOString(), eventType: 'case_opened', source: 'soc-lab', description: 'Linked alerts - lateral movement campaign' },
      { timestamp: new Date(Date.now() - 13800000).toISOString(), eventType: 'containment', source: 'analyst', description: 'Affected workstations isolated' },
      { timestamp: new Date(Date.now() - 13600000).toISOString(), eventType: 'finding', source: 'analyst', description: 'Initial access via phishing email 8 hours prior' },
    ];

    await db.query(`
      INSERT INTO investigations (case_id, title, description, investigator_id, status, timeline_events, created_at)
      VALUES ($1, $2, $3, $4, 'active', $5::jsonb, NOW() - INTERVAL '2 hours')
      ON CONFLICT DO NOTHING
    `, [
      c.id,
      c.case_number === 'CASE-2026-0003' ? 'Ransomware Root Cause Analysis' : 'Lateral Movement Timeline',
      c.case_number === 'CASE-2026-0003' ? 'Determine initial access vector and full blast radius of ransomware attack' : 'Map full lateral movement path from initial compromise to domain controller',
      analystId,
      JSON.stringify(timeline),
    ]);
  }
  console.log('  ✓ 2 investigation timelines seeded');

  // ── Summary ──────────────────────────────────────────────────────────────────
  const counts = await db.query<{ alerts: string; cases: string }>(`
    SELECT
      (SELECT COUNT(*) FROM alerts)::text AS alerts,
      (SELECT COUNT(*) FROM cases)::text  AS cases
  `);

  console.log(`\n✅ Database now has:`);
  console.log(`   ${counts[0].alerts} alerts total`);
  console.log(`   ${counts[0].cases} cases total`);
  console.log('\nSeed complete.');
  await db.end();
}

seedAttacks().catch(err => {
  console.error('Seed failed:', (err as Error).message);
  process.exit(1);
});
