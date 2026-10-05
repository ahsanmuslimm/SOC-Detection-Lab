/**
 * SOC Detection Lab — Backend Entry Point
 *
 * Boots the service orchestrator and starts the REST API gateway.
 *
 * Usage:
 *   npm run dev:backend   (tsx watch)
 *   npm run build:backend && node dist/backend/index.js
 *
 * @module backend/index
 */

import dotenv from 'dotenv';
import { createOrchestrator } from './services/orchestrator';
import { createApiGateway } from './api/gateway';

// Load environment configuration before any service reads process.env.
dotenv.config();

const PORT = Number(process.env.PORT || 3000);

async function main(): Promise<void> {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║   SOC Detection Lab — Backend            ║');
  console.log('╚══════════════════════════════════════════╝');

  const orchestrator = createOrchestrator();
  const gateway = createApiGateway(orchestrator);

  await gateway.start(PORT);

  // Keep the process alive; SIGTERM/SIGINT are handled inside the gateway.
  process.on('unhandledRejection', (reason) => {
    console.error('[Backend] Unhandled promise rejection:', reason);
  });
  process.on('uncaughtException', (error) => {
    console.error('[Backend] Uncaught exception:', error);
  });
}

main().catch((error) => {
  console.error('[Backend] Fatal startup error:', error);
  process.exit(1);
});
