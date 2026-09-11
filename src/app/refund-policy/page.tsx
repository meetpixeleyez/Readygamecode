import { PolicyLayout } from "@/components/policy/policy-layout";

export const revalidate = 3600;

export const metadata = {
  title: "Refund Policy",
  description: "Refund policy for digital products purchased on Ready Game Code.",
  alternates: {
    canonical: "/refund-policy",
  },
  openGraph: {
    title: "Refund Policy | Ready Game Code",
    description: "Refund policy for digital products purchased on Ready Game Code.",
  },
};

import { db } from "@/lib/db";

export default async function RefundPolicyPage() {
  const policy = await db.policy.findUnique({
    where: { slug: "refund-policy" }
  });

  return (
    <PolicyLayout title="Refund Policy">
      {policy?.content ? (
        <div 
          className="prose prose-neutral dark:prose-invert max-w-none space-y-4"
          dangerouslySetInnerHTML={{ __html: policy.content }} 
        />
      ) : (
        <div className="space-y-8">
          <h2>Digital Product Refunds</h2>
          <p>
            Due to the nature of digital products, all sales are generally
            considered final. However, we understand that issues can arise. This
            policy outlines the cases where refunds are available.
          </p>
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
