import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface NewsPost {
  id: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  category: string;
  published_date: string;
  url?: string | null;
  slug?: string;
}

const FALLBACK: NewsPost[] = [
  {
    id: "fb-1",
    title: "OpenAI Releases GPT-5 With Major Reasoning Upgrades",
    excerpt: "The new model improves multi-step reasoning, longer context handling, and more reliable tool use for complex workflows.",
    image_url: null,
    category: "AI Research",
    published_date: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    url: "https://openai.com/blog",
  },
  {
    id: "fb-2",
    title: "Google's Gemini 3.1 Pro Sets New Multimodal Benchmarks",
    excerpt: "Gemini 3.1 Pro leads recent evaluation charts on scientific reasoning and multimodal understanding tasks.",
    image_url: null,
    category: "Industry News",
    published_date: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    url: "https://deepmind.google/discover/blog",
  },
  {
    id: "fb-3",
    title: "Microsoft Expands Copilot Across Office and Windows",
    excerpt: "Copilot is now deeply integrated into Word, Excel, PowerPoint, Outlook, and the Windows shell for enterprise users.",
    image_url: null,
    category: "AI Tools",
    published_date: new Date(Date.now() - 26 * 3600 * 1000).toISOString(),
    url: "https://blogs.microsoft.com",
  },
  {
    id: "fb-4",
    title: "AI Model Detects Cancer With 96% Accuracy in Trials",
    excerpt: "New clinical results show an AI system outperforming expert radiologists in early cancer detection.",
    image_url: null,
    category: "Healthcare AI",
    published_date: new Date(Date.now() - 2 * 86400 * 1000).toISOString(),
    url: "https://www.nature.com",
  },
  {
    id: "fb-5",
    title: "EU Rolls Out Landmark AI Regulation Framework",
    excerpt: "The new rules introduce strict transparency and risk categorization requirements for high-impact AI systems.",
    image_url: null,
    category: "Policy",
    published_date: new Date(Date.now() - 3 * 86400 * 1000).toISOString(),
    url: "https://europa.eu",
  },
];

const DEFAULT_AI_IMG = "https://images.unsplash.com/photo-1677442136019-21780ecad995";

