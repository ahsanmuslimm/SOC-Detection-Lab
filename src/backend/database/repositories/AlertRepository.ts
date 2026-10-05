/**
 * AlertRepository
 *
 * PostgreSQL-backed implementation of IAlertDomainService + IQueryDomainService.
 * Replaces InMemoryAlertService + InMemoryQueryService when DB is configured.
 *
 * Table: alerts
 */

import { DatabaseClient } from '../client';

// ── Raw DB row ────────────────────────────────────────────────────────────────

interface AlertRow {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  alert_type: string;
  source_system: string | null;
  source_ip: string | null;
  rule_id: string | null;
  detection_ids: string[];
  assigned_to_id: string | null;
  closed_by_id: string | null;
  acknowledged_at: Date | null;
  closed_at: Date | null;
  created_by: string;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
  // added by window function in queryAlerts
  total_count?: string;
}

// ── Public shape ──────────────────────────────────────────────────────────────

export interface Alert {
  id: string;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  alertType: string;
  sourceSystem: string | null;
  sourceIp: string | null;
  ruleId: string | null;
  detectionIds: string[];
  assignedToId: string | null;
  closedById: string | null;
  acknowledgedAt: Date | null;
  closedAt: Date | null;
  createdBy: string;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ── Query params ──────────────────────────────────────────────────────────────

interface QueryAlertsParams {
  limit?: number;
  offset?: number;
  filters?: {
    status?: string;
    severity?: string;
    assignedTo?: string;
    sourceSystem?: string;
    search?: string;
  };
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ── Repository ────────────────────────────────────────────────────────────────

export class AlertRepository {
  constructor(private db: DatabaseClient) {}

  // ── Mapping ───────────────────────────────────────────────────────────────

  private toAlert(row: AlertRow): Alert {
    return {
      id:             row.id,
      title:          row.title,
      description:    row.description,
      severity:       row.severity,
      status:         row.status,
      alertType:      row.alert_type,
      sourceSystem:   row.source_system,
      sourceIp:       row.source_ip,
      ruleId:         row.rule_id,
      detectionIds:   row.detection_ids ?? [],
      assignedToId:   row.assigned_to_id,
      closedById:     row.closed_by_id,
      acknowledgedAt: row.acknowledged_at,
      closedAt:       row.closed_at,
      createdBy:      row.created_by,
      metadata:       row.metadata ?? {},
      createdAt:      row.created_at,
      updatedAt:      row.updated_at,
    };
  }

  // ── IAlertDomainService ───────────────────────────────────────────────────

