/**
 * REST API Module - Public API
 *
 * Main exports for the REST API layer.
 *
 * @module api
 */

export * from './types';
export { ApiGateway, createApiGateway, getApiGateway, setApiGateway, resetApiGateway } from './gateway';
export * from './middleware';
export * from './controllers';
