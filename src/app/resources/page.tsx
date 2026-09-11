import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Resources - Ready Game Code",
  description:
    "Explore practical guides, setup instructions, and implementation ideas to help you build, launch, and monetize your game projects faster.",
  alternates: {
    canonical: "/resources",
  },
};

export default function ResourcesPage() {
  return (
    <div className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-3xl mx-auto text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Developer resources</h1>
        <p className="text-muted-foreground">
          Explore practical guides, setup instructions, and implementation ideas to help you build, launch, and monetize your game projects faster.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-3">Unity game setup</h3>
          <p className="text-muted-foreground">
            Learn how to structure your project, configure scenes, and prepare your game for testing and publishing.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-3">Firebase and backend</h3>
          <p className="text-muted-foreground">
            Get practical guidance on authentication, leaderboards, cloud storage, and backend integration for multiplayer games.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow">
          <h3 className="text-xl font-semibold mb-3">AdMob and monetization</h3>
          <p className="text-muted-foreground">
            Understand how to implement rewarded ads, banner placements, and monetization strategies in a responsible way.
          </p>
        </div>
      </div>
    </div>
  );
}
