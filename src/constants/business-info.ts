/**
 * business-info
 * -------------
 * Single source of truth for the legal identity of the business and for the
 * disclaimer language that must appear consistently across the site.
 *
 * Every legal page (Terms, Privacy, Accessibility), the footer, the contact
 * page and the checkout gate read from here. Do not restate an address, phone
 * number, support email or disclaimer anywhere else — change it once, here.
 *
 * Identity values were confirmed by the owner on 2026-11-01: a Washington LLC, Washington law,
 * and the registered agent's street address (public on the WA Secretary of State record).
 */

/** Legal/registered name of the operating entity. */
export const LEGAL_ENTITY_NAME = 'GOLDENTECH KSA L.L.C.'; // Washington limited liability company

/** Trading name shown in UI copy. */
export const BRAND_NAME = 'PayStubIssa';

export const SITE_DOMAIN = 'paystubissa.com';

/** US state whose law governs the Terms and whose state and federal courts hear disputes. */
export const GOVERNING_STATE = 'Washington';

/** Registered mailing address. Rendered verbatim on Terms, Privacy and Accessibility. */
export const MAILING_ADDRESS = '27540 SE 30th St, Sammamish, WA 98075'; // registered agent address

/** Support phone line. Confirmed live. Rendered as plain text everywhere: only emails and page URLs are links. */
export const SUPPORT_PHONE = '+1 (425) 247-8733';

export const SUPPORT_EMAIL = `support@${SITE_DOMAIN}`;
export const PRIVACY_EMAIL = `privacy@${SITE_DOMAIN}`;
export const LEGAL_EMAIL = `legal@${SITE_DOMAIN}`;
export const ACCESSIBILITY_EMAIL = `accessibility@${SITE_DOMAIN}`;

/** Date the current Terms / Privacy / Accessibility revisions took effect. Bump POLICIES_VERSION with it. */
export const POLICIES_LAST_UPDATED = 'November 1, 2026';

/**
 * Machine-readable version of the policies above (the ISO date of POLICIES_LAST_UPDATED). It is
 * recorded with every order next to the attestation time, so each purchase shows which Terms
 * the customer agreed to.
 */
export const POLICIES_VERSION = '2026-11-01';

/** Window, in days, of the satisfaction guarantee. Terms and FAQ must agree. */
export const REFUND_WINDOW_DAYS = 30;

/**
 * Number of pay stub templates we advertise. This is a marketing claim, so it has to stay true:
 * it must equal the number of entries in public/configs/template-configs.json that are also
 * allow-listed in the wizard's Template step. If you add or remove a template, update this —
 * template-configs.test.ts fails when the two disagree.
 */
export const TEMPLATE_COUNT = 8;

/**
 * The core disclaimer. This is the load-bearing sentence of our legal posture:
 * we format documents, the user supplies and warrants the data, and the
 * documents must reflect real earnings.
 *
 * Shown in the footer on every page and repeated at checkout.
 */
export const CORE_DISCLAIMER =
  `${BRAND_NAME} is a document formatting tool. You supply all figures and are solely ` +
  'responsible for their accuracy. Pay stubs created here must reflect genuine wages ' +
  `actually earned and paid. ${BRAND_NAME} does not verify, audit, or endorse any information ` +
  'you enter, is not a payroll provider, accountant, or tax advisor, and does not file ' +
  'anything with the IRS or any state agency on your behalf.';

/** The prohibited-use warning. Shown alongside the core disclaimer at checkout. */
export const FRAUD_WARNING =
  'Using this tool to misrepresent income to a lender, landlord, employer, government ' +
  'agency, or court is fraud, is strictly prohibited, and may be a criminal offense.';

/**
 * The text the user must affirmatively tick before payment is offered.
 * Keep this in sync with the Terms "Accuracy Attestation" section.
 */
export const ATTESTATION_TEXT =
  'I confirm that the information I have entered is true and accurate, that it reflects ' +
  'wages actually earned and paid, and that I am the employer, the employee, or an ' +
  'authorized representative entitled to create this record.';
