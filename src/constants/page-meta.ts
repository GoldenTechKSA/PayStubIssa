/**
 * page-meta
 * ---------
 * The title and description of each page, as shown in the browser tab and in search results.
 * <RouteMeta> (components/common/route-meta.tsx) writes them into the document on every
 * navigation; public/index.html carries the home page's, which is what anything that does not
 * run JavaScript sees for every address.
 *
 * One entry per <Route> in components/app.tsx and per address in public/sitemap.xml;
 * page-meta.test.tsx fails when the lists differ. Keys are the route paths, case as routed.
 *
 * These are marketing claims and must stay literally true (see "Legal copy" in CLAUDE.md):
 * no credentials, no acceptance by third parties, no "proof of income". No prices either:
 * the price is the server's (the home page's description is the build-stamped one from
 * index.html, which is why its `description` is null here).
 */
import { BRAND_NAME, LEGAL_ENTITY_NAME, SITE_DOMAIN } from './business-info';
import { MAX_STUBS, MIN_STUBS } from './pricing';

export interface PageMeta {
  title: string;
  /** null = keep the description that index.html was built with (the home page's). */
  description: string | null;
}

export const SITE_ORIGIN = `https://${SITE_DOMAIN}`;

export const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: `${BRAND_NAME} — Create a professional pay stub in minutes`,
    description: null,
  },
  '/create': {
    title: `Create a Pay Stub | ${BRAND_NAME}`,
    description:
      'Enter company, employee, pay period and earnings details, pick a template and preview. ' +
      'Taxes are worked out for you; your pay stub data stays in your browser.',
  },
  '/offers': {
    title: `Pricing and Bundles | ${BRAND_NAME}`,
    description:
      `Pay per pay stub, with no subscription. Order ${MIN_STUBS} to ${MAX_STUBS} pay stubs at once: ` +
      'the more in one order, the lower the price of each.',
  },
  '/FAQPage': {
    title: `Frequently Asked Questions | ${BRAND_NAME}`,
    description:
      'Answers about creating a pay stub: how taxes and year-to-date figures are calculated, ' +
      'payment, refunds, corrections, and what happens to your data.',
  },
  '/aboutUsPage': {
    title: `About Us | ${BRAND_NAME}`,
    description:
      `${BRAND_NAME} is a self-serve pay stub formatting tool from ${LEGAL_ENTITY_NAME} ` +
      'See who it is for, how it works, and what it is not.',
  },
  '/contactUsPage': {
    title: `Contact Us | ${BRAND_NAME}`,
    description:
      `Contact ${BRAND_NAME} support by email or phone for help with a pay stub, a payment, ` +
      'a refund or a correction.',
  },
  '/terms': {
    title: `Terms of Use | ${BRAND_NAME}`,
    description:
      `The terms for using ${BRAND_NAME}: what the service is, acceptable use, pricing, payment ` +
      'and refunds, and your responsibility for the figures you enter.',
  },
  '/privacy': {
    title: `Privacy Policy | ${BRAND_NAME}`,
    description:
      `How ${BRAND_NAME} handles information: your pay stub data stays in your browser, and what ` +
      'our server keeps about orders, payments and anonymous usage.',
  },
  '/accessibility': {
    title: `Accessibility Policy | ${BRAND_NAME}`,
    description:
      `${BRAND_NAME} aims to meet WCAG 2.1 Level AA. Read what we have done, what is not yet ` +
      'verified, and how to report an accessibility barrier.',
  },
};

/** Any address that is not a page. Search engines are told not to index it. */
export const NOT_FOUND_META: PageMeta = {
  title: `Page not found | ${BRAND_NAME}`,
  description: 'This page does not exist or has moved.',
};

/**
 * The entry for a pathname, with the address search engines should treat as the page's own.
 * React Router matches paths without regard to case or a trailing slash, so this does too.
 */
export function pageMetaFor(pathname: string): { meta: PageMeta; canonicalPath: string | null } {
  const wanted = (pathname.replace(/\/+$/, '') || '/').toLowerCase();
  const path = Object.keys(PAGE_META).find(p => p.toLowerCase() === wanted);
  return path ? { meta: PAGE_META[path], canonicalPath: path } : { meta: NOT_FOUND_META, canonicalPath: null };
}
