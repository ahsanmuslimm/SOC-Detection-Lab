/**
 * DetectionRuleRepository
 *
 * PostgreSQL-backed implementation of IDetectionDomainService.
 * Replaces InMemoryDetectionService when DB is configured.
 *
 * Table: detection_rules
 */

import { DatabaseClient } from '../client';

// ── Raw DB row ────────────────────────────────────────────────────────────────

interface RuleRow {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  status: string;
  rule_type: string;
  mitre_technique_id: string | null;
  rule_definition: Record<string, unknown>;
  test_data: unknown[];
  metadata: Record<string, unknown>;
  enabled: boolean;
  false_positive_count: number;
  created_by_id: string | null;
  updated_by_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// ── Public shape ──────────────────────────────────────────────────────────────

export interface DetectionRule {
  id: string;
  name: string;
  description: string | null;
  severity: string;
  status: string;
  ruleType: string;
  techniqueId: string | null;
  ruleDefinition: Record<string, unknown>;
  testData: unknown[];
  metadata: Record<string, unknown>;
  enabled: boolean;
  falsePositives: number;
  createdById: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ── Query params ──────────────────────────────────────────────────────────────

interface QueryRulesParams {
  limit?: number;
  offset?: number;
  filters?: {
    status?: string;
    severity?: string;
    techniqueId?: string;
    enabled?: boolean;
    search?: string;
  };
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ── Repository ────────────────────────────────────────────────────────────────

export class DetectionRuleRepository {
  constructor(private db: DatabaseClient) {}

  // ── Mapping ───────────────────────────────────────────────────────────────

  private toRule(row: RuleRow): DetectionRule {
    return {
      id:             row.id,
      name:           row.name,
      description:    row.description,
      severity:       row.severity,
      status:         row.status,
      ruleType:       row.rule_type,
      techniqueId:    row.mitre_technique_id,
      ruleDefinition: row.rule_definition ?? {},
      testData:       row.test_data       ?? [],
      metadata:       row.metadata        ?? {},
      enabled:        row.enabled,
      falsePositives: row.false_positive_count,
      createdById:    row.created_by_id,
      updatedById:    row.updated_by_id,
      createdAt:      row.created_at,
      updatedAt:      row.updated_at,
    };
  }

  // ── IDetectionDomainService ───────────────────────────────────────────────