  async createAlert(data: Record<string, unknown>): Promise<Alert> {
    const row = await this.db.queryOne<AlertRow>(
      `INSERT INTO alerts
         (title, description, severity, status, alert_type, source_system,
          source_ip, rule_id, assigned_to_id, created_by, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        data.title        ?? '',
        data.description  ?? null,
        data.severity     ?? 'medium',
        data.status       ?? 'open',
        data.alertType    ?? data.alert_type ?? 'manual',
        data.sourceSystem ?? data.source_system ?? null,
        data.sourceIp     ?? data.source_ip    ?? null,
        data.ruleId       ?? data.rule_id      ?? null,
        data.assignedToId ?? data.assigned_to_id ?? null,
        data.createdBy    ?? data.created_by   ?? 'system',
        JSON.stringify(data.metadata ?? {}),
      ]
    );
    if (!row) throw new Error('Alert creation failed');
    return this.toAlert(row);
  }

  async getAlert(id: string): Promise<Alert | null> {
    const row = await this.db.queryOne<AlertRow>(
      'SELECT * FROM alerts WHERE id = $1', [id]
    );
    return row ? this.toAlert(row) : null;
  }

  async updateAlert(id: string, data: Record<string, unknown>): Promise<Alert | null> {
    const existing = await this.db.queryOne<AlertRow>(
      'SELECT id FROM alerts WHERE id = $1', [id]
    );
    if (!existing) return null;

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const colMap: Record<string, string> = {
      title:        'title',
      description:  'description',
      severity:     'severity',
      status:       'status',
      alertType:    'alert_type',
      sourceSystem: 'source_system',
      sourceIp:     'source_ip',
      ruleId:       'rule_id',
      assignedToId: 'assigned_to_id',
      closedById:   'closed_by_id',
      acknowledgedAt: 'acknowledged_at',
      closedAt:     'closed_at',
      metadata:     'metadata',
    };

    for (const [key, col] of Object.entries(colMap)) {
      if (data[key] !== undefined) {
        sets.push(`${col} = $${idx++}`);
        values.push(key === 'metadata' ? JSON.stringify(data[key]) : data[key]);
      }
    }

    if (sets.length === 0) return this.getAlert(id);

    values.push(id);
    const row = await this.db.queryOne<AlertRow>(
      `UPDATE alerts SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING *`,
      values
    );
    return row ? this.toAlert(row) : null;
  }

  async deleteAlert(id: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      'DELETE FROM alerts WHERE id = $1 RETURNING id', [id]
    );
    return rows.length > 0;
  }

  async getAlertStats(_filters?: unknown): Promise<Record<string, unknown>> {
    const row = await this.db.queryOne<Record<string, string>>(`
      SELECT
        COUNT(*)                                        AS total,
        COUNT(*) FILTER (WHERE status = 'open')         AS open,
        COUNT(*) FILTER (WHERE status = 'acknowledged') AS acknowledged,
        COUNT(*) FILTER (WHERE status = 'investigating')AS investigating,
        COUNT(*) FILTER (WHERE status = 'resolved')     AS resolved,
        COUNT(*) FILTER (WHERE status = 'closed')       AS closed,
        COUNT(*) FILTER (WHERE severity = 'critical')   AS critical,
        COUNT(*) FILTER (WHERE severity = 'high')       AS high,
        COUNT(*) FILTER (WHERE severity = 'medium')     AS medium,
        COUNT(*) FILTER (WHERE severity = 'low')        AS low,
        COUNT(*) FILTER (WHERE assigned_to_id IS NULL)  AS unassigned
      FROM alerts
    `);

    const s = row ?? {};
    return {
      total:         parseInt(s['total']         ?? '0', 10),
      open:          parseInt(s['open']          ?? '0', 10),
      acknowledged:  parseInt(s['acknowledged']  ?? '0', 10),
      investigating: parseInt(s['investigating'] ?? '0', 10),
      resolved:      parseInt(s['resolved']      ?? '0', 10),
      closed:        parseInt(s['closed']        ?? '0', 10),
      critical:      parseInt(s['critical']      ?? '0', 10),
      high:          parseInt(s['high']          ?? '0', 10),
      medium:        parseInt(s['medium']        ?? '0', 10),
      low:           parseInt(s['low']           ?? '0', 10),
      unassigned:    parseInt(s['unassigned']    ?? '0', 10),
      lastUpdated:   new Date().toISOString(),
    };
  }

  // ── IQueryDomainService ───────────────────────────────────────────────────

  async queryAlerts(params: QueryAlertsParams = {}): Promise<{ alerts: Alert[]; total: number }> {
    const {
      limit     = 25,
      offset    = 0,
      filters   = {},
      sortBy    = 'created_at',
      sortOrder = 'DESC',
    } = params;

    // Whitelist sortBy to prevent SQL injection
    const safeSortBy = ['created_at', 'updated_at', 'severity', 'status', 'title'].includes(sortBy)
      ? sortBy : 'created_at';

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.status)       { conditions.push(`status = $${idx++}`);          values.push(filters.status); }
    if (filters.severity)     { conditions.push(`severity = $${idx++}`);        values.push(filters.severity); }
    if (filters.assignedTo)   { conditions.push(`assigned_to_id = $${idx++}`);  values.push(filters.assignedTo); }
    if (filters.sourceSystem) { conditions.push(`source_system = $${idx++}`);   values.push(filters.sourceSystem); }
    if (filters.search) {
      conditions.push(`(title ILIKE $${idx} OR description ILIKE $${idx} OR source_ip::text ILIKE $${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count
    const countRow = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM alerts ${where}`, values
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    // Data
    values.push(limit, offset);
    const rows = await this.db.query<AlertRow>(
      `SELECT * FROM alerts ${where}
       ORDER BY ${safeSortBy} ${sortOrder}
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return { alerts: rows.map(r => this.toAlert(r)), total };
  }

  async initialize(): Promise<void> {
    console.log('✓ AlertRepository initialized (PostgreSQL)');
  }
}
