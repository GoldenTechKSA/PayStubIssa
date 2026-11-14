import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

// The build-time stamp script is plain Node (CommonJS); its pure helpers are exported for this.
const { tiersFromConfigBody, tiersFromServerDefault } = require('../../scripts/stamp-price.js');

const FOUR = [
  { minQty: 1, maxQty: 1, unitCents: 899 },
  { minQty: 2, maxQty: 4, unitCents: 799 },
  { minQty: 5, maxQty: 8, unitCents: 699 },
  { minQty: 9, maxQty: 12, unitCents: 599 },
];

describe('stamp-price — reading the tier table', () => {
  it('takes the tiers a server publishes', () => {
    expect(tiersFromConfigBody({ unitCents: { paystub: 899 }, maxQty: 12, tiers: FOUR })).toEqual(FOUR);
  });

  it('treats a server that publishes no tiers yet as a miss, not as one flat price', () => {
    expect(tiersFromConfigBody({ unitCents: { paystub: 899 }, maxQty: 12 })).toBeNull();
    expect(tiersFromConfigBody(null)).toBeNull();
  });

  it('refuses a malformed tier table', () => {
    expect(tiersFromConfigBody({ tiers: [] })).toBeNull();
    expect(tiersFromConfigBody({ tiers: [{ minQty: 1, unitCents: 899 }] })).toBeNull();
    expect(tiersFromConfigBody({ tiers: [{ minQty: 1, maxQty: 1, unitCents: 8.99 }] })).toBeNull();
    expect(tiersFromConfigBody({ tiers: [{ minQty: 2, maxQty: 12, unitCents: 799 }] })).toBeNull();
  });

  it("reads the server's own default table from server/src/config.ts", () => {
    const configTs = fs.readFileSync(path.resolve(__dirname, '../../server/src/config.ts'), 'utf8');
    expect(tiersFromServerDefault(configTs)).toEqual(FOUR);
  });

  it('derives each tier\'s last quantity from the next tier and the order limit', () => {
    const src = "PRICE_TIERS: z.string().default('1:1000,4:800'),\n  MAX_STUBS_PER_ORDER: z.coerce.number().int().positive().default(6),";
    expect(tiersFromServerDefault(src)).toEqual([
      { minQty: 1, maxQty: 3, unitCents: 1000 },
      { minQty: 4, maxQty: 6, unitCents: 800 },
    ]);
  });
});
