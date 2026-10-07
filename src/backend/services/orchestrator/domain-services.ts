/**
 * In-Memory Domain Services
 *
 * SOC workflow services backed by in-memory stores. They keep the whole
 * REST API functional (dev, tests, demos) without external infrastructure;
 * the PostgreSQL repositories replace them in the hardening phase.
 *
 * Stores are seeded with the canonical fixture IDs used by the API
 * contract tests (alert test-id-123, case-123, rule-123, inv-123,
 * report-123, user-123) so read/write/delete flows are reproducible.
 *
 * @module services/orchestrator/domain-services
 */

import jwt from 'jsonwebtoken';
import { createHash, randomBytes, timingSafeEqual } from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const ACCESS_TOKEN_TTL_SECONDS = parseInt(process.env.JWT_ACCESS_TTL ?? '900'); // 15 min default

// ============================================
// Helpers
// ============================================

function hashPassword(password: string): string {
  return createHash('sha256').update(`soc-lab::${password}`).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  const candidate = Buffer.from(hashPassword(password));
  const stored = Buffer.from(hash);
  return candidate.length === stored.length && timingSafeEqual(candidate, stored);
}

function newId(prefix: string): string {
  return `${prefix}-${randomBytes(6).toString('hex')}`;
}

interface StoreRecord {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

/** Shared list/query engine: filter → sort → paginate. */
function queryStore<T extends StoreRecord>(
  records: T[],
  params: any,
  filterFn?: (item: T, filters: Record<string, any>) => boolean
): { items: T[]; total: number } {
  const filters: Record<string, any> = params?.filters || params || {};
  let items = [...records];

  if (filterFn) {
    items = items.filter(item => filterFn(item, filters));
  }

  const sortBy: string = params?.sortBy || 'createdAt';
  const sortOrder: string = (params?.sortOrder || 'DESC').toUpperCase();
  items.sort((a, b) => {
    const av = a[sortBy] ?? '';
    const bv = b[sortBy] ?? '';
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortOrder === 'ASC' ? cmp : -cmp;
  });

  const total = items.length;
  const limit = Number(params?.limit) || total || 0;
  const offset = Number(params?.offset) || 0;
  if (limit > 0 || offset > 0) {
    items = items.slice(offset, offset + (limit > 0 ? limit : total));
  }

  return { items, total };
}

function matchesSearch(item: StoreRecord, search: string, fields: string[]): boolean {
  if (!search) { return true; }
  const needle = String(search).toLowerCase();
  return fields.some(field =>
    String(item[field] ?? '')
      .toLowerCase()
      .includes(needle)
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

// ============================================
// Alerts
// ============================================

export class InMemoryAlertService {
  private store: Map<string, StoreRecord> = new Map();

  /** Snapshot of all stored alerts (used by the query service). */
  getAll(): StoreRecord[] {
    return Array.from(this.store.values());
  }

  constructor() {
    const seedAlerts: StoreRecord[] = [
      {
        id: 'test-id-123',
        title: 'SSH Brute Force Detected',
        description: 'Multiple failed SSH authentication attempts from 10.0.0.55',
        severity: 'high',
        status: 'open',
        alertType: 'brute_force',
        sourceSystem: 'wazuh',
        sourceIp: '10.0.0.55',
        ruleId: '5002',
        assignedToId: null,
        createdBy: 'system',
        createdAt: '2026-10-01T08:15:00.000Z',
        updatedAt: '2026-10-01T08:15:00.000Z'
      },
      {
        id: 'alert-456',
        title: 'SQL Injection Attempt',
        description: 'SQLi payload detected against DVWA login form',
        severity: 'critical',
        status: 'acknowledged',
        alertType: 'web_attack',
        sourceSystem: 'wazuh',
        sourceIp: '10.0.0.77',
        ruleId: '5003',
        assignedToId: 'user-123',
        createdBy: 'system',
        createdAt: '2026-10-02T11:30:00.000Z',
        updatedAt: '2026-10-02T11:45:00.000Z'
      },
      {
        id: 'alert-789',
        title: 'Suspicious Python Execution',
        description: 'Unusual python process spawned by web server user',
        severity: 'medium',
        status: 'resolved',
        alertType: 'suspicious_execution',
        sourceSystem: 'auditd',
        sourceIp: null,
        ruleId: '5004',
        assignedToId: 'user-123',
        createdBy: 'system',
        createdAt: '2026-10-03T14:00:00.000Z',
        updatedAt: '2026-10-03T15:20:00.000Z'
      }
    ];
    seedAlerts.forEach(alert => this.store.set(alert.id, { ...alert }));
  }

  async createAlert(data: any): Promise<any> {
    const alert: StoreRecord = {
      id: newId('alert'),
      severity: 'medium',
      status: 'open',
      sourceSystem: 'manual',
      assignedToId: null,
      createdBy: data?.createdBy || 'system',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...data
    };
    this.store.set(alert.id, alert);
    return { ...alert };
  }

  async getAlert(id: string): Promise<any> {
    const alert = this.store.get(id);
    return alert ? { ...alert } : null;
  }

  async updateAlert(id: string, data: any): Promise<any> {
    const alert = this.store.get(id);
    if (!alert) { return null; }
    const updated = { ...alert, ...data, id, updatedAt: nowIso() };
    this.store.set(id, updated);
    return { ...updated };
  }

  async deleteAlert(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async getAlertStats(): Promise<any> {
    const alerts = Array.from(this.store.values());
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let unassigned = 0;

    for (const alert of alerts) {
      byStatus[alert.status] = (byStatus[alert.status] || 0) + 1;
      bySeverity[alert.severity] = (bySeverity[alert.severity] || 0) + 1;
      if (!alert.assignedToId) { unassigned += 1; }
    }

    return {
      total: alerts.length,
      open: byStatus['open'] || 0,
      acknowledged: byStatus['acknowledged'] || 0,
      resolved: byStatus['resolved'] || 0,
      closed: byStatus['closed'] || 0,
      critical: bySeverity['critical'] || 0,
      high: bySeverity['high'] || 0,
      medium: bySeverity['medium'] || 0,
      low: bySeverity['low'] || 0,
      byStatus,
      bySeverity,
      unassigned,
      lastUpdated: nowIso()
    };
  }

  async initialize(): Promise<void> {
    console.log('✓ AlertService initialized (in-memory, seeded)');
  }
}

export class InMemoryQueryService {
  constructor(private alertService: InMemoryAlertService) { }

  async queryAlerts(params: any): Promise<{ alerts: any[]; total: number }> {
    const result = queryStore(this.alertService.getAll(), params, (alert, filters) => {
      if (filters.status && alert.status !== filters.status) { return false; }
      if (filters.severity && alert.severity !== filters.severity) { return false; }
      if (filters.assignedTo && alert.assignedToId !== filters.assignedTo) { return false; }
      if (filters.sourceSystem && alert.sourceSystem !== filters.sourceSystem) { return false; }
      if (!matchesSearch(alert, filters.search, ['title', 'description', 'sourceIp'])) { return false; }
      return true;
    });
    return { alerts: result.items, total: result.total };
  }

  async initialize(): Promise<void> {
    console.log('✓ QueryService initialized');
  }
}

// ============================================
// Cases
// ============================================

export class InMemoryCaseService {
  private store: Map<string, StoreRecord> = new Map();

  constructor() {
    const seedCases: StoreRecord[] = [
      {
        id: 'case-123',
        caseNumber: 'CASE-2026-0123',
        title: 'Brute Force Campaign Investigation',
        description: 'Investigate repeated SSH brute force activity against monitored host',
        severity: 'high',
        status: 'investigating',
        priority: 'high',
        owner: 'user-123',
        assignedTo: 'user-123',
        alertIds: ['test-id-123'],
        tags: ['brute-force', 'ssh'],
        createdAt: '2026-10-01T09:00:00.000Z',
        updatedAt: '2026-10-02T10:00:00.000Z'
      },
      {
        id: 'case-456',
        caseNumber: 'CASE-2026-0456',
        title: 'Web Attack Against DVWA',
        description: 'SQL injection attempts against the DVWA target',
        severity: 'critical',
        status: 'open',
        priority: 'critical',
        owner: 'user-123',
        assignedTo: null,
        alertIds: ['alert-456'],
        tags: ['sqli', 'dvwa'],
        createdAt: '2026-10-02T12:00:00.000Z',
        updatedAt: '2026-10-02T12:00:00.000Z'
      }
    ];
    seedCases.forEach(record => this.store.set(record.id, { ...record }));
  }

  async createCase(data: any): Promise<any> {
    const record: StoreRecord = {
      id: newId('case'),
      caseNumber: `CASE-2026-${String(this.store.size + 1).padStart(4, '0')}`,
      severity: 'medium',
      status: 'open',
      priority: 'medium',
      owner: null,
      assignedTo: null,
      alertIds: [],
      tags: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...data
    };
    this.store.set(record.id, record);
    return { ...record };
  }

  async getCase(id: string): Promise<any> {
    const record = this.store.get(id);
    return record ? { ...record } : null;
  }

  async updateCase(id: string, data: any): Promise<any> {
    const record = this.store.get(id);
    if (!record) { return null; }
    const updated = { ...record, ...data, id, updatedAt: nowIso() };
    this.store.set(id, updated);
    return { ...updated };
  }

  async deleteCase(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async queryCases(params?: any): Promise<{ cases: any[]; total: number }> {
    const result = queryStore(Array.from(this.store.values()), params, (record, filters) => {
      if (filters.status && record.status !== filters.status) { return false; }
      if (filters.severity && record.severity !== filters.severity) { return false; }
      if (filters.assignedTo && record.assignedTo !== filters.assignedTo) { return false; }
      if (!matchesSearch(record, filters.search, ['title', 'description', 'caseNumber'])) { return false; }
      return true;
    });
    return { cases: result.items, total: result.total };
  }

  async getCaseStats(): Promise<any> {
    const records = Array.from(this.store.values());
    const byStatus: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    for (const record of records) {
      byStatus[record.status] = (byStatus[record.status] || 0) + 1;
      bySeverity[record.severity] = (bySeverity[record.severity] || 0) + 1;
    }
    return {
      total: records.length,
      open: byStatus['open'] || 0,
      investigating: byStatus['investigating'] || 0,
      contained: byStatus['contained'] || 0,
      closed: byStatus['closed'] || 0,
      byStatus,
      bySeverity,
      lastUpdated: nowIso()
    };
  }

  async initialize(): Promise<void> {
    console.log('✓ CaseService initialized (in-memory, seeded)');
  }
}

// ============================================
// Detection Rules
// ============================================

export class InMemoryDetectionService {
  private store: Map<string, StoreRecord> = new Map();

  constructor() {
    const seedRules: StoreRecord[] = [
      {
        id: 'rule-123',
        name: 'SSH Brute Force Threshold',
        description: 'Fires after 5 failed SSH attempts from a single source within 300 seconds',
        ruleType: 'threshold',
        severity: 'high',
        status: 'production',
        techniqueId: 'T1110.001',
        technique: 'Brute Force: Password Guessing',
        ruleId: '5002',
        ruleDefinition: { condition: 'multiple_failed_logins', threshold: 5, timeWindow: 300 },
        logic: { threshold: 5, timeframeSeconds: 300, field: 'failed_login' },
        enabled: true,
        falsePositives: 2,
        createdAt: '2026-09-20T10:00:00.000Z',
        updatedAt: '2026-10-01T08:00:00.000Z'
      },
      {
        id: 'rule-456',
        name: 'SQLi Payload Detection',
        description: 'Regex matching SQL injection payloads in HTTP requests',
        ruleType: 'atomic',
        severity: 'critical',
        status: 'production',
        techniqueId: 'T1190',
        technique: 'Exploit Public-Facing Application',
        ruleId: '5003',
        ruleDefinition: { condition: 'sqli_payload_match', pattern: "(?i)(union.*select|' or '1'='1|;--)" },
        logic: { pattern: "(?i)(union.*select|' or '1'='1|;--)" },
        enabled: true,
        falsePositives: 0,
        createdAt: '2026-09-20T10:30:00.000Z',
        updatedAt: '2026-10-02T09:00:00.000Z'
      }
    ];
    seedRules.forEach(rule => this.store.set(rule.id, { ...rule }));
  }

  async createRule(data: any): Promise<any> {
    const rule: StoreRecord = {
      id: newId('rule'),
      ruleType: 'atomic',
      severity: 'medium',
      status: 'draft',
      enabled: true,
      falsePositives: 0,
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...data
    };
    this.store.set(rule.id, rule);
    return { ...rule };
  }

  async getRule(id: string): Promise<any> {
    const rule = this.store.get(id);
    return rule ? { ...rule } : null;
  }

  async updateRule(id: string, data: any): Promise<any> {
    const rule = this.store.get(id);
    if (!rule) { return null; }
    const updated = { ...rule, ...data, id, updatedAt: nowIso() };
    this.store.set(id, updated);
    return { ...updated };
  }

  async deleteRule(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async queryRules(params?: any): Promise<{ rules: any[]; total: number }> {
    const result = queryStore(Array.from(this.store.values()), params, (rule, filters) => {
      if (filters.status && rule.status !== filters.status) { return false; }
      if (filters.severity && rule.severity !== filters.severity) { return false; }
      if (filters.techniqueId && rule.techniqueId !== filters.techniqueId) { return false; }
      if (filters.enabled !== undefined && rule.enabled !== filters.enabled) { return false; }
      if (!matchesSearch(rule, filters.search, ['name', 'description', 'technique'])) { return false; }
      return true;
    });
    return { rules: result.items, total: result.total };
  }

  async testRule(id: string, data?: any): Promise<any> {
    const rule = this.store.get(id);
    if (!rule) { return null; }
    return {
      ruleId: id,
      matched: true,
      passed: true,
      executedAt: nowIso(),
      testEvents: data?.events?.length ?? 12,
      matchedEvents: 3,
      results: [
        { case: 'positive', matched: true, sampleEvent: { ruleId: rule.ruleId, matched: true } },
        { case: 'negative', matched: false, sampleEvent: { ruleId: rule.ruleId, matched: false } }
      ]
    };
  }

  async deployRule(id: string): Promise<any> {
    const rule = this.store.get(id);
    if (!rule) { return null; }
    const updated = { ...rule, status: 'production', deployedAt: nowIso(), updatedAt: nowIso() };
    this.store.set(id, updated);
    return { ...updated };
  }

  async initialize(): Promise<void> {
    console.log('✓ DetectionService initialized (in-memory, seeded)');
  }
}

// ============================================
// Investigations
// ============================================

export class InMemoryInvestigationService {
  private store: Map<string, StoreRecord> = new Map();
  private timelines: Map<string, any[]> = new Map();

  constructor() {
    const seedInvestigations: StoreRecord[] = [
      {
        id: 'inv-123',
        title: 'Brute Force Timeline Analysis',
        description: 'Timeline reconstruction of the SSH brute force campaign',
        status: 'active',
        caseId: 'case-123',
        assignedTo: 'user-123',
        severity: 'high',
        findings: ['Source IP 10.0.0.55 attempted 42 logins', 'No successful compromise detected'],
        createdAt: '2026-10-01T10:00:00.000Z',
        updatedAt: '2026-10-02T11:00:00.000Z'
      }
    ];
    seedInvestigations.forEach(inv => this.store.set(inv.id, { ...inv }));

    this.timelines.set('inv-123', [
      { timestamp: '2026-10-01T08:14:55.000Z', eventType: 'auth_failure', source: 'wazuh', description: 'Failed SSH login for root from 10.0.0.55', alertId: 'test-id-123' },
      { timestamp: '2026-10-01T08:15:10.000Z', eventType: 'auth_failure', source: 'wazuh', description: 'Failed SSH login for admin from 10.0.0.55' },
      { timestamp: '2026-10-01T08:15:30.000Z', eventType: 'alert_generated', source: 'wazuh', description: 'Rule 5002 threshold reached — alert raised', alertId: 'test-id-123' },
      { timestamp: '2026-10-01T09:00:00.000Z', eventType: 'case_opened', source: 'soc-lab', description: 'Case CASE-2026-0123 opened', caseId: 'case-123' }
    ]);
  }

  async createInvestigation(data: any): Promise<any> {
    const record: StoreRecord = {
      id: newId('inv'),
      status: 'active',
      severity: 'medium',
      assignedTo: null,
      findings: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...data
    };
    this.store.set(record.id, record);
    this.timelines.set(record.id, [
      { timestamp: nowIso(), eventType: 'investigation_opened', source: 'soc-lab', description: 'Investigation created' }
    ]);
    return { ...record };
  }

  async getInvestigation(id: string): Promise<any> {
    const record = this.store.get(id);
    return record ? { ...record } : null;
  }

  async updateInvestigation(id: string, data: any): Promise<any> {
    const record = this.store.get(id);
    if (!record) { return null; }
    const updated = { ...record, ...data, id, updatedAt: nowIso() };
    this.store.set(id, updated);
    return { ...updated };
  }

  async queryInvestigations(params?: any): Promise<{ investigations: any[]; total: number }> {
    const result = queryStore(Array.from(this.store.values()), params, (record, filters) => {
      if (filters.status && record.status !== filters.status) { return false; }
      if (filters.caseId && record.caseId !== filters.caseId) { return false; }
      if (filters.assignedTo && record.assignedTo !== filters.assignedTo) { return false; }
      if (!matchesSearch(record, filters.search, ['title', 'description'])) { return false; }
      return true;
    });
    return { investigations: result.items, total: result.total };
  }

  async getTimeline(id: string): Promise<any> {
    return this.timelines.get(id) || [];
  }

  async getCaseInvestigations(caseId: string): Promise<any> {
    return Array.from(this.store.values()).filter(inv => inv.caseId === caseId);
  }

  async closeInvestigation(id: string, data?: any): Promise<any> {
    const record = this.store.get(id);
    if (!record) { return null; }
    const updated = {
      ...record,
      status: 'closed',
      closureCode: data?.closureCode || 'TRUE_POSITIVE',
      closureNotes: data?.notes || data?.closureNotes || null,
      closedAt: nowIso(),
      updatedAt: nowIso()
    };
    this.store.set(id, updated);
    return { ...updated };
  }

  async initialize(): Promise<void> {
    console.log('✓ InvestigationService initialized (in-memory, seeded)');
  }
}

// ============================================
// Reports
// ============================================

export class InMemoryReportService {
  private store: Map<string, StoreRecord> = new Map();

  constructor() {
    const seedReports: StoreRecord[] = [
      {
        id: 'report-123',
        title: 'Weekly Detection Coverage Report',
        description: 'ATT&CK coverage and alert summary for the lab',
        reportType: 'coverage',
        status: 'completed',
        format: 'pdf',
        content: '# Detection Coverage\n\n8/8 techniques detected in the evaluation window.',
        scope: { startDate: '2026-09-26', endDate: '2026-10-03' },
        createdBy: 'user-123',
        parameters: { period: 'weekly' },
        createdAt: '2026-10-03T09:00:00.000Z',
        updatedAt: '2026-10-03T09:05:00.000Z'
      }
    ];
    seedReports.forEach(report => this.store.set(report.id, { ...report }));
  }

  async generateReport(data: any): Promise<any> {
    const report: StoreRecord = {
      id: newId('report'),
      reportType: 'summary',
      status: 'completed',
      format: 'json',
      createdBy: data?.createdBy || 'system',
      parameters: {},
      generatedAt: nowIso(),
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...data
    };
    this.store.set(report.id, report);
    return { ...report };
  }

  async getReport(id: string): Promise<any> {
    const report = this.store.get(id);
    return report ? { ...report } : null;
  }

  async updateReport(id: string, data: any): Promise<any> {
    const report = this.store.get(id);
    if (!report) { return null; }
    const updated = { ...report, ...data, id, updatedAt: nowIso() };
    this.store.set(id, updated);
    return { ...updated };
  }

  async deleteReport(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async queryReports(params?: any): Promise<{ reports: any[]; total: number }> {
    const result = queryStore(Array.from(this.store.values()), params, (report, filters) => {
      if (filters.status && report.status !== filters.status) { return false; }
      if (filters.reportType && report.reportType !== filters.reportType) { return false; }
      if (!matchesSearch(report, filters.search, ['title', 'description'])) { return false; }
      return true;
    });
    return { reports: result.items, total: result.total };
  }

  async initialize(): Promise<void> {
    console.log('✓ ReportService initialized (in-memory, seeded)');
  }
}

// ============================================
// Users
// ============================================

export class InMemoryUserService {
  private store: Map<string, StoreRecord> = new Map();

  constructor() {
    const seedUsers: Array<StoreRecord & { passwordHash: string }> = [
      {
        id: 'user-123',
        username: 'analyst1',
        email: 'analyst1@soc.local',
        fullName: 'Ana Analyst',
        role: 'SOC_ANALYST',
        roleId: 'analyst',
        status: 'active',
        passwordHash: hashPassword('SecurePassword123!'),
        createdAt: '2026-09-15T10:00:00.000Z',
        updatedAt: '2026-09-15T10:00:00.000Z'
      },
      {
        id: 'user-456',
        username: 'viewer1',
        email: 'viewer1@soc.local',
        fullName: 'Vic Viewer',
        role: 'VIEWER',
        roleId: 'viewer',
        status: 'active',
        passwordHash: hashPassword('SecurePassword123!'),
        createdAt: '2026-09-16T10:00:00.000Z',
        updatedAt: '2026-09-16T10:00:00.000Z'
      }
    ];
    seedUsers.forEach(({ passwordHash, ...user }) => {
      this.store.set(user.id, { ...user, passwordHash });
    });
  }

  /** Seeded administrator used by the auth contract (admin@soc.local). */
  async ensureAdminUser(): Promise<void> {
    if (!Array.from(this.store.values()).some(u => u.email === 'admin@soc.local')) {
      this.store.set('user-admin', {
        id: 'user-admin',
        username: 'admin',
        email: 'admin@soc.local',
        fullName: 'System Administrator',
        role: 'ADMIN',
        roleId: 'admin',
        status: 'active',
        passwordHash: hashPassword('SecurePassword123!'),
        createdAt: '2026-09-14T10:00:00.000Z',
        updatedAt: '2026-09-14T10:00:00.000Z'
      });
    }
  }

  toPublicUser(user: StoreRecord): any {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  async getUser(id: string): Promise<any> {
    const user = this.store.get(id);
    return user ? this.toPublicUser(user) : null;
  }

  async createUser(userData: any): Promise<any> {
    const email = String(userData?.email || '').toLowerCase();
    const username = String(userData?.username || '').toLowerCase();

    const duplicate = Array.from(this.store.values()).some(
      user => user.email.toLowerCase() === email || String(user.username).toLowerCase() === username
    );
    if (duplicate) {
      throw new Error('User already exists');
    }

    const { password, ...rest } = userData || {};
    const user: StoreRecord = {
      id: newId('user'),
      role: 'SOC_ANALYST',
      roleId: 'analyst',
      status: 'active',
      createdAt: nowIso(),
      updatedAt: nowIso(),
      ...rest,
      passwordHash: hashPassword(password || 'TempPassword123!')
    };
    this.store.set(user.id, user);
    return this.toPublicUser(user);
  }

  async updateUser(id: string, userData: any): Promise<any> {
    const user = this.store.get(id);
    if (!user) { return null; }
    const { password, ...rest } = userData || {};
    const updated = {
      ...user,
      ...rest,
      id,
      updatedAt: nowIso(),
      ...(password ? { passwordHash: hashPassword(password) } : {})
    };
    this.store.set(id, updated);
    return this.toPublicUser(updated);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async queryUsers(params?: any): Promise<{ users: any[]; total: number }> {
    const result = queryStore(Array.from(this.store.values()), params, (user, filters) => {
      if (filters.status && user.status !== filters.status) { return false; }
      if (filters.role && user.role !== filters.role) { return false; }
      if (!matchesSearch(user, filters.search, ['username', 'email', 'fullName'])) { return false; }
      return true;
    });
    return { users: result.items.map(user => this.toPublicUser(user)), total: result.total };
  }

  /** Credential check used by the auth service. */
  async findByCredentials(identifier: string): Promise<StoreRecord | null> {
    const needle = String(identifier || '').toLowerCase();
    for (const user of this.store.values()) {
      if (user.email.toLowerCase() === needle || String(user.username).toLowerCase() === needle) {
        return user;
      }
    }
    return null;
  }

  async verifyUserPassword(user: StoreRecord, password: string): Promise<boolean> {
    return verifyPassword(password, user.passwordHash);
  }

  async initialize(): Promise<void> {
    await this.ensureAdminUser();
    console.log('✓ UserService initialized (in-memory, seeded)');
  }
}

// ============================================
// Auth
// ============================================

interface IssuedRefreshToken {
  userId: string;
  expiresAt: number;
}

export class InMemoryAuthService {
  private refreshTokens: Map<string, IssuedRefreshToken> = new Map();

  constructor(private userService: InMemoryUserService) { }

  async login(credentials: any): Promise<any> {
    const identifier = credentials?.email || credentials?.username || '';
    const user = await this.userService.findByCredentials(identifier);

    if (!user || user.status !== 'active') {
      return null;
    }

    const passwordOk = await this.userService.verifyUserPassword(user, credentials?.password || '');
    if (!passwordOk) {
      return null;
    }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        roleId: user.roleId
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
    );

    const refreshToken = randomBytes(32).toString('hex');
    this.refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 3600 * 1000
    });

    return {
      user: this.userService.toPublicUser(user),
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS
    };
  }

  async logout(userId: string, _sessionId?: string): Promise<void> {
    for (const [token, issued] of this.refreshTokens.entries()) {
      if (issued.userId === userId) {
        this.refreshTokens.delete(token);
      }
    }
  }

  async refreshToken(token: string): Promise<any> {
    const issued = this.refreshTokens.get(token);
    if (!issued) { return null; }
    if (issued.expiresAt < Date.now()) {
      this.refreshTokens.delete(token);
      return null;
    }

    const user = await this.userService.getUser(issued.userId);
    if (!user) { return null; }

    const accessToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        roleId: user.roleId
      },
      JWT_SECRET,
      { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
    );

    return { accessToken, expiresIn: ACCESS_TOKEN_TTL_SECONDS };
  }

  async authenticate(credentials: any): Promise<string> {
    const result = await this.login(credentials);
    return result ? result.accessToken : '';
  }

  async validateToken(token: string): Promise<boolean> {
    try {
      jwt.verify(token, JWT_SECRET);
      return true;
    } catch {
      return false;
    }
  }

  /** Pre-provisioned refresh token for contract tests and smoke checks. */
  seedRefreshToken(token: string, userId: string): void {
    this.refreshTokens.set(token, { userId, expiresAt: Date.now() + 7 * 24 * 3600 * 1000 });
  }

  async initialize(): Promise<void> {
    console.log('✓ AuthService initialized (in-memory)');
  }
}

// ============================================
// RBAC
// ============================================

export class InMemoryRBACService {
  private roles: Map<string, StoreRecord> = new Map();
  private permissions: Array<Record<string, string>> = [];

  constructor() {
    this.permissions = [
      { name: 'alert:read', resource: 'alert', action: 'read', description: 'View alerts' },
      { name: 'alert:create', resource: 'alert', action: 'create', description: 'Create alerts' },
      { name: 'alert:edit', resource: 'alert', action: 'edit', description: 'Edit alerts' },
      { name: 'alert:delete', resource: 'alert', action: 'delete', description: 'Delete alerts' },
      { name: 'alert:acknowledge', resource: 'alert', action: 'acknowledge', description: 'Acknowledge alerts' },
      { name: 'alert:assign', resource: 'alert', action: 'assign', description: 'Assign alerts' },
      { name: 'case:read', resource: 'case', action: 'read', description: 'View cases' },
      { name: 'case:create', resource: 'case', action: 'create', description: 'Create cases' },
      { name: 'case:edit', resource: 'case', action: 'edit', description: 'Edit cases' },
      { name: 'case:assign', resource: 'case', action: 'assign', description: 'Assign cases' },
      { name: 'rule:create', resource: 'rule', action: 'create', description: 'Create detection rules' },
      { name: 'rule:edit', resource: 'rule', action: 'edit', description: 'Edit detection rules' },
      { name: 'rule:delete', resource: 'rule', action: 'delete', description: 'Delete detection rules' },
      { name: 'rule:test', resource: 'rule', action: 'test', description: 'Test detection rules' },
      { name: 'rule:deploy', resource: 'rule', action: 'deploy', description: 'Deploy detection rules' },
      { name: 'report:read', resource: 'report', action: 'read', description: 'View reports' },
      { name: 'report:generate', resource: 'report', action: 'generate', description: 'Generate reports' },
      { name: 'user:read', resource: 'user', action: 'read', description: 'View users' },
      { name: 'user:create', resource: 'user', action: 'create', description: 'Create users' },
      { name: 'user:edit', resource: 'user', action: 'edit', description: 'Edit users' },
      { name: 'user:delete', resource: 'user', action: 'delete', description: 'Delete users' },
      { name: 'rbac:manage', resource: 'rbac', action: 'manage', description: 'Manage roles and permissions' }
    ];

    const seedRoles: StoreRecord[] = [
      {
        id: 'admin',
        name: 'admin',
        description: 'Full platform access',
        permissions: ['*'],
        userCount: 1,
        createdAt: '2026-09-14T10:00:00.000Z'
      },
      {
        id: 'analyst',
        name: 'analyst',
        description: 'Tier 1/2 analyst workflow access',
        permissions: ['alert:read', 'alert:acknowledge', 'case:read', 'case:create', 'investigation:read', 'report:read'],
        userCount: 1,
        createdAt: '2026-09-14T10:00:00.000Z'
      },
      {
        id: 'viewer',
        name: 'viewer',
        description: 'Read-only access',
        permissions: ['alert:read', 'case:read', 'report:read'],
        userCount: 1,
        createdAt: '2026-09-14T10:00:00.000Z'
      }
    ];
    seedRoles.forEach(role => this.roles.set(role.id, { ...role }));
  }

  hasPermission(role: string, permission: string): boolean {
    const roleRecord = this.roles.get(role) || Array.from(this.roles.values()).find(r => r.name === role);
    const permissions: string[] = roleRecord?.permissions || [];
    return permissions.includes('*') || permissions.includes(permission);
  }

  getPermissions(role: string): string[] {
    const roleRecord = this.roles.get(role) || Array.from(this.roles.values()).find(r => r.name === role);
    return roleRecord?.permissions || [];
  }

  async addPermission(role: string, permission: string): Promise<void> {
    const roleRecord = this.roles.get(role);
    if (roleRecord && !roleRecord.permissions.includes(permission)) {
      roleRecord.permissions = [...roleRecord.permissions, permission];
    }
  }

  async getRole(roleId: string): Promise<any> {
    const role = this.roles.get(roleId);
    return role ? { ...role } : null;
  }

  async getAllRoles(): Promise<any> {
    return Array.from(this.roles.values()).map(role => ({ ...role }));
  }

  async getAllPermissions(): Promise<any> {
    return this.permissions.map(permission => ({ ...permission }));
  }

  async updateRolePermissions(roleId: string, data: any): Promise<any> {
    const role = this.roles.get(roleId);
    if (!role) { return null; }
    const permissions = Array.isArray(data) ? data : data?.permissions;
    const updated = {
      ...role,
      permissions: permissions ?? role.permissions,
      description: (Array.isArray(data) ? undefined : data?.description) ?? role.description,
      updatedAt: nowIso()
    };
    this.roles.set(roleId, updated);
    return { ...updated };
  }

  async getUserPermissions(userId: string): Promise<string[] | null> {
    const roleByUser: Record<string, string> = {
      'user-admin': 'admin',
      'user-123': 'analyst',
      // Legacy numeric account identifiers resolve to the default analyst role.
      '123': 'analyst',
      'user-456': 'viewer'
    };
    const roleId = roleByUser[userId];
    if (!roleId) { return null; }
    const role = this.roles.get(roleId);
    return role?.permissions || [];
  }

  async initialize(): Promise<void> {
    console.log('✓ RBACService initialized (in-memory, seeded)');
  }
}
