"use client";

import Link from "next/link";
import { Search, ShoppingCart, Menu, X, User, Sparkles, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { JwtPayload } from "@/lib/auth";
import { SearchBar } from "@/components/SearchBar";
import { CategoryMegaMenu } from "./category-mega-menu";
import { ThemeToggle } from "@/components/theme-toggle";

type SubCategory = { id: string; name: string };
type Category = { id: string; name: string; subCategories: SubCategory[] };

type NavLink = {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
};

const navLinks: NavLink[] = [
  { label: "Browse Codes", href: "/products" },
  { label: "Blog", href: "/blog" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

export function Header({ session, cartCount = 0, categories = [] }: { session: JwtPayload | null; cartCount?: number; categories?: Category[] }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const isAdmin = session?.role ? String(session.role).toLowerCase() === "admin" : false;

  const isActive = (href: string) => {
    if (!pathname) return false;
    const baseHref = href.split("?")[0];
    if (baseHref === "/") return pathname === "/";
    return pathname.startsWith(baseHref);
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 shadow-xs">
      {/* Top Bar Announcement */}
      <div className="w-full bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] text-white border-b border-white/10">
        <div className="container mx-auto flex justify-between items-center py-2 px-4 text-xs font-medium">
          {/* Left side */}
          <div className="hidden md:flex items-center gap-4">
            <a 
              href="tel:+919408212310" 
              className="flex items-center gap-1.5 hover:text-primary transition-colors text-white/80"
            >
              <Phone className="h-3.5 w-3.5 text-primary" />
              +91 9408212310
            </a>
            <span className="text-white/20">|</span>
            <Link href="/contact" className="hover:text-primary transition-colors text-white/80">
              Support Center
            </Link>
          </div>

          {/* Center scroll announcement */}
          <div className="relative overflow-hidden flex-1 mx-4 text-center whitespace-nowrap hidden sm:block">
            <div className="inline-block whitespace-nowrap animate-marquee">
              <span className="inline-block pr-16 text-xs text-white/90">
                🚀 <strong className="text-primary">Instant Download</strong> — Unity 3D, Android & iOS Game Source Codes | 100% Tested Templates!
              </span>
              <span className="inline-block pr-16 text-xs text-white/90">
                🎮 Need Custom Reskin or Game Development? <strong className="text-primary">Hire Our Expert Developers Today!</strong>
              </span>
            </div>
          </div>

          {/* Right side hire button */}
          <Link
            href="https://api.whatsapp.com/send?phone=919408212310&text=%F0%9F%91%8B%20Hey%20Ready%20Game%20Code,%20can%20you%20help%20me%20with"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-1 rounded-full border border-primary/40 bg-primary/10 hover:bg-primary/20 text-white text-xs font-semibold relative overflow-hidden transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />
            <span className="bg-gradient-to-r from-primary via-[#ffcc70] to-white bg-[length:200%_auto] text-transparent bg-clip-text animate-shine">
              Hire Us
            </span>
          </Link>
        </div>
      </div>

      {/* Main navigation */}
      <div className="w-full border-b border-border/60 bg-background/95 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center shrink-0">
              <Image 
                src="/logo.png" 
                alt="Ready Game Code" 
                width={180} 
                height={60} 
                className="h-10 w-auto object-contain hover:scale-102 transition-transform dark:hidden"
                priority
              />
              <Image 
                src="/logo_dark.png" 
                alt="Ready Game Code" 
                width={180} 
                height={60} 
                className="h-10 w-auto object-contain hover:scale-102 transition-transform hidden dark:block"
                priority
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              <CategoryMegaMenu categories={categories} />
              {navLinks.map((link) => {
                const active = isActive(link.href);
                return link.children ? (
                  <DropdownMenu key={link.label}>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`text-sm font-medium ${active ? "text-primary font-semibold bg-primary/10" : "hover:text-primary"}`}
                      >
                        {link.label}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {link.children.map((child) => (
                        <DropdownMenuItem key={child.label} asChild>
                          <Link href={child.href}>{child.label}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button 
                    key={link.label} 
                    variant="ghost" 
                    size="sm" 
                    asChild
                    className={active ? "text-primary font-semibold bg-primary/10" : "hover:text-primary"}
                  >
                    <Link href={link.href} className="text-sm font-medium">
                      {link.label}
                    </Link>
                  </Button>
                );
              })}
            </nav>

            {/* Search Bar */}
            <div className="hidden md:flex items-center flex-1 max-w-xs lg:max-w-sm justify-end">
              <SearchBar />
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              <ThemeToggle />

              {!isAdmin && (
                <Button variant="ghost" size="icon" asChild className="relative hover:bg-accent/60">
                  <Link href="/cart" aria-label="Cart">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[11px] rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-xs">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                </Button>
              )}

              <div className="hidden sm:flex items-center gap-2">
                {session ? (
                  <>
                    {isAdmin && (
                      <Button variant="outline" size="sm" asChild className="font-semibold">
                        <Link href="/admin">Admin Panel</Link>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" asChild className="rounded-full">
                      <Link href={isAdmin ? "/admin" : "/dashboard/profile"} aria-label="Profile">
                        <User className="h-5 w-5 text-primary" />
                      </Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="sm" asChild className="font-medium">
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button size="sm" asChild className="font-semibold shadow-xs">
                      <Link href="/register">Register</Link>
                    </Button>
                  </>
                )}
              </div>

              {/* Mobile Menu Trigger */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label="Toggle menu"
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Drawer Navigation */}
          {mobileOpen && (
            <div className="absolute top-16 left-0 w-full bg-background border-b border-border shadow-xl py-5 px-5 flex flex-col gap-4 z-40 lg:hidden animate-in slide-in-from-top-2">
              <div className="mb-2">
                <SearchBar />
              </div>

              <nav className="flex flex-col gap-3">
                <div className="font-semibold text-sm px-1">
                  <CategoryMegaMenu categories={categories} />
                </div>
                {navLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.label}
                      href={link.href}
                      className={`font-medium text-sm px-3 py-2 rounded-lg transition-colors ${
                        active ? "text-primary bg-primary/10 font-semibold" : "hover:bg-accent/60"
                      }`}
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="pt-4 border-t border-border flex items-center justify-between">
                {session ? (
                  <Button size="sm" className="w-full" asChild>
                    <Link href={isAdmin ? "/admin" : "/dashboard"}>
                      My Account
                    </Link>
                  </Button>
                ) : (
                  <div className="grid grid-cols-2 gap-3 w-full">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/login">Login</Link>
                    </Button>
                    <Button size="sm" asChild>
                      <Link href="/register">Register</Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
