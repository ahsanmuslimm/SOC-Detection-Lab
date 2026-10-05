/**
 * CaseRepository
 *
 * PostgreSQL-backed implementation of ICaseDomainService.
 * Replaces InMemoryCaseService when DB is configured.
 *
 * Table: cases
 * Sequence: case_number_seq  (from migration 002_case_sequence.sql)
 */

import { DatabaseClient } from '../client';

// ── Raw DB row ────────────────────────────────────────────────────────────────

interface CaseRow {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  priority: string;
  classification: string | null;
  assigned_to_id: string | null;
  created_by_id: string | null;
  closed_by_id: string | null;
  alert_ids: string[];
  tags: string[];
  sla_breached: boolean;
  due_date: Date | null;
  closed_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// ── Public shape ──────────────────────────────────────────────────────────────

export interface Case {
  id: string;
  caseNumber: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  priority: string;
  classification: string | null;
  assignedToId: string | null;
  assignedTo: string | null;   // alias kept for controller compat
  createdById: string | null;
  owner: string | null;        // alias kept for controller compat
  closedById: string | null;
  alertIds: string[];
  tags: string[];
  slaBreached: boolean;
  dueDate: Date | null;
  closedAt: Date | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ── Query params ──────────────────────────────────────────────────────────────

interface QueryCasesParams {
  limit?: number;
  offset?: number;
  filters?: {
    status?: string;
    severity?: string;
    priority?: string;
    assignedTo?: string;
    search?: string;
  };
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ── Repository ────────────────────────────────────────────────────────────────

export class CaseRepository {
  constructor(private db: DatabaseClient) {}

  // ── Mapping ───────────────────────────────────────────────────────────────

