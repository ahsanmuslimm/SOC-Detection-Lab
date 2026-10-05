/**
 * RBACRepository
 *
 * PostgreSQL-backed implementation of IRBACService.
 * Replaces InMemoryRBACService when DB is configured.
 *
 * Table: roles  (permissions stored as JSONB string array)
 */

import { DatabaseClient } from '../client';

// ── Raw DB row ────────────────────────────────────────────────────────────────

interface RoleRow {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  created_at: Date;
  updated_at: Date;
}

// ── Canonical permission list (no DB table — stable enum) ─────────────────────

const ALL_PERMISSIONS: Array<{ name: string; description: string; resource: string; action: string }> = [
  { name: 'alert:read',                resource: 'alert',       action: 'read',   description: 'View alerts' },
  { name: 'alert:create',              resource: 'alert',       action: 'create', description: 'Create alerts' },
  { name: 'alert:update',              resource: 'alert',       action: 'update', description: 'Update alerts' },
  { name: 'alert:delete',              resource: 'alert',       action: 'delete', description: 'Delete alerts' },
  { name: 'alert:acknowledge',         resource: 'alert',       action: 'acknowledge', description: 'Acknowledge alerts' },
  { name: 'case:read',                 resource: 'case',        action: 'read',   description: 'View cases' },
  { name: 'case:create',               resource: 'case',        action: 'create', description: 'Create cases' },
  { name: 'case:update',               resource: 'case',        action: 'update', description: 'Update cases' },
  { name: 'case:delete',               resource: 'case',        action: 'delete', description: 'Delete cases' },
  { name: 'investigation:read',        resource: 'investigation', action: 'read', description: 'View investigations' },
  { name: 'investigation:create',      resource: 'investigation', action: 'create', description: 'Create investigations' },
  { name: 'investigation:update',      resource: 'investigation', action: 'update', description: 'Update investigations' },
  { name: 'report:read',               resource: 'report',      action: 'read',   description: 'View reports' },
  { name: 'report:create',             resource: 'report',      action: 'create', description: 'Create reports' },
  { name: 'report:delete',             resource: 'report',      action: 'delete', description: 'Delete reports' },
  { name: 'rule:read',                 resource: 'rule',        action: 'read',   description: 'View detection rules' },
  { name: 'rule:create',               resource: 'rule',        action: 'create', description: 'Create detection rules' },
  { name: 'rule:update',               resource: 'rule',        action: 'update', description: 'Update detection rules' },
  { name: 'rule:delete',               resource: 'rule',        action: 'delete', description: 'Delete detection rules' },
  { name: 'rule:deploy',               resource: 'rule',        action: 'deploy', description: 'Deploy detection rules' },
  { name: 'user:read',                 resource: 'user',        action: 'read',   description: 'View users' },
  { name: 'user:create',               resource: 'user',        action: 'create', description: 'Create users' },
];

// ── Repository ────────────────────────────────────────────────────────────────

export class RBACRepository {
  constructor(private db: DatabaseClient) {}

  // ── Mapping ───────────────────────────────────────────────────────────────

  private toRole(row: RoleRow): Record<string, unknown> {
    return {
      id:          row.id,
      name:        row.name,
      description: row.description,
      permissions: row.permissions ?? [],
      createdAt:   row.created_at,
      updatedAt:   row.updated_at,
    };
  }

  // ── IRBACService ──────────────────────────────────────────────────────────

  /** Synchronous permission check — fetches role from DB only during initialize(),
   *  then caches in memory for fast request-time checks. */
  private roleCache: Map<string, string[]> = new Map();

  async loadCache(): Promise<void> {
    const rows = await this.db.query<RoleRow>('SELECT id, name, permissions FROM roles');
    this.roleCache.clear();
    for (const row of rows) {
      // Index by both id and name for flexible lookup
      this.roleCache.set(row.id,   row.permissions ?? []);
      this.roleCache.set(row.name, row.permissions ?? []);
    }
  }

  hasPermission(roleIdOrName: string, permission: string): boolean {
    const perms = this.roleCache.get(roleIdOrName) ?? [];
    return perms.includes('*') || perms.includes(permission);
  }

  getPermissions(roleIdOrName: string): string[] {
    return this.roleCache.get(roleIdOrName) ?? [];
  }

  async addPermission(roleIdOrName: string, permission: string): Promise<void> {
    // Resolve to id first
    const row = await this.db.queryOne<RoleRow>(
      'SELECT * FROM roles WHERE id = $1 OR name = $1', [roleIdOrName]
    );
    if (!row) throw new Error(`Role not found: ${roleIdOrName}`);
    const perms = new Set(row.permissions ?? []);
    perms.add(permission);
    await this.db.query(
      "UPDATE roles SET permissions = $1::jsonb WHERE id = $2",
      [JSON.stringify([...perms]), row.id]
    );
    await this.loadCache();
  }

  // ── Extended methods used by RBACController ───────────────────────────────

  async getAllRoles(): Promise<{ roles: Record<string, unknown>[]; total: number }> {
    const rows = await this.db.query<RoleRow>(
      'SELECT * FROM roles ORDER BY name'
    );
    return { roles: rows.map(r => this.toRole(r)), total: rows.length };
  }

  async getRole(roleId: string): Promise<Record<string, unknown> | null> {
    const row = await this.db.queryOne<RoleRow>(
      'SELECT * FROM roles WHERE id = $1 OR name = $1', [roleId]
    );
    return row ? this.toRole(row) : null;
  }

  async updateRolePermissions(
    roleId: string,
    data: Record<string, unknown>
  ): Promise<Record<string, unknown> | null> {
    const permissions = data.permissions as string[] | undefined;
    if (!Array.isArray(permissions)) throw new Error('permissions must be an array');

    // Validate each permission string
    const permRegex = /^(\*|[a-z0-9_-]+:[a-z0-9_-]+)$/;
    for (const p of permissions) {
      if (!permRegex.test(p)) throw new Error(`Invalid permission format: ${p}`);
    }

    // Prevent removing all permissions from admin role
    const role = await this.db.queryOne<RoleRow>(
      'SELECT * FROM roles WHERE id = $1 OR name = $1', [roleId]
    );
    if (!role) return null;
    if (role.name === 'ADMIN' && permissions.length === 0) {
      throw new Error('Cannot remove all permissions from the ADMIN role');
    }

    const row = await this.db.queryOne<RoleRow>(
      `UPDATE roles SET permissions = $1::jsonb, updated_at = NOW()
       WHERE id = $2 OR name = $2 RETURNING *`,
      [JSON.stringify(permissions), roleId]
    );
    if (row) await this.loadCache();
    return row ? this.toRole(row) : null;
  }

  async getAllPermissions(): Promise<{ permissions: typeof ALL_PERMISSIONS; total: number }> {
    return { permissions: ALL_PERMISSIONS, total: ALL_PERMISSIONS.length };
  }

  async getUserPermissions(userId: string): Promise<{ permissions: string[]; role: string }> {
    const row = await this.db.queryOne<{ permissions: string[]; name: string }>(
      `SELECT r.permissions, r.name
       FROM users u JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [userId]
    );
    return {
      permissions: row?.permissions ?? [],
      role:        row?.name        ?? 'UNKNOWN',
    };
  }

  async initialize(): Promise<void> {
    await this.loadCache();
    console.log(`✓ RBACRepository initialized (PostgreSQL, ${this.roleCache.size / 2} roles cached)`);
  }
}