const NEUTRAL_PLACEHOLDER = `data:image/svg+xml;base64,${btoa(
  `<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 400 300"><rect width="400" height="300" fill="#f3f4f6"/><g transform="translate(175,115)"><rect x="0" y="0" width="50" height="40" rx="3" fill="none" stroke="#d1d5db" stroke-width="3"/><line x1="8" y1="10" x2="42" y2="10" stroke="#d1d5db" stroke-width="2.5"/><line x1="8" y1="20" x2="42" y2="20" stroke="#d1d5db" stroke-width="2.5"/><line x1="8" y1="30" x2="30" y2="30" stroke="#d1d5db" stroke-width="2.5"/><rect x="32" y="28" width="14" height="16" rx="1.5" fill="#d1d5db"/></g></svg>`
)}`;

const GENERIC_CATEGORIES = new Set([
  "AI Research",
  "Industry News",
  "AI Tools",
  "Tutorials",
  "Policy",
  "Healthcare AI",
]);

function isRealCategory(category: string | null | undefined): boolean {
  return !!category && !GENERIC_CATEGORIES.has(category);
}

function badgeClassForCategory(category: string) {
  const map: Record<string, string> = {
    "AI Research": "bg-[#3b82f6]",
    "Industry News": "bg-[#10b981]",
    "AI Tools": "bg-[#8b5cf6]",
    "Healthcare AI": "bg-[#ec4899]",
    "Policy": "bg-[#6b7280]",
    "Tutorials": "bg-[#f59e0b]",
  };
  const color = map[category] ?? "bg-gray-400";
  return `inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium text-white ${color}`;
}

function relativeTime(publishedDate: string) {
  const date = new Date(publishedDate);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH} hours ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  return `${diffD} days ago`;
}

function linkFor(post: NewsPost): { href: string; external: boolean } {
  if (post.url) return { href: post.url, external: true };
  if (post.slug) return { href: `/ai-news/${post.slug}`, external: false };
  return { href: "/ai-news", external: false };
}

function validImageUrl(url: string | null | undefined): string {
  if (!url) return NEUTRAL_PLACEHOLDER;
  if (url.includes(DEFAULT_AI_IMG)) return NEUTRAL_PLACEHOLDER;
  return url;
}

function CardSkeleton() {
  return (
    <div className="news-card min-w-[85%] sm:min-w-[260px] md:w-[calc(20%-13px)] bg-white border border-gray-200 rounded-xl overflow-hidden flex-shrink-0 animate-pulse">
      <div className="w-full h-48 bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-24 bg-gray-200 rounded" />
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export default function LatestAINews() {
  const [latest, setLatest] = useState<NewsPost[] | null>(null);
  const [older, setOlder] = useState<NewsPost[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase
        .from("ai_blogs")
        .select("*")
        .order("published_date", { ascending: false })
        .limit(20);
      if (!alive) return;
      const rows = (data ?? []) as NewsPost[];
      if (rows.length >= 1) {
        setLatest(rows.slice(0, 5));
        setOlder(rows.slice(5, 20));
      } else {
        setLatest(FALLBACK);
        setOlder([]);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = NEUTRAL_PLACEHOLDER;
  };

  return (
    <section id="latest-ai-news" className="py-16 sm:py-24 bg-gradient-to-br from-slate-50 via-white to-violet-50/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-4 gap-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-gray-900">🔥 Latest AI News</h2>
            <p className="text-xs md:text-sm text-gray-500">Updated daily • Powered by AI</p>
          </div>
          <Link
            to="/ai-news"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View all →
          </Link>
        </div>
        <hr className="border-gray-200 mb-6" />

        {/* Latest 5 row */}
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-thin">
          {latest === null
            ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            : latest.map((post) => {
                const { href, external } = linkFor(post);
                return (
                  <article
                    key={post.id}
                    className="news-card min-w-[85%] sm:min-w-[280px] md:w-[calc(20%-13px)] md:min-w-0 bg-white/90 backdrop-blur border border-gray-200 rounded-xl shadow-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 ease-out snap-start flex-shrink-0 overflow-hidden flex flex-col"
                  >
                    <img
                      src={validImageUrl(post.image_url)}
                      alt={post.title}
                      loading="lazy"
                      onError={handleImgError}
                      className="w-full h-48 object-cover rounded-t-xl"
                    />
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        {isRealCategory(post.category) && (
                          <span className={badgeClassForCategory(post.category)}>{post.category}</span>
                        )}
                        <span className="ml-auto">{relativeTime(post.published_date)}</span>
                      </div>
                      <h3 className="font-semibold text-sm md:text-base text-gray-900 line-clamp-2">{post.title}</h3>
                      <p className="mt-2 text-xs md:text-sm text-gray-500 line-clamp-2">{post.excerpt}</p>
                      <div className="mt-auto pt-3 flex justify-end">
                        <a
                          href={href}
                          target={external ? "_blank" : "_self"}
                          rel="noopener noreferrer"
                          className="text-xs md:text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          Read more →
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
        </div>

        {/* Older grid */}
        {older.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-gray-900 mb-4">More AI News</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {older.map((post) => {
                const { href, external } = linkFor(post);
                return (
                  <article
                    key={post.id}
                    className="bg-white/80 border border-gray-200 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                      {isRealCategory(post.category) && (
                        <span className={badgeClassForCategory(post.category)}>{post.category}</span>
                      )}
                      <span className="ml-auto">{relativeTime(post.published_date)}</span>
                    </div>
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">{post.title}</h4>
                    <p className="mt-2 text-xs text-gray-500 line-clamp-2">{post.excerpt}</p>
                    <div className="mt-3 flex justify-end">
                      <a
                        href={href}
                        target={external ? "_blank" : "_self"}
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Read more →
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
