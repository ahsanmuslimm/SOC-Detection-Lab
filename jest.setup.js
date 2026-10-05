/**
 * Jest setup — unit tests
 *
 * Runs before every unit test file. Keep it light: no timers, no network.
 */

// Fail tests that leave open handles via accidental real network calls.
// (Individual tests that need network mock it explicitly.)

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
