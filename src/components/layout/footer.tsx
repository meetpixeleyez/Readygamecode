import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MessageCircle, Facebook, Twitter, Linkedin, Instagram, Youtube, Zap, ShieldCheck, Headphones, ArrowRight } from "lucide-react";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Browse Codes", href: "/products" },
  { label: "About Us", href: "/about" },
  { label: "Blog & Tutorials", href: "/blog" },
  { label: "Contact Us", href: "/contact" },
];

const policyLinks = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-conditions" },
  { label: "Refund Policy", href: "/refund-policy" },
];

const socialLinks = [
  { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
  { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
  { icon: Youtube, href: "https://youtube.com", label: "YouTube" },
];

export function Footer() {
  return (
    <footer className="mt-auto bg-gradient-to-b from-[#0f172a] via-[#090d16] to-[#030712] text-white border-t border-white/10 relative overflow-hidden">
      {/* Top trust badges section */}
      <div className="border-b border-white/10 bg-white/[0.02] backdrop-blur-xs">
        <div className="container mx-auto py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Instant Download</h4>
                <p className="text-xs text-white/60">Access source code immediately after purchase</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <ShieldCheck className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">100% Tested & Verified</h4>
                <p className="text-xs text-white/60">Ready to publish Unity & mobile game projects</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5">
              <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm text-white">Developer Support</h4>
                <p className="text-xs text-white/60">24/7 dedicated support via email & WhatsApp</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/" className="inline-block shrink-0 mb-2">
              <Image 
                src="/logo_dark.png" 
                alt="Ready Game Code" 
                width={200} 
                height={66} 
                className="h-11 w-auto object-contain"
                priority
              />
            </Link>
            <p className="text-sm text-white/70 leading-relaxed">
              Ready Game Code is your ultimate marketplace for premium Unity 3D, Android, and iOS game source codes. Launch your games faster with our ready-to-reskin templates.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className="h-9 w-9 rounded-full bg-white/5 hover:bg-primary/20 hover:text-primary border border-white/10 flex items-center justify-center text-white/70 transition-all"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase mb-5 text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary inline-block"></span>
              Explore Market
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-primary transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="h-3 w-3 text-white/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies & Terms */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase mb-5 text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary inline-block"></span>
              Policies & Help
            </h4>
            <ul className="space-y-3">
              {policyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-primary transition-colors flex items-center gap-1.5 group"
                  >
                    <ArrowRight className="h-3 w-3 text-white/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-bold text-sm tracking-wider uppercase mb-5 text-white flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary inline-block"></span>
              Get In Touch
            </h4>
            <ul className="space-y-4">
              <li>
                <a 
                  href="mailto:info@readygamecode.com" 
                  className="flex items-center gap-3 text-sm text-white/70 hover:text-primary transition-colors group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white/5 group-hover:bg-primary/20 flex items-center justify-center shrink-0 border border-white/10 transition-colors">
                    <Mail className="h-4 w-4 text-primary" />
                  </div>
                  info@readygamecode.com
                </a>
              </li>
              <li>
                <a 
                  href="tel:+919408212310" 
                  className="flex items-center gap-3 text-sm text-white/70 hover:text-primary transition-colors group"
                >
                  <div className="h-8 w-8 rounded-lg bg-white/5 group-hover:bg-primary/20 flex items-center justify-center shrink-0 border border-white/10 transition-colors">
                    <Phone className="h-4 w-4 text-primary" />
                  </div>
                  +91 9408212310
                </a>
              </li>
              <li>
                <a 
                  href="https://api.whatsapp.com/send?phone=919408212310&text=%F0%9F%91%8B%20Hey%20Ready%20Game%20Code,%20can%20you%20help%20me%20with" 
                  className="flex items-center gap-3 text-sm text-white/70 hover:text-primary transition-colors group"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="h-8 w-8 rounded-lg bg-white/5 group-hover:bg-primary/20 flex items-center justify-center shrink-0 border border-white/10 transition-colors">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  Chat On WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/50">
          <div>
            © {new Date().getFullYear()} Ready Game Code. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-white/60">
            <span>Secure Checkout</span>
            <span>·</span>
            <span>Verified Source Code</span>
            <span>·</span>
            <span>24/7 Developer Help</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
