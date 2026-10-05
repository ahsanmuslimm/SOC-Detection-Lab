/**
 * UserRepository
 *
 * PostgreSQL-backed implementation of IUserService.
 * Replaces InMemoryUserService when DATABASE_URL / DB_HOST is set.
 *
 * Table: users  (joined to roles for role name / permissions)
 * Passwords: bcryptjs (cost 12)
 */

import bcrypt from 'bcryptjs';
import { DatabaseClient } from '../client';

// ── Raw DB row shape ────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role_id: string;
  role_name?: string;
  status: string;
  last_login: Date | null;
  failed_login_attempts: number;
  locked_until: Date | null;
  profile_data: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

// ── Public shape (no password) ──────────────────────────────────────────────

export interface PublicUser {
  id: string;
  username: string;
  email: string;
  role: string;       // role name, e.g. "SOC_ANALYST"
  roleId: string;
  status: string;
  lastLogin: Date | null;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  profileData: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// ── Internal shape (includes hash — never sent to callers) ──────────────────

export interface InternalUser extends PublicUser {
  passwordHash: string;
}

// ── Query params ────────────────────────────────────────────────────────────

interface QueryUsersParams {
  limit?: number;
  offset?: number;
  filters?: {
    status?: string;
    role?: string;
    search?: string;
  };
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ── Repository ──────────────────────────────────────────────────────────────

export class UserRepository {
  constructor(private db: DatabaseClient) {}

  // ── Mapping helpers ───────────────────────────────────────────────────────

  private toPublicUser(row: UserRow): PublicUser {
    return {
      id:                   row.id,
      username:             row.username,
      email:                row.email,
      role:                 row.role_name ?? row.role_id,
      roleId:               row.role_id,
      status:               row.status,
      lastLogin:            row.last_login,
      failedLoginAttempts:  row.failed_login_attempts,
      lockedUntil:          row.locked_until,
      profileData:          row.profile_data ?? {},
      createdAt:            row.created_at,
      updatedAt:            row.updated_at,
    };
  }

  private toInternalUser(row: UserRow): InternalUser {
    return { ...this.toPublicUser(row), passwordHash: row.password_hash };
  }

  // ── SELECT with role name joined ──────────────────────────────────────────

  private readonly SELECT_USER = `
    SELECT u.*, r.name AS role_name
    FROM users u
    LEFT JOIN roles r ON u.role_id = r.id
  `;

  // ── Public API ────────────────────────────────────────────────────────────

  async getUser(id: string): Promise<PublicUser | null> {
    const row = await this.db.queryOne<UserRow>(
      `${this.SELECT_USER} WHERE u.id = $1`,
      [id]
    );
    return row ? this.toPublicUser(row) : null;
  }

