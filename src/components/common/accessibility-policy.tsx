import React from "react";
import LegalPageShell from "./LegalPageShell";
import {
  ACCESSIBILITY_EMAIL,
  BRAND_NAME,
  MAILING_ADDRESS,
  POLICIES_LAST_UPDATED,
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_HREF,
} from "constants/business-info";

const AccessibilityPolicy = () => (
  <LegalPageShell>
    <h2>Accessibility Policy</h2>
    <p><strong>Last Updated:</strong> {POLICIES_LAST_UPDATED}</p>
    <p>
      {BRAND_NAME} is committed to making {SITE_DOMAIN} usable by everyone, including people with
      disabilities. This policy states what we are aiming for, what we have done, what we have not yet
      verified, and how to tell us when we have got it wrong.
    </p>

    <h4>1. Our Commitment</h4>
    <p>
      Everyone should be able to produce a pay stub without help they did not ask for. We build with
      accessibility in mind rather than bolting it on afterwards, and we treat accessibility barriers as
      defects — the same as any other bug.
    </p>
    <p>
      We are a small team and we are honest about where we are: accessibility is an ongoing effort, not a
      finished project. If something on this site blocks you, tell us. We will fix it.
    </p>

    <h4>2. Contact Us About Accessibility</h4>
    <p>
      <strong>Email:</strong> <a href={`mailto:${ACCESSIBILITY_EMAIL}`}>{ACCESSIBILITY_EMAIL}</a><br />
      <strong>Phone:</strong> <a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE}</a><br />
      <strong>Mailing Address:</strong> {MAILING_ADDRESS}<br />
      <strong>General support:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
    </p>

    <h4>3. Standards We Aim For</h4>
    <p>
      <strong>WCAG 2.1 Level AA</strong><br />
      We <strong>aim</strong> to conform to the Web Content Accessibility Guidelines (WCAG) 2.1 at Level AA
      and are actively working toward it. We have not completed a formal third-party accessibility audit, so
      we do not claim audited conformance. Parts of the site may not yet meet the standard. Where you find a
      gap, we want to hear about it.
    </p>
    <p>
      <strong>Americans with Disabilities Act (ADA)</strong><br />
      We are committed to the ADA's goal of equal access, and we treat removing barriers to our service as an
      obligation, not a courtesy.
    </p>
    <p>
      <strong>Section 508</strong><br />
      Section 508 applies to federal agencies rather than to us, but we use it as additional guidance on
      compatibility with assistive technology.
    </p>

    <h4>4. What We Have Built For</h4>
    <p>
      <strong>Keyboard navigation</strong><br />
      The site is designed to be operable with a keyboard alone. We use logical tab order, visible focus
      indicators, and standard interactive controls, so the whole pay stub wizard — every step, every field,
      the preview, and checkout — can be reached and activated without a mouse.
    </p>
    <p>
      <strong>Screen readers</strong><br />
      We build with semantic HTML, labelled form fields, descriptive headings, and alternative text, so the
      site works with screen readers such as NVDA, JAWS, and VoiceOver. Form errors are written in plain
      language and associated with the field they belong to. Wage figures, tax lines, and deduction totals are
      rendered as real text on screen — not as images — so a screen reader can read them.
    </p>
    <p>
      <strong>Contrast and text size</strong><br />
      Our color palette is chosen to meet WCAG contrast ratios, and we never use color alone to carry meaning.
      The layout is built to stay usable when text is enlarged, including at 200%.
    </p>
    <p>
      <strong>Forms</strong><br />
      Every field has a visible label. Required fields are marked. Validation messages say what is wrong and
      how to fix it.
    </p>
    <p>
      <strong>Mobile and touch</strong><br />
      The site is responsive and is built to work with the accessibility features built into mobile operating
      systems, such as VoiceOver on iOS and TalkBack on Android, with the same functionality available as on
      desktop.
    </p>

    <h4>5. Known Limitation: The Downloaded PDF</h4>
    <p>
      We want to be straightforward about this one. The pay stub you see on screen is accessible HTML text. The
      PDF you download is generated as a visual snapshot of that pay stub, which means{" "}
      <strong>the PDF file itself is not tagged for screen readers</strong> and its text may not be selectable
      or machine-readable.
    </p>
    <p>
      If you need the contents of your pay stub in an accessible form: the on-screen version is fully readable
      by assistive technology, and printing from your browser preserves the text. If you need the figures in
      another format, contact us at{" "}
      <a href={`mailto:${ACCESSIBILITY_EMAIL}`}>{ACCESSIBILITY_EMAIL}</a> and we will work with you. Improving
      the accessibility of the generated PDF is on our roadmap.
    </p>

    <h4>6. Reporting an Accessibility Barrier</h4>
    <p>
      <strong>How to report</strong><br />
      If anything on {SITE_DOMAIN} is difficult or impossible for you to use, email{" "}
      <a href={`mailto:${ACCESSIBILITY_EMAIL}`}>{ACCESSIBILITY_EMAIL}</a> or call{" "}
      <a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE}</a>. It helps if you can tell us the page or step, the
      assistive technology and browser you were using, and what happened.
    </p>
    <p>
      <strong>What we will do</strong><br />
      We will acknowledge your report within <strong>five business days</strong>. We will not promise you a fix
      by a date we cannot keep: instead we will tell you honestly what the problem is, work with you on a
      realistic timeline, and keep you updated as we work on it.
    </p>
    <p>
      <strong>In the meantime</strong><br />
      While a barrier is unresolved, we will give you the information or the assistance you need by another
      route — by phone, by email, or in an alternative accessible format — so that the barrier does not leave
      you without the service.
    </p>

    <h4>7. Alternative Ways to Get Help</h4>
    <p>
      <strong>Phone</strong><br />
      You can call us at <a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE}</a> during business hours. If you cannot
      complete something on the site, we will talk you through it.
    </p>
    <p>
      <strong>Email</strong><br />
      Write to <a href={`mailto:${ACCESSIBILITY_EMAIL}`}>{ACCESSIBILITY_EMAIL}</a> and a person will read it and
      reply.
    </p>
    <p>
      <strong>Alternative formats</strong><br />
      On request, we will provide information about our service — pricing, how it works, our policies — in an
      alternative accessible format such as large print or plain electronic text.
    </p>

    <h4>8. Third-Party Components</h4>
    <p>
      <strong>Payment</strong><br />
      Checkout uses PayPal's own payment buttons, which are provided and controlled by PayPal. Their
      accessibility is PayPal's responsibility, not ours. If you hit a barrier at the payment step, tell us
      anyway — we will help you and we will raise it with PayPal.
    </p>
    <p>
      <strong>External links</strong><br />
      Where we link to outside resources, such as government or state tax pages, we cannot guarantee their
      accessibility. Let us know if a link we published leads to a barrier and we will look for a better
      source.
    </p>

    <h4>9. How We Test</h4>
    <p>
      We check accessibility during development using automated tooling and manual keyboard and screen-reader
      testing. We have not yet commissioned an independent audit or formal user testing with people who use
      assistive technology. We say so plainly rather than imply a level of assurance we have not earned. User
      reports are, today, our most valuable source of information — which is why we take them seriously.
    </p>

    <h4>10. Updates to This Policy</h4>
    <p>
      We review this policy as our accessibility work progresses and update it to reflect what is actually true
      at the time. Changes are posted on this page with a new "Last Updated" date.
    </p>

    <h4>Acknowledgment</h4>
    <p>
      Accessibility is not a box we tick. It is work we keep doing. If we have made something harder for you
      than it should be, we want to know — write to{" "}
      <a href={`mailto:${ACCESSIBILITY_EMAIL}`}>{ACCESSIBILITY_EMAIL}</a>.
    </p>
    <p>
      <strong>Effective Date:</strong> This Accessibility Policy is effective as of {POLICIES_LAST_UPDATED}.<br />
      The current version is always at{" "}
      <a href={`https://${SITE_DOMAIN}/accessibility`} target="_blank" rel="noopener noreferrer">
        {SITE_DOMAIN}/accessibility
      </a>
      .
    </p>
  </LegalPageShell>
);

export default AccessibilityPolicy;
