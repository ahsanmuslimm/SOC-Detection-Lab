/**
 * InvestigationRepository
 *
 * PostgreSQL-backed implementation of IInvestigationDomainService.
 * Replaces InMemoryInvestigationService when DB is configured.
 *
 * Table: investigations
 * Timeline events stored as JSONB array in timeline_events column.
 */

import { DatabaseClient } from '../client';

// ── Raw DB row ────────────────────────────────────────────────────────────────

interface InvestigationRow {
  id: string;
  case_id: string;
  title: string;
  description: string | null;
  investigator_id: string | null;
  status: string;
  priority: number;
  evidence_ids: string[];
  timeline_events: Record<string, unknown>[];
  findings: string | null;
  recommendation: string | null;
  closure_code: string | null;
  closure_notes: string | null;
  closed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ── Public shape ──────────────────────────────────────────────────────────────

export interface Investigation {
  id: string;
  caseId: string;
  title: string;
  description: string | null;
  investigatorId: string | null;
  assignedTo: string | null;   // alias for controller compat
  status: string;
  severity: string;            // derived from case; default 'medium' for compat
  priority: number;
  evidenceIds: string[];
  timelineEvents: Record<string, unknown>[];
  findings: string | null;
  recommendation: string | null;
  closureCode: string | null;
  closureNotes: string | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Query params ──────────────────────────────────────────────────────────────

interface QueryInvestigationsParams {
  limit?: number;
  offset?: number;
  filters?: {
    status?: string;
    caseId?: string;
    assignedTo?: string;
    search?: string;
  };
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ── Repository ────────────────────────────────────────────────────────────────

export class InvestigationRepository {
  constructor(private db: DatabaseClient) {}

  // ── Mapping ───────────────────────────────────────────────────────────────

  private toInvestigation(row: InvestigationRow): Investigation {
    return {
      id:             row.id,
      caseId:         row.case_id,
      title:          row.title,
      description:    row.description,
      investigatorId: row.investigator_id,
      assignedTo:     row.investigator_id,   // alias
      status:         row.status,
      severity:       'medium',              // not stored on investigation; placeholder
      priority:       row.priority,
      evidenceIds:    row.evidence_ids    ?? [],
      timelineEvents: row.timeline_events ?? [],
      findings:       row.findings,
      recommendation: row.recommendation,
      closureCode:    row.closure_code,
      closureNotes:   row.closure_notes,
      closedAt:       row.closed_at,
      createdAt:      row.created_at,
      updatedAt:      row.updated_at,
    };
  }

  // ── IInvestigationDomainService ───────────────────────────────────────────

  async createInvestigation(data: Record<string, unknown>): Promise<Investigation> {
    const openingEvent = {
      timestamp:   new Date().toISOString(),
      eventType:   'investigation_opened',
      source:      'soc-lab',
      description: 'Investigation created',
    };

    const row = await this.db.queryOne<InvestigationRow>(
      `INSERT INTO investigations
         (case_id, title, description, investigator_id, status, priority, timeline_events)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
       RETURNING *`,
      [
        data.caseId         ?? data.case_id       ?? null,
        data.title          ?? '',
        data.description    ?? null,
        data.assignedTo     ?? data.investigatorId ?? data.investigator_id ?? null,
        data.status         ?? 'active',
        data.priority       ?? 1,
        JSON.stringify([openingEvent]),
      ]
    );
    if (!row) throw new Error('Investigation creation failed');
    return this.toInvestigation(row);
  }

  async getInvestigation(id: string): Promise<Investigation | null> {
    const row = await this.db.queryOne<InvestigationRow>(
      'SELECT * FROM investigations WHERE id = $1', [id]
    );
    return row ? this.toInvestigation(row) : null;
  }

  async updateInvestigation(id: string, data: Record<string, unknown>): Promise<Investigation | null> {
    const existing = await this.db.queryOne<{ id: string }>(
      'SELECT id FROM investigations WHERE id = $1', [id]
    );
    if (!existing) return null;

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const colMap: Record<string, string> = {
      title:          'title',
      description:    'description',
      status:         'status',
      priority:       'priority',
      assignedTo:     'investigator_id',
      investigatorId: 'investigator_id',
      findings:       'findings',
      recommendation: 'recommendation',
    };

    const seen = new Set<string>();
    for (const [key, col] of Object.entries(colMap)) {
      if (data[key] !== undefined && !seen.has(col)) {
        seen.add(col);
        sets.push(`${col} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (sets.length === 0) return this.getInvestigation(id);

    values.push(id);
    const row = await this.db.queryOne<InvestigationRow>(
      `UPDATE investigations SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING *`,
      values
    );
    return row ? this.toInvestigation(row) : null;
  }

  async queryInvestigations(
    params: QueryInvestigationsParams = {}
  ): Promise<{ investigations: Investigation[]; total: number }> {
    const {
      limit     = 25,
      offset    = 0,
      filters   = {},
      sortBy    = 'created_at',
      sortOrder = 'DESC',
    } = params;

    const safeSortBy = ['created_at', 'updated_at', 'status', 'priority']
      .includes(sortBy) ? sortBy : 'created_at';

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.status)     { conditions.push(`status = $${idx++}`);           values.push(filters.status); }
    if (filters.caseId)     { conditions.push(`case_id = $${idx++}`);          values.push(filters.caseId); }
    if (filters.assignedTo) { conditions.push(`investigator_id = $${idx++}`);  values.push(filters.assignedTo); }
    if (filters.search) {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM investigations ${where}`, values
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    values.push(limit, offset);
    const rows = await this.db.query<InvestigationRow>(
      `SELECT * FROM investigations ${where}
       ORDER BY ${safeSortBy} ${sortOrder}
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return { investigations: rows.map(r => this.toInvestigation(r)), total };
  }

  /** Returns the timeline_events JSONB array for a given investigation. */
  async getTimeline(id: string): Promise<Record<string, unknown>[]> {
    const row = await this.db.queryOne<{ timeline_events: Record<string, unknown>[] }>(
      'SELECT timeline_events FROM investigations WHERE id = $1', [id]
    );
    return row?.timeline_events ?? [];
  }

  /** Returns all investigations linked to a case. */
  async getCaseInvestigations(caseId: string): Promise<Investigation[]> {
    const rows = await this.db.query<InvestigationRow>(
      'SELECT * FROM investigations WHERE case_id = $1 ORDER BY created_at DESC',
      [caseId]
    );
    return rows.map(r => this.toInvestigation(r));
  }

  /** Close an investigation — sets status, closure_code, closure_notes, closed_at. */
  async closeInvestigation(
    id: string,
    data?: Record<string, unknown>
  ): Promise<Investigation | null> {
    const row = await this.db.queryOne<InvestigationRow>(
      `UPDATE investigations
       SET status        = 'completed',
           closure_code  = $1,
           closure_notes = $2,
           findings      = COALESCE($3, findings),
           closed_at     = NOW(),
           updated_at    = NOW()
       WHERE id = $4
       RETURNING *`,
      [
        data?.closureCode  ?? data?.closure_code  ?? 'TRUE_POSITIVE',
        data?.closureNotes ?? data?.notes         ?? data?.closure_notes ?? null,
        data?.findings     ?? null,
        id,
      ]
    );
    return row ? this.toInvestigation(row) : null;
  }

  async initialize(): Promise<void> {
    console.log('✓ InvestigationRepository initialized (PostgreSQL)');
  }
}
