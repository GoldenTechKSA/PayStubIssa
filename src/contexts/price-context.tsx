/**
 * price-context
 * -------------
 * The price of a pay stub, for every place the site mentions it. The SERVER is the only place
 * prices are set (PRICE_TIERS); nothing in the client holds a hand-typed number.
 *
 * The price of one stub depends on how many are in the order: the server publishes a table of
 * tiers, and every stub in an order is charged at the tier the quantity falls in.
 *
 * Stamped-plus-live:
 *   1. `scripts/stamp-price.js` asks the server at build time and stamps the table into the
 *      build (REACT_APP_PRICE_TIERS), so the first paint already has prices.
 *   2. On every visit `PriceProvider` asks GET /api/payments/config and swaps in the live
 *      table if it differs — a price changed on the server shows up without a deploy.
 *   3. The last live answer is remembered in localStorage, so a returning visitor does not even
 *      see that swap. It is only trusted while the build's stamp is the one it was saved under:
 *      a newer deploy carries newer prices than an old visit.
 *
 * Prices are unknown (`tiers` empty, everything else null) only when there is no stamp and no
 * answer (tests, or a build made without the stamp step); `<Price>` then prints its
 * number-free fallback wording.
 */
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { paymentsApi } from "services/payments-api";

/** Orders of `minQty`–`maxQty` stubs pay `unitCents` for each stub. */
export interface PriceTier {
  minQty: number;
  maxQty: number;
  unitCents: number;
}

const posInt = (v: unknown): v is number => typeof v === "number" && Number.isInteger(v) && v > 0;

/** A usable table (starts at one stub, contiguous ranges, whole positive cents), or null. */
const toTiers = (value: unknown): PriceTier[] | null => {
  if (!Array.isArray(value) || value.length === 0) return null;
  const out: PriceTier[] = [];
  let expectedMin = 1;
  for (const t of value) {
    if (!t || !posInt(t.minQty) || !posInt(t.maxQty) || !posInt(t.unitCents)) return null;
    if (t.minQty !== expectedMin || t.maxQty < t.minQty) return null;
    expectedMin = t.maxQty + 1;
    out.push({ minQty: t.minQty, maxQty: t.maxQty, unitCents: t.unitCents });
  }
  return out;
};

const parseStamp = (raw: string | undefined): PriceTier[] | null => {
  try {
    return toTiers(JSON.parse(raw || "null"));
  } catch {
    return null;
  }
};

/** The price table stamped into this build, or null when the build was not stamped. */
export const STAMPED_TIERS = parseStamp(process.env.REACT_APP_PRICE_TIERS);

// v2: the value became a tier table (v1 held one flat price and is simply never read again).
const CACHE_KEY = "paystubissa.price.v2";

const readCache = (stamp: string): PriceTier[] | null => {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return raw && raw.stamp === stamp ? toTiers(raw.tiers) : null;
  } catch {
    return null;
  }
};

const writeCache = (tiers: PriceTier[], stamp: string) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ tiers, stamp }));
  } catch {
    /* private mode / storage full: the stamp still covers the first paint */
  }
};

/** Cents to a dollar label: `1250` becomes a dollar sign followed by `12.50`. */
export const formatPrice = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

export interface PriceState {
  /** The price table, ascending by quantity; empty when prices are not known yet. */
  tiers: PriceTier[];
  /** Price of a single pay stub (an order of one) in cents, or null when not known. */
  unitCents: number | null;
  /** The single-stub price as a dollar label, or null when not known. */
  label: string | null;
  /** The lowest per-stub price any order size reaches, in cents, or null when not known. */
  fromCents: number | null;
  /** The lowest per-stub price as a dollar label, or null when not known. */
  fromLabel: string | null;
  /** Price of ONE stub in an order of `qty` stubs, in cents, or null when not known. */
  priceFor: (qty: number) => number | null;
}

const toState = (tiers: PriceTier[] | null): PriceState => {
  const list = tiers ?? [];
  const unitCents = list.length ? list[0].unitCents : null;
  const fromCents = list.length ? Math.min(...list.map(t => t.unitCents)) : null;
  return {
    tiers: list,
    unitCents,
    label: unitCents === null ? null : formatPrice(unitCents),
    fromCents,
    fromLabel: fromCents === null ? null : formatPrice(fromCents),
    priceFor: qty => {
      if (!list.length) return null;
      // A count below or above the table is charged like the nearest end of it.
      let unit = list[0].unitCents;
      for (const t of list) if (qty >= t.minQty) unit = t.unitCents;
      return unit;
    },
  };
};

const PriceContext = createContext<PriceState>(toState(STAMPED_TIERS));

interface PriceProviderProps {
  children: React.ReactNode;
  /** Build stamp; overridable for tests. */
  stampedTiers?: PriceTier[] | null;
  /** How the live table is fetched; overridable for tests. */
  loadLive?: () => Promise<PriceTier[]>;
}

const defaultLoadLive = () => paymentsApi.getConfig().then(c => c.tiers as PriceTier[]);

export const PriceProvider: React.FC<PriceProviderProps> = ({
  children,
  stampedTiers = STAMPED_TIERS,
  loadLive = defaultLoadLive,
}) => {
  const stamp = JSON.stringify(stampedTiers);
  const [tiers, setTiers] = useState<PriceTier[] | null>(() => readCache(stamp) ?? stampedTiers);

  useEffect(() => {
    // Unit tests have no API; they pass `loadLive` when they want the live path.
    if (process.env.NODE_ENV === "test" && loadLive === defaultLoadLive) return;
    let cancelled = false;
    loadLive()
      .then(answer => {
        // An API older than the tier table answers without one: keep what the build stamped.
        const live = toTiers(answer);
        if (cancelled || live === null) return;
        writeCache(live, stamp);
        setTiers(live);
      })
      .catch(() => {
        /* server unreachable: keep showing the stamped / remembered prices */
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const state = useMemo(() => toState(tiers), [tiers]);
  return <PriceContext.Provider value={state}>{children}</PriceContext.Provider>;
};

/** The current prices. Works without a provider (it then reports the build stamp). */
export const usePrice = (): PriceState => useContext(PriceContext);

/**
 * A price as a dollar label: the single-stub price, or with `from` the lowest per-stub price.
 * `fallback` is what to print in the rare case prices are not known, so a sentence never
 * shows a guessed or empty amount.
 */
export const Price: React.FC<{ from?: boolean; fallback?: React.ReactNode }> = ({
  from = false,
  fallback = "the price shown at checkout",
}) => {
  const { label, fromLabel } = usePrice();
  return <>{(from ? fromLabel : label) ?? fallback}</>;
};
