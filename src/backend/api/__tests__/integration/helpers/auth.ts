/**
 * Integration test auth helpers
 *
 * Signs real JWTs with the test secret so contract tests exercise the
 * production authentication path (no synthetic token bypass in the API).
 *
 * @module tests/integration/helpers/auth
 */

import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';

const SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

function signToken(role: string, userId: string, username: string, email: string): string {
  return jwt.sign(
    { userId, username, email, role, roleId: role.toLowerCase(), jti: randomBytes(8).toString('hex') },
    SECRET,
    { expiresIn: '1h' }
  );
}

/** Full-access principal — maps to the ADMIN role ('*' permissions). */
export function adminAuthHeader(): string {
  return `Bearer ${signToken('ADMIN', 'user-admin', 'admin', 'admin@soc.local')}`;
}

/** Analyst workflow principal — SOC_ANALYST (read + acknowledge + case create). */
export function analystAuthHeader(): string {
  return `Bearer ${signToken('SOC_ANALYST', 'user-123', 'analyst1', 'analyst1@soc.local')}`;
}

/** Read-only principal — VIEWER. */
export function viewerAuthHeader(): string {
  return `Bearer ${signToken('VIEWER', 'user-456', 'viewer1', 'viewer1@soc.local')}`;
}
