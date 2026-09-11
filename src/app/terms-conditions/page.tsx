import { PolicyLayout } from "@/components/policy/policy-layout";

export const revalidate = 3600;

export const metadata = {
  title: "Terms & Conditions",
  description: "The terms and conditions for using Ready Game Code marketplace.",
  alternates: {
    canonical: "/terms-conditions",
  },
  openGraph: {
    title: "Terms & Conditions | Ready Game Code",
    description: "The terms and conditions for using Ready Game Code marketplace.",
  },
};

import { db } from "@/lib/db";

export default async function TermsConditionsPage() {
  const policy = await db.policy.findUnique({
    where: { slug: "terms-conditions" }
  });

  return (
    <PolicyLayout title="Terms & Conditions">
      {policy?.content ? (
        <div 
          className="prose prose-neutral dark:prose-invert max-w-none space-y-4"
          dangerouslySetInnerHTML={{ __html: policy.content }} 
        />
      ) : (
        <div className="space-y-8">
          <p className="text-muted-foreground lead text-lg mb-8">
            These policies help explain how we operate, how purchases and support work, and what users should expect when using our marketplace and developer resources.
          </p>
          <section>
            <h2 className="text-xl font-semibold mb-3">Agreement to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using Ready Game Code, you accept and agree to be bound by these Terms and Conditions. If you do not agree, please do not use our website. Our products are provided "as is" without warranty of any kind, either expressed or implied.
            </p>
          </section>
        </div>
      )}

      <div className="mt-12 p-6 bg-accent/30 rounded-xl border border-border">
        <h3 className="text-lg font-semibold mb-2">Need help?</h3>
        <p className="text-muted-foreground mb-4">
          If you have questions about licensing, support, refunds, or account access, our team is ready to help.
        </p>
        <a href="/contact" className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90">
          Contact us
        </a>
      </div>
    </PolicyLayout>
  );
}
