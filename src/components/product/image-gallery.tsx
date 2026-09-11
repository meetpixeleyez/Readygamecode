"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { PlayCircle, Play, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImageGalleryProps {
  images: string[];
  youtubeEmbedUrl?: string | null;
  productTitle: string;
}

function getYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:embed\/|v\/|watch\?v=|youtu\.be\/|\/v=|\/e\/|watch\?.*v=)([^#&?]*).*/);
  return match && match[1]?.length === 11 ? match[1] : null;
}

export function ImageGallery({ images, youtubeEmbedUrl, productTitle }: ImageGalleryProps) {
  const videoId = youtubeEmbedUrl ? getYouTubeVideoId(youtubeEmbedUrl) : null;
  
  // Format embed URL for instant playback on user click
  const activeVideoEmbedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`
    : youtubeEmbedUrl
    ? `${youtubeEmbedUrl}${youtubeEmbedUrl.includes("?") ? "&" : "?"}autoplay=1&rel=0&playsinline=1`
    : null;

  // Filter valid image list
  const validImages = images.filter(Boolean);

  // Poster image for video (YouTube HQ thumb or first gallery image)
  const videoPosterUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
    : validImages[0] || "/products/placeholder.svg";

  // State
  const [isPlayingVideo, setIsPlayingVideo] = useState<boolean>(false);
  const [activeThumbIndex, setActiveThumbIndex] = useState<number>(0);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [modalImageIndex, setModalImageIndex] = useState<number>(0);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll bottom thumbnails to specific index
  const scrollThumbToIndex = useCallback((index: number) => {
    setActiveThumbIndex(index);
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const items = container.querySelectorAll<HTMLElement>("[data-gallery-item]");
      const target = items[index];
      if (target) {
        const targetLeft = target.offsetLeft - container.offsetLeft - (container.clientWidth - target.clientWidth) / 2;
        container.scrollTo({
          left: Math.max(0, targetLeft),
          behavior: "smooth",
        });
      }
    }
  }, []);

  const handleNextThumb = useCallback(() => {
    if (validImages.length === 0) return;
    const nextIdx = (activeThumbIndex + 1) % validImages.length;
    scrollThumbToIndex(nextIdx);
  }, [validImages.length, activeThumbIndex, scrollThumbToIndex]);

  const handlePrevThumb = useCallback(() => {
    if (validImages.length === 0) return;
    const prevIdx = (activeThumbIndex - 1 + validImages.length) % validImages.length;
    scrollThumbToIndex(prevIdx);
  }, [validImages.length, activeThumbIndex, scrollThumbToIndex]);

  // Open modal on specific image
  const handleOpenImageModal = (index: number) => {
    setModalImageIndex(index);
    setModalOpen(true);
  };

  // Auto-scroll logic for bottom screenshots
  useEffect(() => {
    if (validImages.length <= 1 || isHovered || modalOpen) return;

    const interval = setInterval(() => {
      setActiveThumbIndex((currentIdx) => {
        const nextIdx = (currentIdx + 1) % validImages.length;
        if (scrollContainerRef.current) {
          const container = scrollContainerRef.current;
          const items = container.querySelectorAll<HTMLElement>("[data-gallery-item]");
          const target = items[nextIdx];
          if (target) {
            const targetLeft = target.offsetLeft - container.offsetLeft - (container.clientWidth - target.clientWidth) / 2;
            container.scrollTo({
              left: Math.max(0, targetLeft),
              behavior: "smooth",
            });
          }
        }
        return nextIdx;
      });
    }, 3500);

    return () => clearInterval(interval);
  }, [validImages.length, isHovered, modalOpen]);

  // Keyboard navigation inside modal
  useEffect(() => {
    if (!modalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        setModalImageIndex((prev) => (prev + 1) % validImages.length);
      }
      if (e.key === "ArrowLeft") {
        setModalImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length);
      }
      if (e.key === "Escape") {
        setModalOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen, validImages.length]);

  // If no media at all
  if (validImages.length === 0 && !activeVideoEmbedUrl) {
    return (
      <div className="relative aspect-[860/450] bg-muted rounded-2xl overflow-hidden border border-border shadow-sm">
        <Image src="/products/placeholder.svg" alt={productTitle} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* 1. Main Showcase Area (Dedicated Gameplay Video Player) */}
      <div className="relative aspect-[860/450] bg-black/95 rounded-2xl overflow-hidden border border-border/80 shadow-xl group">
        {activeVideoEmbedUrl ? (
          isPlayingVideo ? (
            /* Active Live Video Stream */
            <iframe
              src={activeVideoEmbedUrl}
              title={`${productTitle} Gameplay Video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          ) : (
            /* Play Store Style Video Poster Facade */
            <div
              className="relative w-full h-full cursor-pointer group/poster overflow-hidden"
              onClick={() => setIsPlayingVideo(true)}
              role="button"
              tabIndex={0}
              aria-label="Play Gameplay Video"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsPlayingVideo(true);
                }
              }}
            >
              <Image
                src={videoPosterUrl}
                alt={`${productTitle} Video Poster`}
                fill
                sizes="(max-width: 1024px) 100vw, 66vw"
                className="object-cover transition-transform duration-700 group-hover/poster:scale-105"
                priority
              />
              
              {/* Subtle Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30 group-hover/poster:from-black/70 transition-colors" />

              {/* Modern Frosted Glass Play Button & Tag */}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3.5 z-10 pointer-events-none">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/60 group-hover/poster:bg-primary text-white shadow-2xl backdrop-blur-md border border-white/20 group-hover/poster:border-primary/50 flex items-center justify-center transition-all duration-300 group-hover/poster:scale-110">
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current translate-x-0.5 text-white transition-transform" />
                </div>

                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/15 text-white/90 text-xs font-medium shadow-lg transition-all group-hover/poster:border-primary/40 group-hover/poster:text-white">
                  <PlayCircle className="w-3.5 h-3.5 text-primary" />
                  <span>Watch Gameplay Preview</span>
                </div>
              </div>
            </div>
          )
        ) : validImages.length > 0 ? (
          /* Static Hero Image when no video exists */
          <div
            className="relative w-full h-full cursor-pointer"
            onClick={() => handleOpenImageModal(0)}
          >
            <Image
              src={validImages[0]}
              alt={productTitle}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
              priority
            />
          </div>
        ) : null}
      </div>

      {/* 2. Bottom Screenshots Carousel (Auto-Scroll with Left/Right Arrows & Hidden Scrollbar) */}
      {validImages.length > 0 && (
        <div 
          className="space-y-3"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
        >
          <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold px-1">
            <span>Screenshots ({validImages.length})</span>
            <span className="text-[11px] font-normal text-muted-foreground/70 hidden sm:inline">
              Click any screenshot to view full gallery
            </span>
          </div>

          {/* Carousel Wrapper with Floating Side Arrows */}
          <div className="relative group/carousel">
            {/* Left Floating Arrow Button */}
            {validImages.length > 2 && (
              <button
                type="button"
                onClick={handlePrevThumb}
                className="cursor-pointer absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-background/90 hover:bg-background text-foreground shadow-2xl border border-border/80 backdrop-blur-md transition-all hover:scale-110 opacity-80 hover:opacity-100 flex items-center justify-center"
                aria-label="Previous screenshot"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Scrolling Container (Scrollbar completely hidden) */}
            <div 
              ref={scrollContainerRef}
              className="flex items-center gap-3 sm:gap-4 overflow-x-auto pb-2 pt-1 scroll-smooth snap-x snap-mandatory scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {validImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  data-gallery-item
                  onClick={() => handleOpenImageModal(idx)}
                  className={cn(
                    "cursor-pointer relative flex-shrink-0 w-56 h-32 sm:w-64 sm:h-36 md:w-72 md:h-40 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-300 group bg-muted/50 shadow-md snap-center",
                    activeThumbIndex === idx
                      ? "border-primary ring-2 ring-primary/40 scale-[1.02]"
                      : "border-border/70 opacity-90 hover:opacity-100 hover:border-primary/60"
                  )}
                  role="button"
                  tabIndex={0}
                  aria-label={`View screenshot ${idx + 1}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleOpenImageModal(idx);
                    }
                  }}
                >
                  <Image
                    src={imgUrl}
                    alt={`${productTitle} - Screenshot ${idx + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 192px, (max-width: 768px) 240px, 288px"
                    priority={idx < 4}
                  />
                </div>
              ))}
            </div>

            {/* Right Floating Arrow Button */}
            {validImages.length > 2 && (
              <button
                type="button"
                onClick={handleNextThumb}
                className="cursor-pointer absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-2.5 rounded-full bg-background/90 hover:bg-background text-foreground shadow-2xl border border-border/80 backdrop-blur-md transition-all hover:scale-110 opacity-80 hover:opacity-100 flex items-center justify-center"
                aria-label="Next screenshot"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Pagination Dots */}
          {validImages.length > 1 && (
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {validImages.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => scrollThumbToIndex(idx)}
                  className={cn(
                    "transition-all duration-300 rounded-full h-1.5 cursor-pointer",
                    activeThumbIndex === idx
                      ? "w-6 bg-primary"
                      : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                  )}
                  aria-label={`Go to screenshot ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Screenshot Lightbox Dialog Modal (Checkout Modal Style with Full Navigation) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden border border-border/70 shadow-2xl rounded-2xl sm:rounded-3xl bg-background/95 backdrop-blur-xl">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 py-3.5 pr-14 border-b border-border/60 bg-muted/40">
            <div className="flex items-center gap-3 min-w-0">
              <span className="font-bold text-sm sm:text-base text-foreground truncate">
                {productTitle}
              </span>
              <span className="shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {modalImageIndex + 1} of {validImages.length}
              </span>
            </div>
          </div>

          {/* Main Image Showcase with Floating Prev/Next Controls */}
          <div className="relative p-2 sm:p-4 flex items-center justify-center bg-black/60 min-h-[300px] max-h-[66vh] overflow-hidden group/modal">
            {/* Prev Button */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={() => setModalImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length)}
                className="cursor-pointer absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/30 backdrop-blur-md transition-all hover:scale-110 shadow-2xl"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 sm:w-7 sm:h-7" />
              </button>
            )}

            {/* Displayed Image */}
            {validImages[modalImageIndex] && (
              <img
                src={validImages[modalImageIndex]}
                alt={`${productTitle} Screenshot ${modalImageIndex + 1}`}
                className="max-h-[60vh] max-w-full w-auto h-auto rounded-xl object-contain shadow-2xl transition-all duration-200"
              />
            )}

            {/* Next Button */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={() => setModalImageIndex((prev) => (prev + 1) % validImages.length)}
                className="cursor-pointer absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 rounded-full bg-black/70 hover:bg-black/90 text-white border border-white/30 backdrop-blur-md transition-all hover:scale-110 shadow-2xl"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 sm:w-7 sm:h-7" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip for Quick Scrolling inside Modal */}
          {validImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 p-3 bg-muted/30 border-t border-border/60 overflow-x-auto scrollbar-none">
              {validImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setModalImageIndex(idx)}
                  className={cn(
                    "cursor-pointer relative flex-shrink-0 w-16 h-10 sm:w-20 sm:h-12 rounded-lg overflow-hidden border-2 transition-all",
                    modalImageIndex === idx
                      ? "border-primary ring-2 ring-primary/40 scale-105"
                      : "border-border/60 opacity-60 hover:opacity-100"
                  )}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