  async createUser(userData: Record<string, unknown>): Promise<PublicUser> {
    const email    = String(userData.email    ?? '').toLowerCase();
    const username = String(userData.username ?? '').toLowerCase();

    // Duplicate check
    const existing = await this.db.queryOne<{ id: string }>(
      `SELECT id FROM users WHERE LOWER(email) = $1 OR LOWER(username) = $2`,
      [email, username]
    );
    if (existing) throw new Error('User already exists');

    const password = String(userData.password ?? 'TempPassword123!');
    const hash = await bcrypt.hash(password, 12);

    // Resolve role_id: accept either a role name (e.g. "SOC_ANALYST") or a UUID
    let roleId = String(userData.roleId ?? userData.role_id ?? '');
    if (!roleId) {
      const roleName = String(userData.role ?? 'SOC_ANALYST');
      const roleRow = await this.db.queryOne<{ id: string }>(
        'SELECT id FROM roles WHERE name = $1',
        [roleName]
      );
      if (!roleRow) throw new Error(`Role not found: ${roleName}`);
      roleId = roleRow.id;
    }

    const { password: _pw, role: _r, roleId: _ri, role_id: _rid, ...rest } = userData;

    const row = await this.db.queryOne<UserRow>(
      `INSERT INTO users (username, email, password_hash, role_id, status, profile_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        username,
        email,
        hash,
        roleId,
        String(rest.status ?? 'active'),
        JSON.stringify(rest.profileData ?? {}),
      ]
    );
    if (!row) throw new Error('User creation failed');

    // Re-fetch with role name joined
    return (await this.getUser(row.id))!;
  }

  async updateUser(id: string, userData: Record<string, unknown>): Promise<PublicUser | null> {
    const existing = await this.db.queryOne<UserRow>(
      'SELECT * FROM users WHERE id = $1', [id]
    );
    if (!existing) return null;

    const { password, role: _r, roleId: _ri, ...fields } = userData;

    const sets: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (password) {
      sets.push(`password_hash = $${idx++}`);
      values.push(await bcrypt.hash(String(password), 12));
    }
    if (fields.username !== undefined) { sets.push(`username = $${idx++}`); values.push(fields.username); }
    if (fields.email    !== undefined) { sets.push(`email = $${idx++}`);    values.push(String(fields.email).toLowerCase()); }
    if (fields.status   !== undefined) { sets.push(`status = $${idx++}`);   values.push(fields.status); }
    if (fields.profileData !== undefined) { sets.push(`profile_data = $${idx++}`); values.push(JSON.stringify(fields.profileData)); }

    if (sets.length === 0) return this.toPublicUser(existing);

    values.push(id);
    await this.db.query(
      `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $${idx}`,
      values
    );

    return (await this.getUser(id))!;
  }

  async deleteUser(id: string): Promise<boolean> {
    const rows = await this.db.query<{ id: string }>(
      'DELETE FROM users WHERE id = $1 RETURNING id', [id]
    );
    return rows.length > 0;
  }

  async queryUsers(params: QueryUsersParams = {}): Promise<{ users: PublicUser[]; total: number }> {
    const { limit = 25, offset = 0, filters = {}, sortBy = 'created_at', sortOrder = 'DESC' } = params;

    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (filters.status) { conditions.push(`u.status = $${idx++}`); values.push(filters.status); }
    if (filters.role)   { conditions.push(`r.name = $${idx++}`);   values.push(filters.role); }
    if (filters.search) {
      conditions.push(`(u.username ILIKE $${idx} OR u.email ILIKE $${idx})`);
      values.push(`%${filters.search}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const order = `ORDER BY u.${sortBy} ${sortOrder}`;

    const countRow = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM users u LEFT JOIN roles r ON u.role_id = r.id ${where}`,
      values
    );
    const total = parseInt(countRow?.count ?? '0', 10);

    values.push(limit, offset);
    const rows = await this.db.query<UserRow>(
      `${this.SELECT_USER} ${where} ${order} LIMIT $${idx++} OFFSET $${idx}`,
      values
    );

    return { users: rows.map(r => this.toPublicUser(r)), total };
  }

  /**
   * Find a user by email OR username (case-insensitive).
   * Returns the full internal row including password_hash — used only by AuthRepository.
   */
  async findByCredentials(identifier: string): Promise<InternalUser | null> {
    const needle = identifier.toLowerCase();
    const row = await this.db.queryOne<UserRow>(
      `${this.SELECT_USER}
       WHERE LOWER(u.email) = $1 OR LOWER(u.username) = $1`,
      [needle]
    );
    return row ? this.toInternalUser(row) : null;
  }

  /** Bcrypt comparison — used only by AuthRepository. */
  async verifyUserPassword(user: InternalUser, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.passwordHash);
  }

  /** Strip the password hash — convenience for callers that already have InternalUser. */
  toPublicUserFromInternal(user: InternalUser): PublicUser {
    const { passwordHash: _h, ...pub } = user;
    return pub;
  }

  async initialize(): Promise<void> {
    console.log('✓ UserRepository initialized (PostgreSQL)');
  }
}
