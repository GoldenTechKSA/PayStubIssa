import '@testing-library/jest-dom';

// jest 27's jsdom environment predates TextEncoder/TextDecoder on the global object;
// react-router 7 needs them at import time.
import { TextDecoder, TextEncoder } from 'util';

if (typeof (globalThis as any).TextEncoder === 'undefined') (globalThis as any).TextEncoder = TextEncoder;
if (typeof (globalThis as any).TextDecoder === 'undefined') (globalThis as any).TextDecoder = TextDecoder;
