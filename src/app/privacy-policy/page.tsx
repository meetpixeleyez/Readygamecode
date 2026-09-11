import { PolicyLayout } from "@/components/policy/policy-layout";

export const revalidate = 3600;

export const metadata = {
  title: "Privacy Policy",
  description: "How Ready Game Code collects, uses, and protects your personal information.",
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: "Privacy Policy | Ready Game Code",
    description: "How Ready Game Code collects, uses, and protects your personal information.",
  },
};

import { db } from "@/lib/db";

export default async function PrivacyPolicyPage() {
  const policy = await db.policy.findUnique({
    where: { slug: "privacy-policy" }
  });

  return (
    <PolicyLayout title="Privacy Policy">
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
            <h2 className="text-xl font-semibold mb-3">What information do we collect?</h2>
            <p className="text-muted-foreground leading-relaxed">
              We gather data from you when you register on our site, submit a request, buy any services, react to an overview, or round out a structure. At the point when requesting any assistance or enrolling on our site, as suitable, you might be approached to enter your: name, email address, or telephone number. You may, nonetheless, visit our site anonymously.
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
