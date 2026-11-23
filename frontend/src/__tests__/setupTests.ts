// frontend/src/__tests__/setupTests.ts
// TextEncoder/TextDecoder are set in polyfills.ts (loaded via jest `setupFiles`,
// which runs before this file) because undici references TextEncoder at import time.
import { fetch, Response, Request, Headers } from 'undici';

global.fetch = fetch as any;
global.Response = Response as any;
global.Request = Request as any;
global.Headers = Headers as any;

import { server } from '../mocks/server';
import '@testing-library/jest-dom';

// Start MSW server before all tests
beforeAll(() => server.listen());

// Reset handlers after each test
afterEach(() => server.resetHandlers());

// Close MSW server after all tests
afterAll(() => server.close());