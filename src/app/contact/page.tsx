import type { Metadata } from "next";
import ContactClient from "./contact-client";
import { JsonLd } from "@/components/seo/json-ld";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Ready Game Code team for support, custom reskinning, or business inquiries.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact Us | Ready Game Code",
    description: "Get in touch with the Ready Game Code team for support, custom reskinning, or business inquiries.",
  },
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://readygamecode.com";

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Are the digital products on your marketplace safe and virus-free?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes, absolutely. Every source code is reviewed by our team before publishing. We scan all files for malware and verify code quality. Additionally, all files are served from secure servers with SSL encryption."
      }
    },
    {
      "@type": "Question",
      "name": "Can I get a refund for a digital product?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Due to the nature of digital goods, refunds are provided under specific conditions (e.g. broken source code that our team or seller cannot fix). Please read our Refund Policy for full details."
      }
    },
    {
      "@type": "Question",
      "name": "Do you offer game reskinning services?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! When purchasing any source code, you can opt for additional services like Reskinning, Publishing, and App Store Optimization during checkout."
      }
    },
    {
      "@type": "Question",
      "name": "How do I download my purchased items?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Once payment is verified, your purchased source codes are instantly available under your Dashboard > Downloads section."
      }
    },
    {
      "@type": "Question",
      "name": "Can I sell my own Unity source codes here?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes! Register an account and apply as a Seller. Once approved, you can upload your game source codes and start earning."
      }
    }
  ]
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": baseUrl
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Contact Us",
      "item": `${baseUrl}/contact`
    }
  ]
};

export default function ContactPage() {
  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema]} />
      <ContactClient />
    </>
  );
}

