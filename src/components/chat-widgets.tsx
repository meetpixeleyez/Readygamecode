"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle, MessageSquare, X, ChevronRight, Headphones } from "lucide-react";
import { cn } from "@/lib/utils";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

export function ChatWidgets() {
  const [isOpen, setIsOpen] = useState(false);
  const [isChatActive, setIsChatActive] = useState(false);
  const hubRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Tawk.to window variables
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    // Auto-hide Tawk.to default standalone floating bubble so our custom Hub has full control
    (window as any).Tawk_API.onLoad = function () {
      try {
        (window as any).Tawk_API?.hideWidget();
      } catch (e) {}
    };

    // Listen to maximize & minimize events to show/hide the custom Close Chat button
    (window as any).Tawk_API.onChatMaximized = function () {
      setIsChatActive(true);
    };

    (window as any).Tawk_API.onChatMinimized = function () {
      setIsChatActive(false);
      try {
        (window as any).Tawk_API?.hideWidget();
      } catch (e) {}
    };

    (window as any).Tawk_API.onChatHidden = function () {
      setIsChatActive(false);
    };

    const propertyId = "6a66eeb59b421a1d42846db7";
    const widgetId = "1juh18u83";

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`;
    script.charset = "UTF-8";
    script.setAttribute("crossorigin", "*");

    const firstScript = document.getElementsByTagName("script")[0];
    if (firstScript && firstScript.parentNode) {
      firstScript.parentNode.insertBefore(script, firstScript);
    } else {
      document.body.appendChild(script);
    }

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hubRef.current && !hubRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleOpenLiveChat = () => {
    try {
      (window as any).Tawk_API?.showWidget();
      (window as any).Tawk_API?.maximize();
      setIsChatActive(true);
    } catch (e) {
      console.error("Tawk.to could not be opened", e);
    }
    setIsOpen(false);
  };

  const handleCloseLiveChat = () => {
    try {
      (window as any).Tawk_API?.minimize();
      (window as any).Tawk_API?.hideWidget();
    } catch (e) {
      console.error("Tawk.to could not be closed", e);
    }
    setIsChatActive(false);
  };

  return (
    <>
      {/* Top Floating Close Button whenever Live Chat is Open (Super Easy Exit for Mobile) */}
      {isChatActive && (
        <button
          type="button"
          onClick={handleCloseLiveChat}
          className="fixed top-3 right-3 z-[999999] flex items-center gap-1.5 px-4 py-2 rounded-full bg-black/85 hover:bg-black text-white text-xs font-bold shadow-2xl border border-white/30 backdrop-blur-md transition-all hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in zoom-in-95"
          aria-label="Close Chat"
        >
          <X className="w-4 h-4 text-white" />
          <span>Close Chat</span>
        </button>
      )}

      {/* Support Hub Floating Launcher */}
      <div
        ref={hubRef}
        className={cn(
          "fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 flex flex-col items-end select-none transition-opacity duration-200",
          isChatActive ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
      >
        {/* 1. Support Popup Card */}
        {isOpen && (
          <div className="mb-3 w-72 sm:w-80 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-xl p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Card Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-foreground">Need Support?</h4>
                  <p className="text-[11px] text-muted-foreground">We usually reply within minutes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Channels List */}
            <div className="space-y-2 pt-3">
              {/* Channel 1: WhatsApp Support */}
              <Link
                href="https://api.whatsapp.com/send?phone=9194082123108&text=%F0%9F%91%8B%20Hey%20Ready%20Game%20Code,%20can%20you%20help%20me%20with"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-between p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all group/item"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-md shrink-0">
                    <WhatsAppIcon className="w-5 h-5 fill-white" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-foreground group-hover/item:text-[#25D366] transition-colors">
                      WhatsApp Chat
                    </div>
                    <div className="text-[10px] text-muted-foreground">Instant chat & source code support</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/item:text-foreground group-hover/item:translate-x-0.5 transition-all" />
              </Link>

              {/* Channel 2: Live Chat (Tawk.to) */}
              <button
                type="button"
                onClick={handleOpenLiveChat}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-all group/item cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md shrink-0">
                    <MessageSquare className="w-5 h-5 text-primary-foreground" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-semibold text-foreground group-hover/item:text-primary transition-colors">
                      Live Chat Support
                    </div>
                    <div className="text-[10px] text-muted-foreground">Chat with an available agent</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover/item:text-foreground group-hover/item:translate-x-0.5 transition-all" />
              </button>
            </div>
          </div>
        )}

        {/* 2. Unified Floating Support Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={cn(
            "relative flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer border-2 border-white/25 backdrop-blur-md",
            isOpen
              ? "bg-muted text-foreground rotate-90"
              : "bg-gradient-to-tr from-primary to-orange-500 text-white shadow-primary/30"
          )}
          aria-label="Toggle Support Hub"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              {/* Pulsing online status ring */}
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white" />
              </span>
              <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7" />
            </>
          )}
        </button>
      </div>
    </>
  );
}
