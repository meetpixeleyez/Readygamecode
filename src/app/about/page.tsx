import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/seo/json-ld";
import {
  Code2,
  Cpu,
  FolderTree,
  Key,
  RotateCw,
  Terminal,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Layers,
  Zap,
  Shield,
  Globe,
  Rocket,
} from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata() {
  return {
    title: "About Us — Engineering the Future of Game Development",
    description:
      "ReadyGameCode: Trusted marketplace for game developers offering professionally crafted source code, tutorials, and support.",
    alternates: {
      canonical: "/about",
    },
    openGraph: {
      title: "About Us | Ready Game Code",
      description:
        "Welcome to ReadyGameCode. We build and vet premium framework modules, networking logic, and game templates so creators can focus on design.",
      type: "website",
    },
  };
}

export default function AboutPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://readygamecode.com";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Ready Game Code",
    "url": baseUrl,
    "logo": `${baseUrl}/logo.png`,
    "description":
      "ReadyGameCode: Trusted marketplace for game developers offering professionally crafted source code, tutorials, and support.",
    "sameAs": [
      "https://facebook.com/readygamecode",
      "https://twitter.com/readygamecode",
      "https://linkedin.com/company/readygamecode",
    ],
  };

  const aboutPageSchema = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    "name": "About Ready Game Code",
    "url": `${baseUrl}/about`,
    "description": "Engineering the future of game development with vetted Unity templates and source code.",
    "mainEntity": organizationSchema
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
        "name": "About Us",
        "item": `${baseUrl}/about`
      }
    ]
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden pb-16">
      <JsonLd data={[organizationSchema, aboutPageSchema, breadcrumbSchema]} />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 bg-gradient-to-b from-primary/10 via-background to-background border-b border-border">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-extrabold uppercase tracking-widest">
                <Sparkles className="h-3.5 w-3.5" />
                System Initialization
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Engineering the Future of <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-orange-500 to-amber-500">
                  Game Development
                </span>
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
                Welcome to ReadyGameCode. We build and vet premium framework modules, networking logic, and game templates so creators can focus on design instead of pipeline bugs.
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Button size="lg" className="glow-orange font-bold uppercase tracking-wider" asChild>
                  <Link href="/products">
                    Initialize Core
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="font-bold uppercase tracking-wider" asChild>
                  <Link href="/contact">Establish Contact</Link>
                </Button>
              </div>
            </div>

            {/* Floating Frame */}
            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-3 shadow-2xl transition-transform hover:-translate-y-1">
                <div className="flex items-center gap-1.5 px-2 pb-3 pt-1 border-b border-border/50">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-muted-foreground ml-2 font-mono">dashboard_preview.png</span>
                </div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-muted mt-2 border border-border/40">
                  <Image
                    src="https://readygamecode.com/assets/templates/basic/images/about_dashboard.png"
                    alt="Cyber Dashboard Preview"
                    fill
                    className="object-cover"
                    priority
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Metrics Grid Overlay */}
      <section className="-mt-8 relative z-20 container mx-auto px-4 max-w-6xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl hover:border-primary/40 transition-all card-hover">
            <span className="text-3xl md:text-4xl font-extrabold text-primary block mb-2">500+</span>
            <h3 className="font-bold text-foreground text-base">Vetted Modules</h3>
            <p className="text-xs text-muted-foreground mt-1">Tested game controllers, logic structures, &amp; interfaces.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl hover:border-primary/40 transition-all card-hover">
            <span className="text-3xl md:text-4xl font-extrabold text-primary block mb-2">15K+</span>
            <h3 className="font-bold text-foreground text-base">Active Nodes</h3>
            <p className="text-xs text-muted-foreground mt-1">Indie game developers and studios deploying our files.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl hover:border-primary/40 transition-all card-hover">
            <span className="text-3xl md:text-4xl font-extrabold text-primary block mb-2">99.8%</span>
            <h3 className="font-bold text-foreground text-base">Execution Rate</h3>
            <p className="text-xs text-muted-foreground mt-1">Compiler-safe, clean codes with full doc tags.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-xl hover:border-primary/40 transition-all card-hover">
            <span className="text-3xl md:text-4xl font-extrabold text-primary block mb-2">24/7</span>
            <h3 className="font-bold text-foreground text-base">Ping Response</h3>
            <p className="text-xs text-muted-foreground mt-1">Direct support channels hosted by veteran game developers.</p>
          </div>
        </div>
      </section>

      {/* IDE Code Terminal Mockup Section */}
      <section className="py-20 bg-card/50 border-y border-border mt-16">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary block mb-2">Source Code Vetting</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Readability is Our Priority</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              We believe templates shouldn&apos;t be spaghetti code. We write high-standard C# architectures conforming to OOP standards.
            </p>
          </div>

          {/* IDE Editor Container */}
          <div className="rounded-2xl border border-border bg-[#0d1117] text-[#c9d1d9] shadow-2xl overflow-hidden font-mono text-xs sm:text-sm">
            {/* IDE Top Bar */}
            <div className="bg-[#161b22] px-4 py-3 border-b border-[#30363d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="px-3 py-1 bg-[#0d1117] border-t-2 border-primary text-primary rounded-t-md text-xs font-semibold flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-amber-500" />
                  PlayerController.cs
                </div>
                <div className="px-3 py-1 text-muted-foreground rounded-t-md text-xs font-semibold flex items-center gap-2">
                  <Layers className="h-3.5 w-3.5 text-blue-400" />
                  NetworkManager.json
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </div>
            </div>

            {/* IDE Body */}
            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[260px]">
              {/* Sidebar */}
              <div className="hidden md:block bg-[#161b22]/50 p-4 border-r border-[#30363d] space-y-2 text-xs">
                <div className="font-bold text-foreground flex items-center gap-1.5">
                  <FolderTree className="h-3.5 w-3.5 text-amber-400" /> Assets
                </div>
                <div className="pl-4 text-emerald-400 flex items-center gap-1.5">
                  <Code2 className="h-3 w-3" /> Player.cs
                </div>
                <div className="pl-4 text-blue-400 flex items-center gap-1.5">
                  <Code2 className="h-3 w-3" /> Network.cs
                </div>
                <div className="font-bold text-muted-foreground flex items-center gap-1.5 pt-2">
                  <FolderTree className="h-3.5 w-3.5 text-muted-foreground" /> Plugins
                </div>
              </div>

              {/* Content Area */}
              <div className="md:col-span-3 p-4 sm:p-6 space-y-1.5 bg-[#0d1117] text-xs sm:text-sm">
                <div className="text-muted-foreground font-italic">// ReadyGameCode Player Controller Foundation</div>
                <div><span className="text-[#ff7b72]">using</span> UnityEngine;</div>
                <div><span className="text-[#ff7b72]">using</span> Unity.Netcode;</div>
                <div className="py-1" />
                <div><span className="text-[#ff7b72]">public class</span> <span className="text-[#ffa657]">PlayerController</span> : <span className="text-[#79c0ff]">NetworkBehaviour</span> &#123;</div>
                <div className="pl-6">[<span className="text-[#79c0ff]">SerializeField</span>] <span className="text-[#ff7b72]">private float</span> moveSpeed = <span className="text-[#a5d6ff]">8.5f</span>;</div>
                <div className="py-1" />
                <div className="pl-6"><span className="text-[#ff7b72]">public override void</span> <span className="text-[#d2a8ff]">OnNetworkSpawn</span>() &#123;</div>
                <div className="pl-12"><span className="text-[#ff7b72]">if</span> (!IsOwner) <span className="text-[#d2a8ff]">DisableMovementCamera</span>();</div>
                <div className="pl-6">&#125;</div>
                <div>&#125;</div>
              </div>
            </div>

            {/* Console Output Footer */}
            <div className="bg-[#161b22] px-4 py-3 border-t border-[#30363d] flex items-center gap-2 text-xs">
              <Terminal className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-emerald-400 font-bold">[INFO] Parsing template assembly files... Done.</span>
              <span className="text-muted-foreground hidden sm:inline">| [SUCCESS] 0 compilation errors.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Cyber Pillars / System Architecture Section */}
      <section className="py-20 container mx-auto px-4 max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary block mb-2">System Architecture</span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Engineered For Smooth Deployment</h2>
          <p className="text-sm md:text-base text-muted-foreground mt-2">
            We bridge the gap between complex mechanics and your visual blueprints. Deploy clean logic slots in minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-all card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-4">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Highly Optimized</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Zero garbage collection spikes. Built for clean execution on mobile processors and console pipelines.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-all card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 mb-4">
                <Layers className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Modular Setup</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Decoupled elements. Swap out components, inputs, or asset textures without breaking compiler logic trees.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-all card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4">
                <Key className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">Verified Licenses</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                No hidden obligations. Commercial deployment permission included with clear boundaries.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/40 transition-all card-hover flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-4">
                <RotateCw className="h-6 w-6" />
              </div>
              <h3 className="font-bold text-foreground text-lg mb-2">LTS Compatibility</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Updated for engine iterations. We maintain libraries for current Unity/Godot LTS builds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Expansion Roadmap Section */}
      <section className="py-20 bg-card/40 border-y border-border">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary block mb-2">Deployment Log</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">Our Expansion Roadmap</h2>
            <p className="text-sm md:text-base text-muted-foreground mt-2">
              Chronological records tracking platform nodes from initial launch to global multiplayer deployment.
            </p>
          </div>

          <div className="relative border-l-2 border-primary/30 ml-4 md:ml-32 space-y-12 pl-6 md:pl-10">
            <div className="relative">
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 h-5 w-5 rounded-full bg-primary border-4 border-background shadow-lg" />
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">Level 01</span>
              <h3 className="text-lg font-bold text-foreground mt-2">Genesis (2022)</h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                ReadyGameCode initializes. Founded by indie engineers to bypass broken asset store templates, releasing 10 robust starter modules.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 h-5 w-5 rounded-full bg-primary border-4 border-background shadow-lg" />
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">Level 02</span>
              <h3 className="text-lg font-bold text-foreground mt-2">Multi-Channel (2023)</h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                Formed partnerships with game studios to verify modular dependencies. Initiated full documentation sets and deployment guides.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 h-5 w-5 rounded-full bg-primary border-4 border-background shadow-lg" />
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">Level 03</span>
              <h3 className="text-lg font-bold text-foreground mt-2">Online Backend (2024)</h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                Introduced Netcode multiplayer suites and Firebase modules supporting persistent game databases.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -left-[31px] md:-left-[47px] top-1.5 h-5 w-5 rounded-full bg-primary border-4 border-background shadow-lg" />
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-extrabold uppercase tracking-wider">Level 04</span>
              <h3 className="text-lg font-bold text-foreground mt-2">Global V2.0 Hub (2026)</h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                Fully scaled library serving thousands of live game projects. Continuous compilation upgrades to match next-gen mechanics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Immersive Portal CTA Section */}
      <section className="pt-20 container mx-auto px-4 max-w-5xl">
        <div className="rounded-3xl bg-gradient-to-r from-primary via-orange-600 to-amber-600 p-8 sm:p-14 text-center text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">Connect Your Creative Pipelines</h2>
            <p className="text-sm md:text-base text-white/90 leading-relaxed">
              Unlock compile-ready assets and build mechanics at hyper-speed. Join thousands of creators launching games today.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white text-primary hover:bg-white/90 font-extrabold text-sm uppercase tracking-wider shadow-xl transition-all hover:-translate-y-0.5"
              >
                Access Repository
              </Link>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/50 font-extrabold text-sm uppercase tracking-wider backdrop-blur-md shadow-md transition-all hover:-translate-y-0.5"
              >
                View Tutorials
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center h-12 px-8 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/50 font-extrabold text-sm uppercase tracking-wider backdrop-blur-md shadow-md transition-all hover:-translate-y-0.5"
              >
                Request Custom Port
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
