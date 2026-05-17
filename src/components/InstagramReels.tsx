import { useEffect, useRef } from "react";
import { Instagram } from "lucide-react";
import {
  INSTAGRAM_PROFILE_URL,
  INSTAGRAM_HANDLE,
  WIDGET_EMBED_HTML,
  REEL_URLS,
} from "@/config/instagramReels";

function toEmbedUrl(url: string): string {
  // Convert any /reel/ID or /p/ID URL to its embed form
  const cleaned = url.split("?")[0].replace(/\/$/, "");
  return `${cleaned}/embed`;
}

function PlaceholderTile({ index }: { index: number }) {
  return (
    <div className="aspect-square rounded-xl bg-gradient-to-br from-violet-100 via-pink-50 to-orange-100 border border-gray-200 flex flex-col items-center justify-center text-center p-4">
      <Instagram className="w-7 h-7 text-pink-500 mb-2" />
      <p className="text-xs font-semibold text-gray-600">Reel slot {index + 1}</p>
      <p className="text-[10px] text-gray-400 mt-1">Add a URL in <code>src/config/instagramReels.ts</code></p>
    </div>
  );
}

function WidgetEmbed({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = html;
    // Re-execute any <script> tags inside the pasted embed
    el.querySelectorAll("script").forEach((oldScript) => {
      const s = document.createElement("script");
      for (const attr of Array.from(oldScript.attributes)) s.setAttribute(attr.name, attr.value);
      s.text = oldScript.text;
      oldScript.replaceWith(s);
    });
  }, [html]);

  return <div ref={ref} className="w-full" />;
}

export default function InstagramReels() {
  const hasWidget = WIDGET_EMBED_HTML.trim().length > 0;
  const reels = REEL_URLS.slice(0, 9);
  const tiles = Array.from({ length: 9 }, (_, i) => reels[i]);

  return (
    <section id="reels" className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
        </div>

        {hasWidget ? (
          <WidgetEmbed html={WIDGET_EMBED_HTML} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {tiles.map((url, i) =>
              url ? (
                <div
                  key={i}
                  className="aspect-square rounded-xl overflow-hidden border border-gray-200 bg-black hover:shadow-xl transition-shadow"
                >
                  <iframe
                    src={toEmbedUrl(url)}
                    title={`Instagram reel ${i + 1}`}
                    loading="lazy"
                    allow="encrypted-media"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <PlaceholderTile key={i} index={i} />
              ),
            )}
          </div>
        )}

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
    </section>
  );
}
