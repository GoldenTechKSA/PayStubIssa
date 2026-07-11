import React from "react";
import {
  Container, Box, Typography, Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  BRAND_NAME,
  FRAUD_WARNING,
  REFUND_WINDOW_DAYS,
  SUPPORT_EMAIL,
  SUPPORT_PHONE,
  SUPPORT_PHONE_HREF,
  TEMPLATE_COUNT,
} from "constants/business-info";
import { MAX_STUBS, MIN_STUBS, UNIT_PRICE } from "constants/pricing";

const PRICE = `$${UNIT_PRICE.toFixed(2)}`;

const SupportEmailLink = () => <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>;
const SupportPhoneLink = () => <a href={SUPPORT_PHONE_HREF}>{SUPPORT_PHONE}</a>;

const faqData = [
  {
    section: "Start Here",
    qas: [
      {
        question: "Is this legal?",
        answer: (
          <>
            Yes. Creating an accurate pay stub for wages you actually paid or actually earned is legal and routine —
            employers do it every pay period, and freelancers and contractors do it to keep clean records. {BRAND_NAME}{" "}
            simply formats the figures you supply into a conventional wage record and runs standard tax arithmetic on
            them.
            <br />
            <br />
            What is <strong>not</strong> legal is using a pay stub to misrepresent your income. {FRAUD_WARNING} It is
            also prohibited by our Terms of Use. We do not verify anything you type, so the responsibility for the truth
            of every figure is entirely yours.
          </>
        ),
      },
      {
        question: "How much does it cost?",
        answer: (
          <>
            {PRICE} per pay stub. You can generate between {MIN_STUBS} and {MAX_STUBS} pay stubs in a single order —
            consecutive pay periods for one employee — and you are charged {PRICE} for each one. So four stubs is{" "}
            {PRICE} × 4. The total is shown before you pay.
            <br />
            <br />
            There is no subscription, no recurring charge, and no account. You pay for the documents you generate and
            nothing else.
          </>
        ),
      },
    ],
  },
  {
    section: "About Our Service",
    qas: [
      {
        question: "What makes your paystub service different from others?",
        answer: (
          <>
            Four things:
            <br />
            <br />
            <strong>Templates built for how people actually get paid.</strong> We offer {TEMPLATE_COUNT} worker-specific
            templates — independent contractor, commission-only, hospitality and tips, construction certified payroll,
            travel nurse, day rate, per diem, RSU vesting, seasonal, grant-funded, and more. Most generators give you one
            generic layout.
            <br />
            <br />
            <strong>Real tax math.</strong> We calculate federal income tax from current progressive brackets, Social
            Security (with the wage-base cap), Medicare (including additional Medicare), and state income tax for the
            employee’s state, based on the IRS filing status you select.
            <br />
            <br />
            <strong>Privacy by design.</strong> The whole app runs in your browser. Your company, employee, SSN, and wage
            data is never transmitted to us. There is no server holding it, because we never receive it.
            <br />
            <br />
            <strong>Pay per document.</strong> {PRICE} per stub, no subscription, no account.
          </>
        ),
      },
      {
        question: "Are the paystubs generated through your service legally valid?",
        answer: (
          <>
            The document we produce is a formatted wage record. It contains the line items a pay stub normally contains:
            gross wages, itemized earnings, tax withholdings, deductions, net pay, and year-to-date figures.
            <br />
            <br />
            <strong>Whether any third party accepts it is entirely up to that third party.</strong> A lender, landlord,
            employer, or agency sets its own documentation rules, and we make no promise that a document you create here
            will satisfy them.
            <br />
            <br />
            <strong>It is a genuine record only if the figures you enter are genuine.</strong> We do not verify anything
            you type. We do not check that the employer exists, that anyone was employed, that hours were worked, or that
            wages were paid. Creating a stub showing wages that were not actually earned and paid is fraud. {FRAUD_WARNING}
          </>
        ),
      },
    ],
  },
  {
    section: "General Questions",
    qas: [
      {
        question: "What exactly is a paystub?",
        answer: (
          <>
            A paystub is a detailed record of an employee’s compensation for a specific pay period. It typically shows
            gross earnings before deductions, followed by breakdowns of taxes, Social Security, Medicare, insurance
            premiums, retirement contributions, and other withholdings. The final section shows net pay — the actual
            amount the employee receives. Year-to-date columns track cumulative earnings and deductions.
          </>
        ),
      },
      {
        question: "Are the tax calculations exact?",
        answer: (
          <>
            They are a careful estimate, not a filing-grade figure.
            <br />
            <br />
            We use current federal income tax brackets, Social Security (capped at the annual wage base), Medicare
            (including additional Medicare above the threshold for your filing status), and state income tax for the
            employee’s state — all driven by the IRS filing status you select.
            <br />
            <br />
            But the math only knows what you tell it. It does not know about a mid-year job change, a second income, a
            spouse’s earnings, or extra withholding you requested on a W-4. And year-to-date figures are a{" "}
            <strong>proportional estimate</strong> — current period × periods elapsed this year — not an accumulation of
            a real payroll history.
            <br />
            <br />
            We are not accountants for you and we are not a tax advisor. For anything you file, consult a tax
            professional.
          </>
        ),
      },
      {
        question: "Why should I choose an online paystub generator over manual creation?",
        answer: (
          <>
            Building a stub by hand in a spreadsheet means doing the withholding arithmetic yourself and formatting the
            document yourself. Our tool applies published federal and state tax rates automatically and lays the result
            out in a professional, print-ready format — in minutes, with a live preview so you can see it before you pay.
          </>
        ),
      },
      {
        question: "Who typically needs your paystub services?",
        answer: (
          <>
            Small business owners without a dedicated payroll department, self-employed professionals who need to
            document their own income, and employers who want a clean wage record for the people they pay. Freelancers,
            gig workers, and independent contractors use it to keep an organized record of earnings they have actually
            received.
          </>
        ),
      },
      {
        question: "Do you offer subscription plans for recurring needs?",
        answer: (
          <>
            No. We charge per document — {PRICE} per pay stub — with no subscription and no recurring billing.
            <br />
            <br />
            We are not a payroll service. We do not run payroll, pay employees, remit taxes, or file with the IRS. If you
            need ongoing payroll management with automated tax filing and employee portals, look at a dedicated payroll
            provider such as QuickBooks Payroll, ADP, or Gusto. We do one thing: produce a well-formatted pay stub from
            figures you already have.
          </>
        ),
      },
    ],
  },
  {
    section: "Document Creation & Customization",
    qas: [
      {
        question: "How does the paystub creation process work?",
        answer: (
          <>
            A six-step wizard: company, employee, pay period, earnings, template, review.
            <br />
            <br />
            You enter employer details (name, address, EIN), then employee details (name, address, SSN, state, filing
            status). Next you set the pay period and how many stubs you want, then wage information — hourly rate and
            hours, or salary — plus overtime, bonuses, and deductions. We calculate federal tax, Social Security,
            Medicare, and state tax automatically from the employee’s state and filing status. You choose a template, see
            a live preview, and confirm everything on the review screen. After payment, you print or download the PDF.
          </>
        ),
      },
      {
        question: "Can I incorporate my company branding?",
        answer: (
          <>
            Yes. You can upload your company logo, and it appears on the pay stub. You can also pick from{" "}
            {TEMPLATE_COUNT} template designs — from minimalist to detailed layouts, and several built for specific kinds
            of work — to match how you want the document to read.
          </>
        ),
      },
      {
        question: "Can I create several pay stubs at once?",
        answer: (
          <>
            Yes — for one employee. You can generate between {MIN_STUBS} and {MAX_STUBS} pay stubs in a single order,
            covering consecutive pay periods, and you are charged {PRICE} for each one. They come back as a single PDF
            with one page per stub.
            <br />
            <br />
            There is no batch or multi-employee mode. One order covers one employee. If you need stubs for several
            people, run the wizard once per employee — you will re-enter the company details each time.
          </>
        ),
      },
    ],
  },
  {
    section: "Technical Support & Troubleshooting",
    qas: [
      {
        question: "How are completed paystubs delivered?",
        answer: (
          <>
            Instantly, in your browser. As soon as your PayPal payment succeeds, the <strong>Print</strong> and{" "}
            <strong>Download PDF</strong> buttons unlock on the review screen and the preview watermark disappears.
            <br />
            <br />
            You get a US Letter PDF with one page per pay stub. That is the whole delivery. There is no email, no
            download link, no ZIP file, and no JPEG option — because there is no server involved. Save the file before you
            close the tab.
          </>
        ),
      },
      {
        question: "Why does my printed paystub show overlapping text?",
        answer: (
          <>
            This usually means the printer settings don’t match the document. Set your printer to US Letter paper (8.5" ×
            11") with scaling at 100%. Use the preview before printing to confirm alignment. If it still looks wrong,
            download the PDF again, or contact support and we’ll help.
          </>
        ),
      },
      {
        question: "Is it possible to retrieve a lost paystub?",
        answer: (
          <>
            No — and that is by design.
            <br />
            <br />
            Nothing is stored anywhere. We never receive your pay stub, so we have no copy of it, no database to search,
            and no email to resend. There is no account and no order history. Once your browser session ends, the document
            is gone.
            <br />
            <br />
            That is the flip side of the privacy we offer: a company that can email you a lost pay stub is a company that
            kept a copy of your SSN and your wages on its servers. We don’t, because we never had them.
            <br />
            <br />
            <strong>So: save the PDF as soon as you download it, and back it up.</strong> If something genuinely went
            wrong — the download failed, the file was corrupt, our math was off — our {REFUND_WINDOW_DAYS}-day guarantee
            means we will make it right. Email <SupportEmailLink />.
          </>
        ),
      },
    ],
  },
  {
    section: "Payments & Guarantees",
    qas: [
      {
        question: "Which payment methods do you accept?",
        answer: (
          <>
            Payment is handled by PayPal. You can pay with your PayPal balance or account, or with whatever card options
            PayPal presents inside its own checkout window.
            <br />
            <br />
            The transaction happens entirely on PayPal’s side. <strong>We never see, receive, or store your card number
            or your PayPal credentials.</strong> Your payment is governed by PayPal’s own terms and privacy policy.
          </>
        ),
      },
      {
        question: "What if I’m unsatisfied with my paystub?",
        answer: (
          <>
            We back every order with a <strong>{REFUND_WINDOW_DAYS}-day satisfaction guarantee.</strong>
            <br />
            <br />
            If, within {REFUND_WINDOW_DAYS} days of your purchase, the document is defective — it won’t download or
            print, it’s corrupted, or our calculations are wrong — email <SupportEmailLink /> and we will refund you in
            full. You don’t have to argue with us about it.
            <br />
            <br />
            If the problem is a typo in the data you entered, a refund is at our discretion — but{" "}
            <strong>we will always give you a free corrected document.</strong> Just tell us what was wrong.
          </>
        ),
      },
    ],
  },
  {
    section: "Privacy & Revisions",
    qas: [
      {
        question: "How do you protect my sensitive information?",
        answer: (
          <>
            By never receiving it.
            <br />
            <br />
            The app runs entirely in your browser. The company details, employee details, Social Security and Employer
            Identification numbers, and wage figures you enter are <strong>never transmitted to us</strong>. There is no
            server that receives them, no database that stores them, and no copy of your document anywhere but on your own
            device.
            <br />
            <br />
            While you are working, your entries are saved as a draft in your browser’s local storage — on your machine, not
            ours. It stays there until you clear it or clear your browser data. Because the data lives on your device,
            protecting the device is up to you.
            <br />
            <br />
            The site itself is served over HTTPS, which encrypts traffic between your browser and our web host. That is
            the only encryption we claim, and it protects delivery of the website — not data we hold, because we hold
            none. Payment goes directly to PayPal; we never see card data. We cannot sell or disclose your pay stub data,
            because we do not have it.
          </>
        ),
      },
      {
        question: "Can I revise my paystub after downloading it?",
        answer: (
          <>
            You can make unlimited free edits while your browser session is active and before you download or print —
            fixing typos, changing deduction amounts, uploading a different logo, or switching templates. Go back to any
            step in the wizard and change it; the preview updates.
            <br />
            <br />
            After that, there is no account and no saved order, so there is nothing for us to reopen. Whatever draft is
            still in your browser is all that exists. If you spot a mistake after downloading and the draft is still there,
            correct it and print again. If it’s gone, contact <SupportEmailLink /> — under our {REFUND_WINDOW_DAYS}-day
            guarantee we will always sort out a document that went wrong.
          </>
        ),
      },
    ],
  },
  {
    section: "Contact & Support",
    qas: [
      {
        question: "How long do I have to edit my pay stub before it's finalized?",
        answer: (
          <>
            As long as your browser session lasts. Edits are unlimited and free right up until you download or print —
            adjust pay amounts, deductions, company information, or the template as many times as you like during the
            wizard.
            <br />
            <br />
            There is no account and no server-side copy, so nothing is "locked" by us — but equally, nothing is kept by
            us. Once you leave the site, the only version that exists is the draft in your browser and the PDF you saved.
            If you need a correction after that, reach out to <SupportEmailLink /> and we will do our best to help.
          </>
        ),
      },
      {
        question: "What’s the best way to reach your support team?",
        answer: (
          <>
            Two ways, both real people, <strong>during business hours</strong>:
            <br />
            <br />
            Email <SupportEmailLink /> — best for refund requests, corrections, and anything with details we need to read.
            <br />
            Phone <SupportPhoneLink /> — best if you’re stuck mid-order.
            <br />
            <br />
            We don’t offer live chat, and we won’t pretend to be available around the clock. We answer during business
            hours and we answer properly.
          </>
        ),
      },
    ],
  },
];


const FAQPage = () => (
  <Container maxWidth="md" sx={{ py: { xs: 4, md: 6 } }}>
    <Typography variant="h4" component="h1" gutterBottom>Frequently asked questions</Typography>
    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
      If you don’t find the answer you need, our support team is ready to help during business hours.
    </Typography>

    {faqData.map((section, sectionIdx) => {
      const qas = section.qas.filter(qa => qa.question);
      if (qas.length === 0) return null;
      return (
        <Box key={section.section} sx={{ mb: 3 }}>
          <Typography variant="h6" component="h3" color="primary.main" sx={{ mt: 3, mb: 1 }}>{section.section}</Typography>
          {qas.map((qa, qaIdx) => (
            <Accordion key={`${sectionIdx}-${qaIdx}`} disableGutters>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography fontWeight={500}>{qa.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography component="div" color="text.secondary" sx={{ lineHeight: 1.7 }}>{qa.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      );
    })}
  </Container>
);

export default FAQPage;
