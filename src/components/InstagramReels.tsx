import { useEffect, useRef, useState, useCallback } from "react";
import { Instagram, ChevronLeft, ChevronRight } from "lucide-react";
import {
  INSTAGRAM_PROFILE_URL,
  INSTAGRAM_HANDLE,
  WIDGET_EMBED_HTML,
  REEL_URLS,
} from "@/config/instagramReels";

function toEmbedUrl(url: string): string {
  const cleaned = url.split("?")[0].replace(/\/$/, "");
  return `${cleaned}/embed`;
}

function WidgetEmbed({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = html;
    el.querySelectorAll("script").forEach((oldScript) => {
      const s = document.createElement("script");
      for (const attr of Array.from(oldScript.attributes)) s.setAttribute(attr.name, attr.value);
      s.text = oldScript.text;
      oldScript.replaceWith(s);
    });
  }, [html]);
  return <div ref={ref} className="w-full" />;
}

// How to add more reels:
// Go to instagram.com → open any reel → copy the URL from the address bar
// Add it to REEL_URLS in src/config/instagramReels.ts
// Example: "https://www.instagram.com/reel/CxxxxxxxXxx/"

export default function InstagramReels() {
  const hasWidget = WIDGET_EMBED_HTML.trim().length > 0;
  const reels = REEL_URLS.slice(0, 9).filter(Boolean);
  const [current, setCurrent] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  // Preload all reels from the start so they're ready
  const [loaded, setLoaded] = useState<boolean[]>(() => reels.map(() => true));

  const goTo = useCallback((idx: number) => {
    if (idx === current || transitioning) return;
    setTransitioning(true);
    setTimeout(() => {
      setCurrent(idx);
      setTransitioning(false);
    }, 300);
  }, [current, transitioning]);

  const prev = useCallback(() => goTo((current - 1 + reels.length) % reels.length), [goTo, current, reels.length]);
  const next = useCallback(() => goTo((current + 1) % reels.length), [goTo, current, reels.length]);

  // Auto-slide every 15 seconds
  useEffect(() => {
    if (reels.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reels.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [reels.length]);

  if (hasWidget) {
    return (
      <section id="reels" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <WidgetEmbed html={WIDGET_EMBED_HTML} />
        </div>
      </section>
    );
  }

  return (
    <section id="reels" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-200 text-pink-600 text-sm font-medium mb-3">
            <Instagram className="w-4 h-4" /> {INSTAGRAM_HANDLE}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">
            From Our <span className="gradient-text">Founders</span>
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Behind-the-scenes, build logs, and quick tips — straight from our Instagram.
          </p>
          {/* Tip for adding more reels */}
          <p className="text-xs text-gray-400 mt-2">
            💡 To add more reels: paste Instagram reel URLs in{" "}
            <code className="bg-gray-100 px-1 rounded">src/config/instagramReels.ts</code>
          </p>
        </div>

        {reels.length === 0 ? (
          <div className="flex justify-center">
            <div className="w-[280px] aspect-[9/16] rounded-2xl bg-gradient-to-br from-violet-100 via-pink-50 to-orange-100 border border-gray-200 flex flex-col items-center justify-center text-center p-6">
              <Instagram className="w-10 h-10 text-pink-400 mb-3" />
              <p className="text-sm font-semibold text-gray-600">Reels coming soon!</p>
              <p className="text-xs text-gray-400 mt-1">Add URLs in instagramReels.ts</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            {/* Reel viewer */}
            <div className="relative flex items-center justify-center w-full">
              {reels.length > 1 && (
                <button
                  onClick={prev}
                  className="absolute left-0 sm:left-4 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-pink-50 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
              )}

              {/* Fixed size container */}
              <div
                className="relative w-[320px] sm:w-[360px]"
                style={{ aspectRatio: "9/16", maxHeight: "640px" }}
              >
                {reels.map((url, i) => (
                  <div
                    key={url}
                    className="absolute inset-0 rounded-2xl overflow-hidden border border-gray-200 bg-black shadow-2xl"
                    style={{
                      opacity: transitioning ? 0 : i === current ? 1 : 0,
                      transform: i === current ? "scale(1)" : "scale(0.97)",
                      transition: "opacity 0.4s ease, transform 0.4s ease",
                      pointerEvents: i === current ? "auto" : "none",
                      zIndex: i === current ? 2 : 1,
                    }}
                  >
                    {loaded[i] && (
                      <iframe
                        src={toEmbedUrl(url)}
                        title={`Instagram reel ${i + 1}`}
                        loading="lazy"
                        allow="encrypted-media; autoplay"
                        allowFullScreen
                        className="w-full h-full"
                        style={{ border: "none" }}
                      />
                    )}
                  </div>
                ))}
              </div>

              {reels.length > 1 && (
                <button
                  onClick={next}
                  className="absolute right-0 sm:right-4 z-10 w-10 h-10 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-pink-50 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              )}
            </div>

            {/* Reel counter */}
            <p className="text-sm text-gray-400 font-medium">
              {current + 1} / {reels.length}
            </p>

            {/* Dot indicators */}
            {reels.length > 1 && (
              <div className="flex gap-2">
                {reels.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current ? "w-6 bg-pink-500" : "w-2 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Auto-advance progress bar */}
            {reels.length > 1 && (
              <div className="w-[320px] sm:w-[360px] h-0.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  key={current}
                  className="h-full bg-pink-400 rounded-full"
                  style={{
                    animation: "reelProgress 15s linear forwards",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Follow button */}
        <div className="text-center mt-10">
          <a
            href={INSTAGRAM_PROFILE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full text-white font-semibold shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #F58529, #DD2A7B, #8134AF, #515BD4)" }}
          >
            <Instagram className="w-5 h-5" /> Follow us on Instagram
          </a>
        </div>
      </div>

      {/* Progress bar animation */}
      <style>{`
        @keyframes reelProgress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </section>
  );
}
  
