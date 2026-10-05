/**
 * ReportRepository
 *
 * PostgreSQL-backed implementation of IReportDomainService.
 * Replaces InMemoryReportService when DB is configured.
 *
 * Table: reports
 */

import { DatabaseClient } from '../client';

// ── Raw DB row ────────────────────────────────────────────────────────────────

interface ReportRow {
  id: string;
  title: string;
  report_type: string;
  status: string;
  generated_by_id: string | null;
  case_ids: string[];
  alert_ids: string[];
  date_range_start: Date | null;
  date_range_end: Date | null;
  report_data: Record<string, unknown> | null;
  file_format: string | null;
  file_location: string | null;
  distributed_to: string[];
  distributed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ── Public shape ──────────────────────────────────────────────────────────────

export interface Report {
  id: string;
  title: string;
  reportType: string;
  status: string;
  createdBy: string | null;       // alias for generated_by_id
  generatedById: string | null;
  caseIds: string[];
  alertIds: string[];
  dateRangeStart: Date | null;
  dateRangeEnd: Date | null;
  content: string | null;         // serialised from report_data.text for compat
  reportData: Record<string, unknown> | null;
  format: string | null;          // alias for file_format
  fileFormat: string | null;
  fileLocation: string | null;
  distributedTo: string[];
  distributedAt: Date | null;
  parameters: Record<string, unknown>;
  scope: Record<string, unknown>;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Query params ──────────────────────────────────────────────────────────────

interface QueryReportsParams {
  limit?: number;
  offset?: number;
  filters?: {
    status?: string;
    reportType?: string;
    search?: string;
  };
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ── Repository ────────────────────────────────────────────────────────────────

export class ReportRepository {
  constructor(private db: DatabaseClient) {}

  // ── Mapping ───────────────────────────────────────────────────────────────

  private toReport(row: ReportRow): Report {
    const data = row.report_data ?? {};
    return {
      id:              row.id,
      title:           row.title,
      reportType:      row.report_type,
      status:          row.status,
      createdBy:       row.generated_by_id,
      generatedById:   row.generated_by_id,
      caseIds:         row.case_ids    ?? [],
      alertIds:        row.alert_ids   ?? [],
      dateRangeStart:  row.date_range_start,
      dateRangeEnd:    row.date_range_end,
      content:         typeof data['text'] === 'string' ? data['text'] : null,
      reportData:      data,
      format:          row.file_format,
      fileFormat:      row.file_format,
      fileLocation:    row.file_location,
      distributedTo:   row.distributed_to ?? [],
      distributedAt:   row.distributed_at,
      parameters:      (data['parameters'] as Record<string, unknown>) ?? {},
      scope:           (data['scope']      as Record<string, unknown>) ?? {},
      generatedAt:     row.created_at,
      createdAt:       row.created_at,
      updatedAt:       row.updated_at,
    };
  }

  // ── IReportDomainService ──────────────────────────────────────────────────

  async generateReport(data: Record<string, unknown>): Promise<Report> {
    // Pack optional fields into report_data JSONB
    const reportData: Record<string, unknown> = {
      ...(data.content    ? { text:       data.content    } : {}),
      ...(data.parameters ? { parameters: data.parameters } : {}),
      ...(data.scope      ? { scope:      data.scope      } : {}),
      ...(data.summary    ? { summary:    data.summary    } : {}),
      ...(typeof data.reportData === 'object' && data.reportData !== null
        ? (data.reportData as Record<string, unknown>)
        : {}),
    };

    const row = await this.db.queryOne<ReportRow>(
      `INSERT INTO reports
         (title, report_type, status, generated_by_id,
          case_ids, alert_ids, date_range_start, date_range_end,
          report_data, file_format)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        data.title          ?? 'Untitled Report',
        data.reportType     ?? data.report_type ?? 'summary',
        data.status         ?? 'completed',
        data.createdBy      ?? data.generatedById ?? data.generated_by_id ?? null,
        data.caseIds        ?? data.case_ids  ?? [],
        data.alertIds       ?? data.alert_ids ?? [],
        data.dateRangeStart ?? data.date_range_start ?? null,
        data.dateRangeEnd   ?? data.date_range_end   ?? null,
        JSON.stringify(reportData),
        data.format         ?? data.fileFormat ?? data.file_format ?? 'json',
      ]
    );
    if (!row) throw new Error('Report creation failed');
    return this.toReport(row);
  }

  async getReport(id: string): Promise<Report | null> {
    const row = await this.db.queryOne<ReportRow>(
      'SELECT * FROM reports WHERE id = $1', [id]
    );
    return row ? this.toReport(row) : null;
  }

  async updateReport(id: string, data: Record<string, unknown>): Promise<Report | null> {
    const existing = await this.db.queryOne<{ id: string }>(
      'SELECT id FROM reports WHERE id = $1', [id]
    );
    if (!existing) return null;

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const colMap: Record<string, string> = {
      title:          'title',
      reportType:     'report_type',
      status:         'status',
      fileFormat:     'file_format',
      format:         'file_format',
      fileLocation:   'file_location',
      distributedTo:  'distributed_to',
      distributedAt:  'distributed_at',
    };

    const seen = new Set<string>();
    for (const [key, col] of Object.entries(colMap)) {
      if (data[key] !== undefined && !seen.has(col)) {
        seen.add(col);
        sets.push(`${col} = $${idx++}`);
        values.push(data[key]);
      }
    }

    // Merge report_data if content or reportData supplied
    if (data.content !== undefined || data.reportData !== undefined) {
      const current = await this.db.queryOne<{ report_data: Record<string, unknown> }>(
        'SELECT report_data FROM reports WHERE id = $1', [id]
      );
      const merged = {
        ...(current?.report_data ?? {}),
        ...(data.content    ? { text:       data.content    } : {}),
        ...(typeof data.reportData === 'object' && data.reportData !== null
          ? (data.reportData as Record<string, unknown>)
          : {}),
      };
      sets.push(`report_data = $${idx++}`);
      values.push(JSON.stringify(merged));
    }

    if (sets.length === 0) return this.getReport(id);

    values.push(id);
    const row = await this.db.queryOne<ReportRow>(
      `UPDATE reports SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING *`,
      values
    );
    return row ? this.toReport(row) : null;
  }

  async deleteReport(id: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      'DELETE FROM reports WHERE id = $1 RETURNING id', [id]
    );
    return rows.length > 0;
  }

  async queryReports(params: QueryReportsParams = {}): Promise<{ reports: Report[]; total: number }> {
    const {
      limit     = 25,
      offset    = 0,
      filters   = {},
      sortBy    = 'created_at',
      sortOrder = 'DESC',
    } = params;

    const safeSortBy = ['created_at', 'updated_at', 'status', 'report_type', 'title']
      .includes(sortBy) ? sortBy : 'created_at';

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.status)     { conditions.push(`status = $${idx++}`);      values.push(filters.status); }
    if (filters.reportType) { conditions.push(`report_type = $${idx++}`); values.push(filters.reportType); }
    if (filters.search) {
      conditions.push(`(title ILIKE $${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM reports ${where}`, values
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    values.push(limit, offset);
    const rows = await this.db.query<ReportRow>(
      `SELECT * FROM reports ${where}
       ORDER BY ${safeSortBy} ${sortOrder}
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return { reports: rows.map(r => this.toReport(r)), total };
  }

  async initialize(): Promise<void> {
    console.log('✓ ReportRepository initialized (PostgreSQL)');
  }
}