  private toCase(row: CaseRow): Case {
    return {
      id:             row.id,
      caseNumber:     row.case_number,
      title:          row.title,
      description:    row.description,
      severity:       row.severity,
      status:         row.status,
      priority:       row.priority,
      classification: row.classification,
      assignedToId:   row.assigned_to_id,
      assignedTo:     row.assigned_to_id,   // alias
      createdById:    row.created_by_id,
      owner:          row.created_by_id,    // alias
      closedById:     row.closed_by_id,
      alertIds:       row.alert_ids  ?? [],
      tags:           row.tags       ?? [],
      slaBreached:    row.sla_breached,
      dueDate:        row.due_date,
      closedAt:       row.closed_at,
      metadata:       row.metadata   ?? {},
      createdAt:      row.created_at,
      updatedAt:      row.updated_at,
    };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async nextCaseNumber(): Promise<string> {
    const row = await this.db.queryOne<{ nextval: string }>(
      "SELECT nextval('case_number_seq') AS nextval"
    );
    const year = new Date().getFullYear();
    const seq  = String(row?.nextval ?? '1').padStart(4, '0');
    return `CASE-${year}-${seq}`;
  }

  // ── ICaseDomainService ────────────────────────────────────────────────────

  async createCase(data: Record<string, unknown>): Promise<Case> {
    const caseNumber = await this.nextCaseNumber();

    const row = await this.db.queryOne<CaseRow>(
      `INSERT INTO cases
         (case_number, title, description, severity, status, priority,
          classification, assigned_to_id, created_by_id, alert_ids, tags,
          due_date, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        caseNumber,
        data.title          ?? '',
        data.description    ?? null,
        data.severity       ?? 'medium',
        data.status         ?? 'open',
        data.priority       ?? 'medium',
        data.classification ?? null,
        data.assignedToId   ?? data.assignedTo   ?? data.assigned_to_id ?? null,
        data.createdById    ?? data.owner        ?? data.created_by_id  ?? null,
        data.alertIds       ?? data.alert_ids    ?? [],
        data.tags           ?? [],
        data.dueDate        ?? data.due_date     ?? null,
        JSON.stringify(data.metadata ?? {}),
      ]
    );
    if (!row) throw new Error('Case creation failed');
    return this.toCase(row);
  }

  async getCase(id: string): Promise<Case | null> {
    const row = await this.db.queryOne<CaseRow>(
      'SELECT * FROM cases WHERE id = $1', [id]
    );
    return row ? this.toCase(row) : null;
  }

  async updateCase(id: string, data: Record<string, unknown>): Promise<Case | null> {
    const existing = await this.db.queryOne<{ id: string }>(
      'SELECT id FROM cases WHERE id = $1', [id]
    );
    if (!existing) return null;

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const colMap: Record<string, string> = {
      title:          'title',
      description:    'description',
      severity:       'severity',
      status:         'status',
      priority:       'priority',
      classification: 'classification',
      assignedToId:   'assigned_to_id',
      assignedTo:     'assigned_to_id',
      closedById:     'closed_by_id',
      alertIds:       'alert_ids',
      tags:           'tags',
      slaBreached:    'sla_breached',
      dueDate:        'due_date',
      closedAt:       'closed_at',
      metadata:       'metadata',
    };

    // Deduplicate (assignedTo + assignedToId map to same column)
    const seen = new Set<string>();
    for (const [key, col] of Object.entries(colMap)) {
      if (data[key] !== undefined && !seen.has(col)) {
        seen.add(col);
        sets.push(`${col} = $${idx++}`);
        values.push(key === 'metadata' ? JSON.stringify(data[key]) : data[key]);
      }
    }

    if (sets.length === 0) return this.getCase(id);

    values.push(id);
    const row = await this.db.queryOne<CaseRow>(
      `UPDATE cases SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING *`,
      values
    );
    return row ? this.toCase(row) : null;
  }

  async deleteCase(id: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      'DELETE FROM cases WHERE id = $1 RETURNING id', [id]
    );
    return rows.length > 0;
  }

  async queryCases(params: QueryCasesParams = {}): Promise<{ cases: Case[]; total: number }> {
    const {
      limit     = 25,
      offset    = 0,
      filters   = {},
      sortBy    = 'created_at',
      sortOrder = 'DESC',
    } = params;

    const safeSortBy = ['created_at', 'updated_at', 'severity', 'status', 'priority', 'case_number']
      .includes(sortBy) ? sortBy : 'created_at';

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.status)     { conditions.push(`status = $${idx++}`);          values.push(filters.status); }
    if (filters.severity)   { conditions.push(`severity = $${idx++}`);        values.push(filters.severity); }
    if (filters.priority)   { conditions.push(`priority = $${idx++}`);        values.push(filters.priority); }
    if (filters.assignedTo) { conditions.push(`assigned_to_id = $${idx++}`);  values.push(filters.assignedTo); }
    if (filters.search) {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR case_number ILIKE $${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM cases ${where}`, values
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    values.push(limit, offset);
    const rows = await this.db.query<CaseRow>(
      `SELECT * FROM cases ${where}
       ORDER BY ${safeSortBy} ${sortOrder}
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return { cases: rows.map(r => this.toCase(r)), total };
  }

  async getCaseStats(): Promise<Record<string, unknown>> {
    const row = await this.db.queryOne<Record<string, string>>(`
      SELECT
        COUNT(*)                                             AS total,
        COUNT(*) FILTER (WHERE status = 'open')             AS open,
        COUNT(*) FILTER (WHERE status = 'investigating')    AS investigating,
        COUNT(*) FILTER (WHERE status = 'contained')        AS contained,
        COUNT(*) FILTER (WHERE status = 'resolved')         AS resolved,
        COUNT(*) FILTER (WHERE status = 'closed')           AS closed,
        COUNT(*) FILTER (WHERE severity = 'critical')       AS critical,
        COUNT(*) FILTER (WHERE severity = 'high')           AS high,
        COUNT(*) FILTER (WHERE severity = 'medium')         AS medium,
        COUNT(*) FILTER (WHERE severity = 'low')            AS low
      FROM cases
    `);

    const s = row ?? {};
    return {
      total:         parseInt(s['total']         ?? '0', 10),
      open:          parseInt(s['open']          ?? '0', 10),
      investigating: parseInt(s['investigating'] ?? '0', 10),
      contained:     parseInt(s['contained']     ?? '0', 10),
      resolved:      parseInt(s['resolved']      ?? '0', 10),
      closed:        parseInt(s['closed']        ?? '0', 10),
      bySeverity: {
        critical: parseInt(s['critical'] ?? '0', 10),
        high:     parseInt(s['high']     ?? '0', 10),
        medium:   parseInt(s['medium']   ?? '0', 10),
        low:      parseInt(s['low']      ?? '0', 10),
      },
      lastUpdated: new Date().toISOString(),
    };
  }

  async initialize(): Promise<void> {
    console.log('✓ CaseRepository initialized (PostgreSQL)');
  }
}
