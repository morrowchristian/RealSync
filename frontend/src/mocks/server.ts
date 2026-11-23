// frontend/src/mocks/server.ts
// setupServer lives in `msw/node` in both v1 and v2 (the main `msw` entry
// only exports setupWorker for browsers).
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);