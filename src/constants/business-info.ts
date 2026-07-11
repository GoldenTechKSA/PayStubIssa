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
 * !! ACTION REQUIRED !!
 * The values marked TODO below still render as placeholders on the live site.
 * They must be filled in with the real registered details before launch.
 */

/** Legal/registered name of the operating entity. */
export const LEGAL_ENTITY_NAME = 'PayStubIssa'; // TODO: replace with the registered entity name, e.g. "PayStubIssa LLC"

/** Trading name shown in UI copy. */
export const BRAND_NAME = 'PayStubIssa';

export const SITE_DOMAIN = 'paystubissa.com';

/** US state whose law governs the Terms and whose courts/arbitration venue applies. */
export const GOVERNING_STATE = 'TODO_STATE'; // TODO: the state of incorporation, e.g. "Washington"

/** Registered mailing address. Rendered verbatim on Terms, Privacy and Accessibility. */
export const MAILING_ADDRESS = 'TODO_MAILING_ADDRESS'; // TODO: e.g. "1234 Example St, Suite 100, Bellevue, WA 98004"

/** Support phone line. Confirmed live. */
export const SUPPORT_PHONE = '+1 (425) 247-8733';
export const SUPPORT_PHONE_HREF = 'tel:+14252478733';

export const SUPPORT_EMAIL = `support@${SITE_DOMAIN}`;
export const PRIVACY_EMAIL = `privacy@${SITE_DOMAIN}`;
export const LEGAL_EMAIL = `legal@${SITE_DOMAIN}`;
export const ACCESSIBILITY_EMAIL = `accessibility@${SITE_DOMAIN}`;

/** Date the current Terms / Privacy / Accessibility revisions took effect. */
export const POLICIES_LAST_UPDATED = 'July 10, 2026';

/** Window, in days, of the satisfaction guarantee. Terms and FAQ must agree. */
export const REFUND_WINDOW_DAYS = 30;

/**
 * Number of pay stub templates we advertise. This is a marketing claim, so it has to stay true:
 * it must equal the number of entries in public/configs/template-configs.json that are also
 * allow-listed in the wizard's Template step. If you add or remove a template, update this.
 */
export const TEMPLATE_COUNT = 29;

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
