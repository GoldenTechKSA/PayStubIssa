/**
 * price-context
 * -------------
 * The per-stub price, for every place the site mentions it. The SERVER is the only place the
 * price is set (PRICE_PER_STUB_CENTS); nothing in the client holds a hand-typed number.
 *
 * Stamped-plus-live:
 *   1. `scripts/stamp-price.js` asks the server at build time and stamps the answer into the
 *      build (REACT_APP_STUB_PRICE_CENTS), so the first paint already has a price.
 *   2. On every visit `PriceProvider` asks GET /api/payments/config and swaps in the live
 *      number if it differs — a price changed on the server shows up without a deploy.
 *   3. The last live answer is remembered in localStorage, so a returning visitor does not even
 *      see that swap. It is only trusted while the build's stamp is the one it was saved under:
 *      a newer deploy carries a newer price than an old visit.
 *
 * `unitCents` is `null` only when there is no stamp and no answer (tests, or a build made
 * without the stamp step); `<Price>` then prints its number-free fallback wording.
 */
import React, { createContext, useContext, useEffect, useState } from "react";
import { paymentsApi } from "services/payments-api";

const toCents = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? n : null;
};

/** The price stamped into this build, or null when the build was not stamped. */
export const STAMPED_PRICE_CENTS = toCents(process.env.REACT_APP_STUB_PRICE_CENTS);

const CACHE_KEY = "paystubissa.price.v1";

const readCache = (stamp: number | null): number | null => {
  try {
    const raw = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
    return raw && raw.stamp === stamp ? toCents(raw.cents) : null;
  } catch {
    return null;
  }
};

const writeCache = (cents: number, stamp: number | null) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ cents, stamp }));
  } catch {
    /* private mode / storage full: the stamp still covers the first paint */
  }
};

/** Cents to a dollar label: `1250` → `"$12.50"`. */
export const formatPrice = (cents: number): string => `$${(cents / 100).toFixed(2)}`;

export interface PriceState {
  /** Price of one pay stub in cents, or null when it is not known yet. */
  unitCents: number | null;
  /** The price as a dollar label (`"$12.50"`), or null when it is not known yet. */
  label: string | null;
}

const toState = (unitCents: number | null): PriceState => ({
  unitCents,
  label: unitCents === null ? null : formatPrice(unitCents),
});

const PriceContext = createContext<PriceState>(toState(STAMPED_PRICE_CENTS));

interface PriceProviderProps {
  children: React.ReactNode;
  /** Build stamp; overridable for tests. */
  stampedCents?: number | null;
  /** How the live price is fetched; overridable for tests. Resolves to cents. */
  loadLive?: () => Promise<number>;
}

const defaultLoadLive = () => paymentsApi.getConfig().then(c => c.unitCents.paystub);

export const PriceProvider: React.FC<PriceProviderProps> = ({
  children,
  stampedCents = STAMPED_PRICE_CENTS,
  loadLive = defaultLoadLive,
}) => {
  const [unitCents, setUnitCents] = useState<number | null>(() => readCache(stampedCents) ?? stampedCents);

  useEffect(() => {
    // Unit tests have no API; they pass `loadLive` when they want the live path.
    if (process.env.NODE_ENV === "test" && loadLive === defaultLoadLive) return;
    let cancelled = false;
    loadLive()
      .then(live => {
        const cents = toCents(live);
        if (cancelled || cents === null) return;
        writeCache(cents, stampedCents);
        setUnitCents(cents);
      })
      .catch(() => {
        /* server unreachable: keep showing the stamped / remembered price */
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <PriceContext.Provider value={toState(unitCents)}>{children}</PriceContext.Provider>;
};

/** The current per-stub price. Works without a provider (it then reports the build stamp). */
export const usePrice = (): PriceState => useContext(PriceContext);

/**
 * The per-stub price as a dollar label. `fallback` is what to print in the rare case the
 * price is not known, so a sentence never shows a guessed or empty amount.
 */
export const Price: React.FC<{ fallback?: React.ReactNode }> = ({
  fallback = "the price shown at checkout",
}) => {
  const { label } = usePrice();
  return <>{label ?? fallback}</>;
};
