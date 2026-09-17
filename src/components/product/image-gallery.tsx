"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { PlayCircle, Play, ChevronLeft, ChevronRight, X, Eye, Maximize2 } from "lucide-react";
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
      {/* 1. Main Showcase Area (Dedicated Gameplay Video Player or Universal Aspect Ratio Hero) */}
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
          /* Static Hero Image when no video exists: Ambient Glow + Universal Fit */
          <div
            className="relative w-full h-full cursor-pointer flex items-center justify-center overflow-hidden bg-black/90 group/hero"
            onClick={() => handleOpenImageModal(0)}
            role="button"
            tabIndex={0}
            aria-label="Open screenshot gallery"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleOpenImageModal(0);
              }
            }}
          >
            {/* Ambient Blurred Background for seamless aspect ratio framing */}
            <div
              className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-30 scale-110 pointer-events-none"
              style={{ backgroundImage: `url(${validImages[0]})` }}
            />

            {/* Foreground Image: Perfect fit for any dimension (16:9, 9:16 portrait, 1:1 square) */}
            <img
              src={validImages[0]}
              alt={productTitle}
              className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-500 group-hover/hero:scale-[1.02]"
            />

            {/* Subtle Expand Hint on Hover */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/hero:opacity-100 transition-opacity z-20 flex items-center justify-center pointer-events-none">
              <span className="bg-black/75 text-white text-xs font-medium px-3.5 py-1.5 rounded-full border border-white/20 backdrop-blur-md flex items-center gap-1.5 shadow-xl">
                <Maximize2 className="w-3.5 h-3.5" /> Click to view full size
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* 2. Bottom Screenshots Carousel (Universal Fit for Portrait/Landscape + Hidden Scrollbar) */}
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
                    "cursor-pointer relative flex-shrink-0 w-56 h-32 sm:w-64 sm:h-36 md:w-72 md:h-40 rounded-xl sm:rounded-2xl overflow-hidden border-2 transition-all duration-300 group bg-black/80 shadow-md snap-center flex items-center justify-center",
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
                  {/* Ambient Blurred Background */}
                  <div
                    className="absolute inset-0 bg-cover bg-center filter blur-md opacity-25 scale-110 pointer-events-none"
                    style={{ backgroundImage: `url(${imgUrl})` }}
                  />

                  {/* Sharp Foreground Image - Fits any dimensions without cropping */}
                  <img
                    src={imgUrl}
                    alt={`${productTitle} - Screenshot ${idx + 1}`}
                    className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain transition-transform duration-500 group-hover:scale-105 p-1"
                    loading={idx < 4 ? "eager" : "lazy"}
                  />

                  {/* Subtle hover overlay hint */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex items-center justify-center pointer-events-none">
                    <div className="p-2 rounded-full bg-black/60 text-white backdrop-blur-sm shadow-lg scale-90 group-hover:scale-100 transition-transform">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
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

      {/* 3. Screenshot Lightbox Dialog Modal (Full Widescreen Responsive & Universal Fit) */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent 
          showCloseButton={false}
          className="w-[96vw] max-w-[96vw] sm:max-w-[92vw] lg:max-w-6xl xl:max-w-7xl max-h-[94vh] p-0 overflow-hidden border border-border/80 shadow-2xl rounded-2xl sm:rounded-3xl bg-background/98 backdrop-blur-2xl flex flex-col gap-0"
        >
          {/* Modal Header: Title + Badge + Dedicated Close Button (Zero collision) */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-border/60 bg-muted/40 shrink-0">
            <div className="flex items-center gap-3 min-w-0 pr-3">
              <span className="font-semibold text-sm sm:text-base text-foreground truncate max-w-[60vw]">
                {productTitle}
              </span>
              <span className="shrink-0 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {modalImageIndex + 1} / {validImages.length}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="cursor-pointer rounded-full h-8 w-8 bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground flex items-center justify-center transition-all border border-border/60 hover:scale-105 shrink-0"
              aria-label="Close screenshot preview"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Main Stage: Ambient Blur Glow + Universal object-contain + Floating Controls */}
          <div className="relative flex-1 flex items-center justify-center bg-black/95 p-2 sm:p-4 min-h-[320px] max-h-[calc(94vh-140px)] w-full overflow-hidden select-none group/modal">
            {/* Ambient Blurred Backdrop for Portrait/Square/Letterboxed Images */}
            {validImages[modalImageIndex] && (
              <div
                className="absolute inset-0 bg-cover bg-center filter blur-2xl opacity-20 scale-110 pointer-events-none"
                style={{ backgroundImage: `url(${validImages[modalImageIndex]})` }}
              />
            )}

            {/* Prev Button */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={() => setModalImageIndex((prev) => (prev - 1 + validImages.length) % validImages.length)}
                className="cursor-pointer absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 shadow-2xl hover:border-primary/50"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}

            {/* Displayed Image: 100% Fit for Any Dimension (16:9, 9:16 portrait, 1:1 square, 4:3, etc.) */}
            {validImages[modalImageIndex] && (
              <img
                src={validImages[modalImageIndex]}
                alt={`${productTitle} Screenshot ${modalImageIndex + 1}`}
                className="relative z-10 max-h-[calc(94vh-160px)] max-w-full w-auto h-auto rounded-lg object-contain shadow-2xl transition-all duration-200"
                style={{ maxHeight: "calc(94vh - 160px)", maxWidth: "100%" }}
              />
            )}

            {/* Next Button */}
            {validImages.length > 1 && (
              <button
                type="button"
                onClick={() => setModalImageIndex((prev) => (prev + 1) % validImages.length)}
                className="cursor-pointer absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 p-2.5 sm:p-3.5 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/20 backdrop-blur-md transition-all hover:scale-110 shadow-2xl hover:border-primary/50"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            )}
          </div>

          {/* Bottom Thumbnails Strip for Quick Scrolling inside Modal */}
          {validImages.length > 1 && (
            <div className="flex items-center justify-center gap-2 p-2.5 sm:p-3 bg-muted/40 border-t border-border/60 overflow-x-auto scrollbar-none shrink-0">
              {validImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setModalImageIndex(idx)}
                  className={cn(
                    "cursor-pointer relative flex-shrink-0 w-16 h-11 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all bg-black/50 p-0.5",
                    modalImageIndex === idx
                      ? "border-primary ring-2 ring-primary/40 scale-105"
                      : "border-border/60 opacity-60 hover:opacity-100"
                  )}
                  aria-label={`Jump to screenshot ${idx + 1}`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumb ${idx + 1}`}
                    className="w-full h-full object-contain"
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


