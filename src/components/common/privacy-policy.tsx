import React from "react";
import LegalPageShell from "./LegalPageShell";
import {
  BRAND_NAME,
  LEGAL_ENTITY_NAME,
  MAILING_ADDRESS,
  POLICIES_LAST_UPDATED,
  PRIVACY_EMAIL,
  SITE_DOMAIN,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_HREF,
} from "constants/business-info";

const DRAFT_KEY = "paystubissa.draft.v1";

const PrivacyPolicy = () => (
  <LegalPageShell>
    <h2>Privacy Policy</h2>
    <p><strong>Last Updated:</strong> {POLICIES_LAST_UPDATED}</p>
    <p>
      This Privacy Policy explains what {LEGAL_ENTITY_NAME} ("we," "us," or "our") does with information when
      you use {SITE_DOMAIN} (the "Service"). It is short, because the honest answer is that we collect almost
      nothing.
    </p>

    <h4>1. The Short Version</h4>
    <p>
      <strong>{BRAND_NAME} runs entirely in your browser.</strong> There is no account, no login, and no
      server that receives your pay stub data. The company name, employee name, Social Security number,
      Employer Identification number, wages, hours, and deductions you type in never leave your device. We
      never see them. We could not produce them if we wanted to, because we do not have them.
    </p>
    <p>
      Payment is handled by PayPal, not by us. We never receive your card number. Your finished pay stub is a
      PDF download or a browser print — we do not email it, store it, or keep a copy.
    </p>

    <h4>2. Contact Us</h4>
    <p>
      For questions about this policy or about your information:<br />
      <strong>Email:</strong> <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a><br />
      <strong>Support:</strong> <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a><br />
      <strong>Mailing Address:</strong> {MAILING_ADDRESS}<br />
      <strong>Phone:</strong> <a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE}</a>
    </p>

    <h4>3. Your Pay Stub Data Never Reaches Us</h4>
    <p>
      <strong>Where it lives</strong><br />
      Everything you enter in the pay stub wizard is held in your browser's memory while you work. So that you
      do not lose your progress, the app also saves a draft to your browser's local storage on your own device,
      under the key <code>{DRAFT_KEY}</code>. That draft is on your computer or phone. It is not a copy on our
      systems. It is not synced anywhere.
    </p>
    <p>
      <strong>How it is destroyed</strong><br />
      Clearing the draft in the app, clearing your browser's site data for {SITE_DOMAIN}, or browsing in a
      private window and closing it, deletes the data. Once it is gone from your device, it is gone completely.
      There is no server-side copy for us to delete, and none for anyone to demand from us.
    </p>
    <p>
      <strong>Nothing is retrievable later</strong><br />
      We cannot re-send, re-issue, or look up a pay stub you made. Download or print it before you leave the
      site.
    </p>
    <p>
      <strong>What this means for you</strong><br />
      Because your data lives on your device, the security of your device is what protects it. If you are using
      a shared or public computer, clear the draft and your browser data when you are finished.
    </p>

    <h4>4. What We Actually Collect</h4>
    <table>
      <thead>
        <tr>
          <th>Category</th>
          <th>Examples</th>
          <th>Do we receive it?</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Pay stub data</td>
          <td>Company, employee, SSN, EIN, wages, hours, deductions, the generated document</td>
          <td>
            <strong>No.</strong> Entered and kept in your browser only. Never transmitted to us.
          </td>
        </tr>
        <tr>
          <td>Payment data</td>
          <td>Card number, PayPal login, billing address</td>
          <td>
            <strong>No.</strong> Handled entirely by PayPal. We only learn that a payment succeeded.
          </td>
        </tr>
        <tr>
          <td>Correspondence</td>
          <td>Your email address and whatever you write to us</td>
          <td>
            <strong>Yes</strong> — if you choose to email or call us for support.
          </td>
        </tr>
        <tr>
          <td>Technical data</td>
          <td>IP address, browser and device type, requested pages, timestamps</td>
          <td>
            <strong>Yes</strong> — in ordinary web server logs kept by our hosting provider.
          </td>
        </tr>
      </tbody>
    </table>

    <h4>5. Payments and PayPal</h4>
    <p>
      Payment is by PayPal only. When you pay, PayPal's own software handles the transaction. Your card number,
      bank details, and PayPal credentials go to PayPal — never to us. We do not see them, receive them, or
      store them.
    </p>
    <p>
      What PayPal does with your information is governed by PayPal's own privacy policy, not this one. Read it
      at{" "}
      <a href="https://www.paypal.com/us/legalhub/privacy-full" target="_blank" rel="noopener noreferrer">
        paypal.com/us/legalhub/privacy-full
      </a>
      .
    </p>
    <p>
      The Service is told only whether a payment succeeded, so that it can unlock the download and print
      buttons in your browser.
    </p>

    <h4>6. Contacting Support</h4>
    <p>
      If you email us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or{" "}
      <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>, or call us on{" "}
      <a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE}</a>, we receive whatever you choose to tell us — typically
      your name, your email address, and a description of your problem. We use it only to answer you. We keep
      support correspondence only as long as we need it to resolve the issue and to keep a basic record of the
      request.
    </p>
    <p>
      <strong>Please do not send us pay stub data.</strong> We do not need your Social Security number, your
      Employer Identification number, or a copy of your document in order to help you, and we would rather not
      have them.
    </p>
    <p>
      The contact form on our site is not currently connected to a message-delivery service, so the reliable
      way to reach us is email or phone.
    </p>

    <h4>7. Cookies, Analytics, and Local Storage</h4>
    <p>
      <strong>Local storage</strong><br />
      The Service uses your browser's local storage to hold your pay stub draft on your device. That is
      functional storage that makes the app work; it is not tracking, and it is not sent to us.
    </p>
    <p>
      <strong>Analytics</strong><br />
      The app contains a lightweight telemetry client that is capable of recording page views, JavaScript
      errors, and performance timings (such as page load time). Whatever such data may be collected is limited
      to those categories.
    </p>
    <p>
      <strong>What analytics never contains:</strong> we do not send pay stub contents, Social Security
      numbers, Employer Identification numbers, employer or employee names, wage figures, or any part of a
      generated document in analytics or error reports. That data stays in your browser, full stop.
    </p>
    <p>
      <strong>Advertising</strong><br />
      We do not run advertising, and we do not allow third-party behavioral advertising or cross-site tracking
      networks on the Service. We do not sell or share personal information.
    </p>
    <p>
      <strong>Your controls</strong><br />
      You can block or clear cookies and local storage in your browser settings. Clearing local storage for{" "}
      {SITE_DOMAIN} will delete your saved draft, which is the point.
    </p>
    <p>
      <strong>Do Not Track</strong><br />
      There is no agreed industry standard for Do Not Track signals, so we do not respond to them. We do not
      track you across sites in any case.
    </p>

    <h4>8. Hosting and Server Logs</h4>
    <p>
      The website files are served from a web server in the United States. Like any web server, it writes
      ordinary access logs — IP address, time, requested page, browser type — which are used to keep the site
      running and secure. These logs relate to page requests. They do not contain your pay stub data, because
      your pay stub data is never sent to the server.
    </p>

    <h4>9. Third-Party Links</h4>
    <p>
      The Service may link to external sites, such as state tax resources or government portals. Those sites
      have their own privacy policies and we are not responsible for their practices. Review their policies
      before giving them information.
    </p>

    <h4>10. Your Privacy Rights</h4>
    <ul>
      <li>
        <strong>Deletion — you can do it yourself, right now.</strong> Your pay stub data is on your device, not
        ours. Clear the draft in the app or clear your browser storage for {SITE_DOMAIN} and it is gone. We do
        not need to be involved, because we do not hold it.
      </li>
      <li>
        <strong>Access and portability.</strong> You may ask us what information we hold about you. In practice
        that is limited to any correspondence you have sent us and, for a short period, server logs. We will
        provide it in a common, readable format.
      </li>
      <li>
        <strong>Correction.</strong> You may ask us to correct anything inaccurate in the information we hold
        about you. Pay stub data you can correct yourself, in the app, at any time.
      </li>
      <li>
        <strong>Deletion of correspondence.</strong> You may ask us to delete the support correspondence we hold
        about you, subject to any record we are legally required to keep.
      </li>
      <li>
        <strong>No sale, no marketing lists.</strong> We do not sell personal information and we do not send
        marketing email. There is nothing to opt out of.
      </li>
    </ul>
    <p>
      To exercise any of these rights, email <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. We respond
      within 30 days and may need to verify your identity first.
    </p>

    <h4>11. California Residents (CCPA/CPRA)</h4>
    <p>
      If you are a California resident, you have the right to know what personal information we collect about
      you, to request access to it, to request that we delete it, to request correction of it, and not to be
      discriminated against for exercising those rights.
    </p>
    <p>
      Applied to us, this is straightforward: we do not collect your pay stub data at all, we do not sell or
      share personal information, and we do not use personal information for cross-context behavioral
      advertising. The only personal information we may hold about you is correspondence you have sent us and
      routine server logs. Submit a request to{" "}
      <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. More about California privacy rights is available
      from the California Attorney General at{" "}
      <a href="https://oag.ca.gov/privacy/ccpa" target="_blank" rel="noopener noreferrer">
        oag.ca.gov/privacy/ccpa
      </a>
      .
    </p>
    <p>
      We honor privacy rights granted by other state laws on the same basis. If your state gives you a right we
      have not listed, write to us and we will honor it.
    </p>

    <h4>12. Children's Privacy (COPPA)</h4>
    <p>
      The Service is not intended for children. It is for adults 18 and over. We do not knowingly collect
      personal information from anyone under 13. If we learn that we have received information from a child
      under 13, we will delete it promptly.
    </p>
    <p>
      A parent or guardian who believes a child has sent us personal information should contact{" "}
      <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>.
    </p>

    <h4>13. Data Breach Response</h4>
    <p>
      Because your pay stub data is never transmitted to us, a compromise of our systems could not expose it.
      That is by design, and it is the strongest protection we can give you.
    </p>
    <p>
      Should a security incident nonetheless affect information we do hold — support correspondence or server
      logs — we will contain it, assess what was affected, notify affected people without undue delay and in any
      event within 72 hours of confirming the breach, report it to the relevant authorities where the law
      requires, and tell you plainly what happened and what we are doing about it.
    </p>

    <h4>14. Data Retention</h4>
    <p>
      We keep support correspondence only as long as needed to resolve your issue and keep a basic record of it.
      Server logs are kept for a short period for security and troubleshooting, then discarded. Your pay stub
      data has no retention period on our side, because it never arrives.
    </p>

    <h4>15. Business Transfers</h4>
    <p>
      If our business is merged, acquired, or sold, information we hold — which is correspondence and logs, not
      your pay stub data — may transfer as part of that transaction. We will post notice on this page if that
      happens.
    </p>

    <h4>16. Changes to This Policy</h4>
    <p>
      We may update this policy. When we do, we will change the "Last Updated" date above and post the new
      version here. Material changes will be flagged on the site. We do not hold a mailing list, so we cannot
      email you about it — please check back.
    </p>

    <h4>Acknowledgment</h4>
    <p>
      By using {SITE_DOMAIN}, you acknowledge that you have read and understood this Privacy Policy.
    </p>
    <p>
      <strong>Effective Date:</strong> This Privacy Policy is effective as of {POLICIES_LAST_UPDATED}.<br />
      The current version is always at{" "}
      <a href={`https://${SITE_DOMAIN}/privacy`} target="_blank" rel="noopener noreferrer">
        {SITE_DOMAIN}/privacy
      </a>
      .
    </p>
  </LegalPageShell>
);

export default PrivacyPolicy;
