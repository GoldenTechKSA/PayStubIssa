import React from "react";
import {
  Container, Box, Typography, Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const faqData = [
  {
    section: "About Our Service",
    qas: [
      {
        question: "What makes your paystub service different from others?",
        answer: (
          <>
            Our service stands out through specialized expertise in small business payroll needs. Consulted by certified accountants, we combine industry knowledge with intuitive technology to create pay stubs that meet compliance standards while offering personalized adjustments. Unlike automated generators, we provide human-created templates designed for real-world use cases like pay stubs, W-2s, loans, rentals, and employment verification.
          </>
        ),
      },
      {
        question: "Are the paystubs generated through your service legally valid?",
        answer: (
          <>
            Yes, our paystubs are legally recognized documents when populated with accurate information. They include all required components for income verification: gross wages, itemized deductions, tax withholdings, and year-to-date totals. Financial institutions, landlords, and government agencies widely accept them, provided the data reflects genuine earnings.
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
            A paystub serves as a detailed record of an employee’s compensation for a specific pay period. It typically displays gross earnings before deductions, followed by breakdowns of taxes, Social Security, Medicare, insurance premiums, retirement contributions, and other withholdings. The final section shows net pay—the actual amount the employee receives. Year-to-date columns track cumulative earnings and deductions for tax purposes.
          </>
        ),
      },
      {
        question: "Why should I choose an online paystub generator over manual creation?",
        answer: (
          <>
            Online generation eliminates the time-consuming process of manual calculations and formatting while reducing errors. Our system automatically applies up-to-date tax rates and labor regulations, ensuring compliance. Professionally designed templates lend credibility to your documents, whether you’re a small business owner, freelancer, or employer managing payroll in-house.
          </>
        ),
      },
      {
        question: "Who typically needs your paystub services?",
        answer: (
          <>
            Our solutions cater to small business owners who lack dedicated payroll departments, self-employed professionals requiring income verification, and employers seeking efficient wage documentation. Freelancers, gig workers, and independent contractors also use our stubs to validate earnings for financial applications or legal purposes.
          </>
        ),
      },
      {
        question: "Do you offer subscription plans for recurring needs?",
        answer: (
          <>
            Currently, we operate on a per-document payment model without subscription options. For businesses needing ongoing payroll management, we recommend exploring other subscription services (Quickbooks, adp, paycore, etc...), which specializes in recurring payroll solutions with automated tax filings and employee portals.
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
            You start by entering employer and employee details, including company name, address, and tax IDs. Next, input wage information such as hourly rates or salaries, hours worked, and pay dates. Our system calculates taxes and deductions automatically based on the employee’s state. Before finalizing, you can preview the stub, add logos, adjust templates, and confirm all data. The completed document downloads instantly in print-ready PDF format.
          </>
        ),
      },
      {
        question: "Can I incorporate my company branding?",
        answer: (
          <>
            Absolutely. During the customization phase, you may upload your company logo, which appears at the top of each paystub. We also offer multiple template designs—from minimalist to detailed layouts—to match your business’s professional image.
          </>
        ),
      },
      {
        question: "What’s the process for generating stubs for multiple employees?",
        answer: (
          <>
            Our batch processing feature streamlines this task. After entering the first employee’s details, select “Add Employee” to replicate the pay period across your team. The system maintains consistent company information while allowing individual adjustments to wages, hours, and deductions. You may download all stubs together in a single PDF or as separate files.
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
            Upon payment confirmation, your documents are immediately available for download through print command or secure link sent to your registered email address. We provide two format options: a consolidated multi-page PDF for all stubs or a ZIP file containing individual documents in PDF or JPEG format. If the email isn’t in your inbox, please check spam or promotions folders.
          </>
        ),
      },
      {
        question: "Why does my printed paystub show overlapping text?",
        answer: (
          <>
            This usually occurs when printer settings don’t match the document’s specifications. Ensure your printer is set to US Letter paper size (8.5” x 11”) with scaling at 100%. We also recommend using the preview tool before printing to confirm proper alignment. If issues persist, try downloading the PDF again or contact our support team for a reformatted version.
          </>
        ),
      },
      {
        question: "Is it possible to retrieve a lost paystub?",
        answer: (
          <>
            Yes. All completed stubs remain accessible through the original download link in your confirmation email indefinitely. If you’ve misplaced the email, our support team can resend the documents within minutes after verifying your purchase details.
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
            We securely process payments via major credit/debit cards (Visa, Mastercard, Amex, Discover), PayPal, Apple Pay, and Google Pay. All transactions use 256-bit encryption with no sensitive data stored on our servers.
          </>
        ),
      },
      {
        question: "What if I’m unsatisfied with my paystub?",
        answer: (
          <>
            We back every order with a 30-day satisfaction guarantee. If errors stem from our system (e.g., incorrect tax calculations), we’ll correct them immediately or issue a full refund upon request. Note that refunds aren’t applicable for user-input mistakes, but we provide free edits to fix typos, adjust templates, or update figures.
          </>
        ),
      },
    ],
  },
  {
    section: "W-2 Forms",
    qas: [
      {
        question: "Do you handle IRS filings for W-2 forms?",
        answer: (
          <>
            No. While we generate W-2 forms with proper formatting and fields, employers remain responsible for submitting them to the IRS and Social Security Administration. Our documents include instructions for mailing and e-filing to simplify the process.
          </>
        ),
      },
      {
        question: "Why does my W-2 show different amounts than my current pay?",
        answer: (
          <>
            W-2 forms report taxable earnings within a calendar year, not your ongoing salary. For example, if you started employment mid-year, the form reflects earnings from your hire date through December 31. The pay period count may vary (e.g., 11 or 13 periods) depending on your payroll schedule.
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
          We implement rigorous financial-grade security protocols to safeguard your information. All data transfers are protected by industry-standard SSL/TLS encryption, while our systems undergo regular security audits to maintain the highest protection standards. We enforce stringent access controls to ensure only authorized personnel can view your data. Rest assured, we never sell or disclose your information to third parties except when required by law. For your protection, all documents remain temporarily accessible in your browser session and are permanently erased once you close the browser or complete your download/printing.          </>
        ),
      },
      {
        question: "Can I revise my paystub after downloading it?",
        answer: (
          <>
            Yes, you can make unlimited revisions to your pay stub—free of charge—as long as your session remains active and before you finalize the document for printing or download. Common updates include correcting typographical errors, modifying deduction amounts, uploading a new company logo, or switching to a different template design.
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
            You can make unlimited revisions to your pay stub—completely free of charge—while your session is active and before you download or print the document. This means you can freely adjust details like pay amounts, deductions, company information, or templates during the creation process. Once you’ve downloaded or printed your pay stub, the editing window closes to ensure document integrity. However, if you need corrections after finalizing, you’ll need to generate a new stub. Exception: For bulk orders or special circumstances, our support team may assist with revisions—just reach out, and we’ll do our best to accommodate your request.
          </>
        ),
      },
      {
        question: "What’s the best way to reach your support team?",
        answer: (
          <>
            We offer 24/7 assistance through three channels: live chat on our website, email at <a href="mailto:support@paystubIssa.com">support@paystubissa.com</a>, 
            or phone at <a href="tel:+14252478733">+1 (425) 247-8733</a>. Average response times are under 15 minutes for urgent requests.
          </>
        ),
      },
    ],
  },
  {
    section: "More Questions and Answers Comming Soon",
    qas: [
      {
        question: "",
        answer: (
          <>
            You.
          </>
        ),
      },
      {
        question: "",
        answer: (
          <>
            We
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
      If you don’t find the answer you need, our support team is always ready to assist you.
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
