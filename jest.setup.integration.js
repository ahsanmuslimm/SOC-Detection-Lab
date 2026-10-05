/**
 * Jest setup — integration tests
 *
 * Integration tests boot the real Express gateway with the mock-backed
 * orchestrator. They bind to TCP ports, so files must run serially
 * (see jest.config.integration.js maxWorkers setting).
 */

process.env.NODE_ENV = process.env.NODE_ENV || 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';

// Raise default listener backlog; tests start/stop servers repeatedly.
process.env.PORT = process.env.PORT || '3000';
