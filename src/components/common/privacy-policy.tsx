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
      you use {SITE_DOMAIN} (the "Service"). It is short, because the honest answer is that we collect very
      little.
    </p>

    <h4>1. The Short Version</h4>
    <p>
      <strong>The {BRAND_NAME} pay stub builder runs entirely in your browser.</strong> There is no account, no
      login, and no server that receives your pay stub data. The company name, employee name, Social Security
      number, Employer Identification number, bank routing and account numbers, wages, hours, and deductions
      you type in never leave your device. We never see them. We could not produce them if we wanted to,
      because we do not have them.
    </p>
    <p>
      What we do receive is the record of your order and payment, and anonymous statistics about how the site
      is used. Payment is handled by PayPal, not by us, and we never receive your card number. PayPal does tell
      us when a payment completes, together with the name and email address on your PayPal account, and we keep
      that as the record of your purchase. Your finished pay stub is a PDF download or a browser print — we do
      not email it, store it, or keep a copy.
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
          <td>
            Company, employee, SSN, EIN, bank routing and account numbers, wages, hours, deductions, the
            generated document
          </td>
          <td>
            <strong>No.</strong> Entered and kept in your browser only. Never transmitted to us.
          </td>
        </tr>
        <tr>
          <td>Payment details</td>
          <td>Card number, bank details, PayPal login, billing address</td>
          <td>
            <strong>No.</strong> Handled entirely by PayPal. We never see them.
          </td>
        </tr>
        <tr>
          <td>Order records</td>
          <td>
            The number of stubs ordered, the amount, any discount code you entered, the template you chose, the
            time you ticked the checkout confirmation and the version of the Terms you agreed to, your IP
            address and browser type, and PayPal's confirmation of the payment, which carries the PayPal order
            id and the name and email address on your PayPal account
          </td>
          <td>
            <strong>Yes</strong> — on our server, for three years (see Data Retention).
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
            <strong>Yes</strong> — in ordinary web server access logs on our server.
          </td>
        </tr>
        <tr>
          <td>Usage analytics</td>
          <td>
            A random identifier stored in your browser, the pages you visit, which steps of the pay stub wizard
            you complete (never what you type), the template you pick, whether you ticked the checkout
            confirmation, whether a discount code was accepted (never the code itself), whether a payment
            succeeded or failed with its PayPal order id, the number of stubs and amount paid, your browser type,
            and timestamps
          </td>
          <td>
            <strong>Yes</strong> — on our server, for up to 90 days.
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
      When your payment completes, PayPal sends our server a confirmation. It contains the PayPal order id, the
      amount, and the name and email address on your PayPal account. We use it to unlock the download and print
      buttons in your browser, to keep a record of what was sold, to handle refunds and billing disputes, and as
      evidence that the checkout confirmation was made. We do not use the email address for marketing or
      notices.
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
      The contact form on our site opens a pre-written message in your own email app rather than sending
      anything itself, so the reliable way to reach us is email or phone.
    </p>

    <h4>7. Cookies, Analytics, Local Storage, and Third-Party Resources</h4>
    <p>
      <strong>Local storage</strong><br />
      The Service uses your browser's local storage to hold your pay stub draft on your device. That draft is
      functional storage that makes the app work; it is not tracking, and it is never sent to us. We also keep a
      random analytics identifier in your browser (see below), which is sent to us, and, after you pay, a
      short-lived unlock token in session storage so that reloading the page does not lose your purchase.
    </p>
    <p>
      <strong>Analytics</strong><br />
      The Service records anonymous usage events so we can see where people get stuck: page views, which
      wizard steps were completed, template selection, whether the checkout confirmation was ticked, whether a
      discount code was accepted or rejected (never the code itself), whether a payment succeeded, failed or was
      cancelled (with its PayPal order id, the number of stubs and the amount), print and PDF actions,
      JavaScript errors, and page load time. Each event carries a random identifier stored in your browser so
      that repeat visits can be grouped; it is not linked to your name or email. Events are kept on our server
      for up to 90 days and then deleted.
    </p>
    <p>
      <strong>What analytics never contains:</strong> we do not send pay stub contents, Social Security
      numbers, Employer Identification numbers, bank account numbers, employer or employee names, wage figures,
      or any part of a generated document in analytics or error reports. Our server also checks every incoming
      event and discards anything that looks like such a value. That data stays in your browser, full stop.
    </p>
    <p>
      <strong>Third-party resources</strong><br />
      The site's fonts and code are served from our own server. The only third-party code we load is PayPal's
      checkout, when you reach the payment step; like any web request, that shows PayPal your IP address and
      browser type. We load no advertising or tracking code from anyone.
    </p>
    <p>
      <strong>Advertising</strong><br />
      We do not run advertising, and we do not allow third-party behavioral advertising or cross-site tracking
      networks on the Service. We do not sell or share personal information.
    </p>
    <p>
      <strong>Your controls</strong><br />
      You can block or clear cookies and local storage in your browser settings. Clearing local storage for{" "}
      {SITE_DOMAIN} will delete your saved draft, which is the point. Clearing site data also resets the
      analytics identifier.
    </p>
    <p>
      <strong>Do Not Track</strong><br />
      There is no agreed industry standard for Do Not Track signals, so we do not respond to them. We do not
      track you across sites in any case.
    </p>

    <h4>8. Hosting and Server Logs</h4>
    <p>
      The website, and the server that handles payments and analytics, run on a virtual server in the United
      States that is operated for us by our hosting provider. Like any web server, it writes ordinary access
      logs — IP address, time, requested page, browser type — which are used to keep the site running and
      secure. These logs relate to page and payment requests. They do not contain your pay stub data, because
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
        that is limited to any correspondence you have sent us, the record of any order you placed, and, for a
        short period, server logs. We will provide it in a common, readable format.
      </li>
      <li>
        <strong>Correction.</strong> You may ask us to correct anything inaccurate in the information we hold
        about you. Pay stub data you can correct yourself, in the app, at any time.
      </li>
      <li>
        <strong>Deletion of correspondence and order records.</strong> You may ask us to delete the support
        correspondence we hold about you, and the personal details in your order record, subject to any record
        we are legally required to keep.
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
      advertising. The personal information we may hold about you is correspondence you have sent us, the record
      of an order you placed (including the name and email address PayPal gave us), and routine server logs.
      Submit a request to <a href={`mailto:${PRIVACY_EMAIL}`}>{PRIVACY_EMAIL}</a>. More about California privacy
      rights is available from the California Attorney General at{" "}
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
      Should a security incident nonetheless affect information we do hold — order records, support
      correspondence or server logs — we will contain it, assess what was affected, notify affected people
      without unreasonable delay and within the time required by applicable law, report it to the relevant
      authorities where the law requires, and tell you plainly what happened and what we are doing about it.
    </p>

    <h4>14. Data Retention</h4>
    <p>
      Order records are kept for three years from the date of the order and are then deleted automatically.
      Usage analytics events are deleted after 90 days. We keep support
      correspondence only as long as needed to resolve your issue and keep a basic record of it. Server access
      logs are kept for a short period for security and troubleshooting, then discarded. Your pay stub data has
      no retention period on our side, because it never arrives.
    </p>

    <h4>15. Business Transfers</h4>
    <p>
      If our business is merged, acquired, or sold, information we hold — which is order records, correspondence
      and logs, not your pay stub data — may transfer as part of that transaction. We will post notice on this
      page if that happens.
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
