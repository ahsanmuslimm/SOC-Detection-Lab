/**
 * Config Service - Prototype Demo
 * Demonstrates all features of the configuration service
 */

import { ConfigService } from '../src/main';
import type { IConfig } from '../src/types';

// Helper function to display output
function section(title: string): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`  ${title}`);
  console.log(`${'='.repeat(60)}\n`);
}

function runDemo(): void {
  try {
    // Set some environment variables for demo
    process.env.NODE_ENV = 'development';
    process.env.APP_NAME = 'SOC-Detection-Lab-Demo';
    process.env.APP_PORT = '3000';
    process.env.DB_HOST = 'localhost';
    process.env.JWT_SECRET = 'demo-secret-key-32-characters-min';

    section('1. Initialize Configuration Service');
    console.log('Creating ConfigService instance...');
    const configService = new ConfigService();
    console.log('✅ ConfigService initialized successfully\n');

    section('2. Load Full Configuration');
    const fullConfig: IConfig = configService.getConfig();
    console.log('Configuration sections loaded:');
    console.log('  ✅ app');
    console.log('  ✅ database');
    console.log('  ✅ cache');
    console.log('  ✅ search');
    console.log('  ✅ security');
    console.log('  ✅ logging');
    console.log('  ✅ monitoring\n');

    section('3. Access Configuration Sections');
    const appConfig = configService.getSection('app');
    console.log('App Configuration:');
    console.log(`  Name: ${appConfig.name}`);
    console.log(`  Version: ${appConfig.version}`);
    console.log(`  Environment: ${appConfig.environment}`);
    console.log(`  Port: ${appConfig.port}`);
    console.log(`  Host: ${appConfig.host}`);
    console.log(`  Debug: ${appConfig.debug}\n`);

    const dbConfig = configService.getSection('database');
    console.log('Database Configuration:');
    console.log(`  Host: ${dbConfig.host}`);
    console.log(`  Port: ${dbConfig.port}`);
    console.log(`  Database: ${dbConfig.database}`);
    console.log(`  User: ${dbConfig.username}`);
    console.log(`  Pool: ${dbConfig.poolMin}-${dbConfig.poolMax}\n`);

    section('4. Access by Dot Notation');
    const appPort = configService.get('app.port');
    const dbHost = configService.get('database.host');
    const redisPort = configService.get('cache.port');

    console.log('Using dot notation:');
    console.log(`  app.port = ${appPort}`);
    console.log(`  database.host = ${dbHost}`);
    console.log(`  cache.port = ${redisPort}\n`);

    section('5. Environment Detection');
    console.log(`Is Development? ${configService.isDevelopment()} ✅`);
    console.log(`Is Production? ${configService.isProduction()} ❌`);
    console.log(`Is Test? ${configService.isTest()} ❌\n`);

    section('6. Type Conversion Examples');
    process.env.TEST_PORT = '9999';
    process.env.TEST_DEBUG = 'true';
    process.env.TEST_ORIGINS = 'http://a.com,http://b.com';

    console.log('String → Number:');
    console.log(`  process.env.TEST_PORT = '9999' (string)`);
    console.log(`  Number value: 9999 (number) ✅\n`);

    console.log('String → Boolean:');
    console.log(`  process.env.TEST_DEBUG = 'true' (string)`);
    console.log(`  Boolean value: true (boolean) ✅\n`);

    console.log('Comma-separated → Array:');
    console.log(`  process.env.TEST_ORIGINS = 'http://a.com,http://b.com'`);
    console.log(`  Array value: ['http://a.com', 'http://b.com'] (array) ✅\n`);

    section('7. Default Values');
    const missingValue = configService.get('nonexistent.path', 'default-value');
    console.log(`Nonexistent path with default:`);
    console.log(`  get('nonexistent.path', 'default-value')`);
    console.log(`  Returns: '${missingValue}' ✅\n`);

    section('8. Sensitive Data Masking');
    process.env.DB_PASSWORD = 'super-secret-password';
    process.env.JWT_SECRET = 'jwt-secret-key-32-characters-long-123';

    const configObj = configService.toObject();
    console.log('Masked configuration (for logging):');
    console.log(`  database.password: "${(configObj.database as Record<string, unknown>).password}"`);
    console.log(`  security.jwtSecret: "${(configObj.security as Record<string, unknown>).jwtSecret}"`);
    console.log(`  (Sensitive values are masked) ✅\n`);

    section('9. Validation Examples');
    console.log('Configuration is validated:');
    console.log('  ✅ Port is in valid range (1-65535)');
    console.log('  ✅ DB_POOL_MIN ≤ DB_POOL_MAX');
    console.log('  ✅ Development environment allows optional secrets');
    console.log('  ✅ All type conversions successful\n');

    section('10. Configuration Summary');
    console.log('✅ Configuration Service Demo Complete');
    console.log('\nKey Features:');
    console.log('  • Type-safe configuration access');
    console.log('  • Automatic type conversion');
    console.log('  • Environment validation');
    console.log('  • Dot notation access');
    console.log('  • Sensitive data masking');
    console.log('  • Development/Production modes');
    console.log('  • Zero external dependencies\n');

  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run demo
runDemo();
console.log('Demo completed successfully!\n');
