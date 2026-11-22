// Polyfills that must load before any other test setup (notably undici,
// which references web globals at import time). Loaded via jest `setupFiles`
// in jest.config.ts, which runs before `setupFilesAfterEach` (setupTests.ts).
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, WritableStream, TransformStream } from 'stream/web';
import { MessageChannel, MessagePort, BroadcastChannel } from 'worker_threads';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
(global as any).ReadableStream = ReadableStream;
(global as any).WritableStream = WritableStream;
(global as any).TransformStream = TransformStream;
(global as any).MessageChannel = MessageChannel;
(global as any).MessagePort = MessagePort;
(global as any).BroadcastChannel = BroadcastChannel;
