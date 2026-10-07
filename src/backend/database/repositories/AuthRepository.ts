/**
 * AuthRepository
 *
 * PostgreSQL-backed implementation of IAuthService.
 * Replaces InMemoryAuthService when DATABASE_URL / DB_HOST is set.
 *
 * - Refresh tokens stored in user_sessions (token_hash = SHA-256 of raw token)
 * - Login records last_login, resets failed_login_attempts
 * - Enforces locked_until account lockout
 * - JWT access tokens signed with JWT_SECRET (same as in-memory impl)
 *
 * Tables used: user_sessions, users (via UserRepository)
 */

import { createHash, randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { DatabaseClient } from '../client';
import { UserRepository, InternalUser } from './UserRepository';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret';
const ACCESS_TOKEN_TTL_SECONDS = parseInt(process.env.JWT_ACCESS_TTL ?? '900');   // 15 min default
const REFRESH_TOKEN_TTL_DAYS = parseInt(process.env.JWT_REFRESH_TTL_DAYS ?? '7');

// ── Helpers ──────────────────────────────────────────────────────────────────

function sha256(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function randomHex(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

function issueAccessToken(user: InternalUser): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      roleId: user.roleId,
    },
    JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_TTL_SECONDS }
  );
}

// ── Repository ────────────────────────────────────────────────────────────────

export class AuthRepository {
  constructor(
    private db: DatabaseClient,
    private users: UserRepository
  ) { }

  /**
   * Validate credentials, enforce lockout, issue JWT + refresh token.
   * Returns null on invalid credentials.
   */
  async login(credentials: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    const identifier = String(credentials.email ?? credentials.username ?? '');
    const password = String(credentials.password ?? '');

    const user = await this.users.findByCredentials(identifier);
    if (!user || user.status !== 'active') return null;

    // Enforce account lockout
    if (user.lockedUntil && new Date(user.lockedUntil) > new Date()) {
      return null;
    }

    const ok = await this.users.verifyUserPassword(user, password);
    if (!ok) {
      // Increment failed attempts (fire-and-forget, don't break login flow)
      await this.db.query(
        `UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1`,
        [user.id]
      ).catch(() => undefined);
      return null;
    }

    // Successful login — reset failed attempts + record last_login
    await this.db.query(
      `UPDATE users
       SET failed_login_attempts = 0, last_login = NOW(), locked_until = NULL
       WHERE id = $1`,
      [user.id]
    );

    const rawRefresh = randomHex();
    const tokenHash = sha256(rawRefresh);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000);
    const accessToken = issueAccessToken(user);

    await this.db.query(
      `INSERT INTO user_sessions (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, tokenHash, expiresAt]
    );

    return {
      user: this.users.toPublicUserFromInternal(user),
      accessToken,
      refreshToken: rawRefresh,
      tokenType: 'Bearer',
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  /**
   * Revoke all sessions for a user (logout).
   */
  async logout(userId: string, _sessionId?: string): Promise<void> {
    await this.db.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [userId]
    );
  }

  /**
   * Exchange a valid refresh token for a new access token.
   * Rotates the refresh token (delete old, insert new).
   */
  async refreshToken(rawToken: string): Promise<Record<string, unknown> | null> {
    const tokenHash = sha256(rawToken);

    const session = await this.db.queryOne<{
      id: string;
      user_id: string;
      expires_at: Date;
    }>(
      `SELECT id, user_id, expires_at
       FROM user_sessions
       WHERE token_hash = $1`,
      [tokenHash]
    );

    if (!session) return null;
    if (new Date(session.expires_at) < new Date()) {
      await this.db.query('DELETE FROM user_sessions WHERE id = $1', [session.id]);
      return null;
    }

    const user = await this.users.findByCredentials(session.user_id);
    if (!user) return null;

    // Rotate: delete old session, create new one
    const newRawRefresh = randomHex();
    const newHash = sha256(newRawRefresh);
    const newExpiry = new Date(Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 3600 * 1000);
    const accessToken = issueAccessToken(user);

    await this.db.transaction(async (client) => {
      await client.query('DELETE FROM user_sessions WHERE id = $1', [session.id]);
      await client.query(
        'INSERT INTO user_sessions (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
        [user.id, newHash, newExpiry]
      );
    });

    return {
      accessToken,
      refreshToken: newRawRefresh,
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    };
  }

  /**
   * Thin wrapper used by middleware — returns just the access token string.
   */
  async authenticate(credentials: Record<string, unknown>): Promise<string> {
    const result = await this.login(credentials);
    return result ? String(result.accessToken) : '';
  }

  /**
   * Verify a JWT access token; returns true if valid and not expired.
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      jwt.verify(token, JWT_SECRET);
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    // Prune expired sessions on startup (best-effort)
    await this.db.query(
      'DELETE FROM user_sessions WHERE expires_at < NOW()'
    ).catch(() => undefined);
    console.log('✓ AuthRepository initialized (PostgreSQL)');
  }
}