  async createRule(data: Record<string, unknown>): Promise<DetectionRule> {
    const row = await this.db.queryOne<RuleRow>(
      `INSERT INTO detection_rules
         (name, description, severity, status, rule_type, mitre_technique_id,
          rule_definition, enabled, created_by_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        data.name           ?? '',
        data.description    ?? null,
        data.severity       ?? 'medium',
        data.status         ?? 'draft',
        data.ruleType       ?? data.rule_type ?? 'atomic',
        data.techniqueId    ?? data.mitre_technique_id ?? null,
        JSON.stringify(data.ruleDefinition ?? data.rule_definition ?? {}),
        data.enabled        !== undefined ? data.enabled : true,
        data.createdById    ?? data.created_by_id ?? null,
      ]
    );
    if (!row) throw new Error('Rule creation failed');
    return this.toRule(row);
  }

  async getRule(id: string): Promise<DetectionRule | null> {
    const row = await this.db.queryOne<RuleRow>(
      'SELECT * FROM detection_rules WHERE id = $1', [id]
    );
    return row ? this.toRule(row) : null;
  }

  async updateRule(id: string, data: Record<string, unknown>): Promise<DetectionRule | null> {
    const existing = await this.db.queryOne<{ id: string }>(
      'SELECT id FROM detection_rules WHERE id = $1', [id]
    );
    if (!existing) return null;

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const colMap: Record<string, string> = {
      name:           'name',
      description:    'description',
      severity:       'severity',
      status:         'status',
      ruleType:       'rule_type',
      techniqueId:    'mitre_technique_id',
      ruleDefinition: 'rule_definition',
      enabled:        'enabled',
      updatedById:    'updated_by_id',
      metadata:       'metadata',
    };

    for (const [key, col] of Object.entries(colMap)) {
      if (data[key] !== undefined) {
        sets.push(`${col} = $${idx++}`);
        const val = data[key];
        values.push(
          (key === 'ruleDefinition' || key === 'metadata')
            ? JSON.stringify(val)
            : val
        );
      }
    }

    if (sets.length === 0) return this.getRule(id);

    values.push(id);
    const row = await this.db.queryOne<RuleRow>(
      `UPDATE detection_rules SET ${sets.join(', ')}, updated_at = NOW()
       WHERE id = $${idx} RETURNING *`,
      values
    );
    return row ? this.toRule(row) : null;
  }

  async deleteRule(id: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      'DELETE FROM detection_rules WHERE id = $1 RETURNING id', [id]
    );
    return rows.length > 0;
  }

  async queryRules(params: QueryRulesParams = {}): Promise<{ rules: DetectionRule[]; total: number }> {
    const {
      limit     = 25,
      offset    = 0,
      filters   = {},
      sortBy    = 'created_at',
      sortOrder = 'DESC',
    } = params;

    const safeSortBy = ['created_at', 'updated_at', 'severity', 'status', 'name']
      .includes(sortBy) ? sortBy : 'created_at';

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.status)      { conditions.push(`status = $${idx++}`);               values.push(filters.status); }
    if (filters.severity)    { conditions.push(`severity = $${idx++}`);             values.push(filters.severity); }
    if (filters.techniqueId) { conditions.push(`mitre_technique_id = $${idx++}`);   values.push(filters.techniqueId); }
    if (filters.enabled !== undefined) {
      conditions.push(`enabled = $${idx++}`);
      values.push(filters.enabled);
    }
    if (filters.search) {
      conditions.push(`(name ILIKE $${idx} OR description ILIKE $${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM detection_rules ${where}`, values
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    values.push(limit, offset);
    const rows = await this.db.query<RuleRow>(
      `SELECT * FROM detection_rules ${where}
       ORDER BY ${safeSortBy} ${sortOrder}
       LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return { rules: rows.map(r => this.toRule(r)), total };
  }

  /**
   * testRule — runs mock logic (no real engine) but persists the result
   * into the rule's metadata JSONB so it's visible after restart.
   */
  async testRule(id: string, data?: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const rule = await this.db.queryOne<RuleRow>(
      'SELECT * FROM detection_rules WHERE id = $1', [id]
    );
    if (!rule) return null;

    const result = {
      ruleId:        id,
      matched:       true,
      passed:        true,
      executedAt:    new Date().toISOString(),
      testEvents:    (data?.events as unknown[] | undefined)?.length ?? 12,
      matchedEvents: 3,
      results: [
        { case: 'positive', matched: true  },
        { case: 'negative', matched: false },
      ],
    };

    // Persist last test result in metadata
    await this.db.query(
      `UPDATE detection_rules
       SET metadata = jsonb_set(COALESCE(metadata,'{}'), '{lastTestResult}', $1::jsonb),
           updated_at = NOW()
       WHERE id = $2`,
      [JSON.stringify(result), id]
    );

    return result;
  }

  /**
   * deployRule — sets status to 'production' and records deployedAt timestamp.
   */
  async deployRule(id: string): Promise<DetectionRule | null> {
    const deployedAt = new Date().toISOString();
    const row = await this.db.queryOne<RuleRow>(
      `UPDATE detection_rules
       SET status = 'production',
           metadata = jsonb_set(COALESCE(metadata,'{}'), '{deployedAt}', $1::jsonb),
           updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [JSON.stringify(deployedAt), id]
    );
    return row ? this.toRule(row) : null;
  }

  async initialize(): Promise<void> {
    console.log('✓ DetectionRuleRepository initialized (PostgreSQL)');
  }
}
