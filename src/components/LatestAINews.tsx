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

// Curated, high-quality Unsplash images per category (stable, no redirects)
const CATEGORY_IMAGES: Record<string, string> = {
  "AI Research": "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&q=80",
  "Industry News": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  "AI Tools": "https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&q=80",
  "Healthcare AI": "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
  "Policy": "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=800&q=80",
  "Tutorials": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80",
  "Breaking": "https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&q=80",
  "Tech": "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
  "Machine Learning": "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
  "Robotics": "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800&q=80",
  "Startups": "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&q=80",
};

const DEFAULT_NEWS_IMG = "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80";

function imageFor(post: NewsPost): string {
  if (post.image_url && /^https?:\/\//i.test(post.image_url)) return post.image_url;
  if (post.category && CATEGORY_IMAGES[post.category]) return CATEGORY_IMAGES[post.category];
  return DEFAULT_NEWS_IMG;
}

function badgeColor(category: string): string {
  const c = category.toLowerCase();
  if (c.includes("break")) return "bg-red-600";
  if (c.includes("ai") || c.includes("machine")) return "bg-blue-600";
  if (c.includes("tech") || c.includes("tool")) return "bg-emerald-600";
  if (c.includes("health")) return "bg-pink-600";
  if (c.includes("policy") || c.includes("law")) return "bg-slate-700";
  if (c.includes("tutorial")) return "bg-amber-500";
  if (c.includes("startup") || c.includes("industry")) return "bg-indigo-600";
  return "bg-violet-600";
}

function relativeTime(publishedDate: string) {
  const date = new Date(publishedDate);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  return `${diffD}d ago`;
}

function linkFor(post: NewsPost): { href: string; external: boolean } {
  if (post.url) return { href: post.url, external: true };
  if (post.slug) return { href: `/ai-news/${post.slug}`, external: false };
  return { href: "/ai-news", external: false };
}

function faviconFor(url?: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return null;
  }
}

function CardSkeleton() {
  return (
    <div className="min-w-[85%] sm:min-w-[280px] md:w-[calc(20%-13px)] bg-white border border-gray-200 rounded-xl overflow-hidden flex-shrink-0 animate-pulse">
      <div className="w-full aspect-video bg-gray-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-full bg-gray-200 rounded" />
        <div className="h-4 w-2/3 bg-gray-200 rounded" />
        <div className="h-3 w-full bg-gray-100 rounded" />
      </div>
    </div>
  );
}

interface NewsCardProps {
  post: NewsPost;
  variant?: "featured" | "compact";
}

function NewsCard({ post, variant = "featured" }: NewsCardProps) {
  const { href, external } = linkFor(post);
  const img = imageFor(post);
  const favicon = faviconFor(post.url);
  const source = post.url ? (() => { try { return new URL(post.url).hostname.replace(/^www\./, ""); } catch { return null; } })() : null;

  return (
    <article
      className={`group news-card bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ease-out flex flex-col ${
        variant === "featured"
          ? "min-w-[85%] sm:min-w-[280px] md:w-[calc(20%-13px)] md:min-w-0 snap-start flex-shrink-0"
          : ""
      }`}
    >
      {/* Image with overlays */}
      <div className="relative w-full aspect-video overflow-hidden bg-gray-100">
        <img
          src={img}
          alt={post.title}
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = DEFAULT_NEWS_IMG;
          }}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

        {/* Category badge top-left */}
        {post.category && (
          <span
            className={`absolute top-3 left-3 ${badgeColor(post.category)} text-white text-[10px] md:text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-md shadow-md`}
          >
            {post.category}
          </span>
        )}

        {/* Timestamp + favicon bottom-right */}
        <div className="absolute bottom-2 right-3 flex items-center gap-1.5 text-white text-[11px] font-medium drop-shadow">
          {favicon && (
            <img src={favicon} alt="" className="w-3.5 h-3.5 rounded-sm" />
          )}
          <span>{relativeTime(post.published_date)}</span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-bold text-sm md:text-base leading-snug text-gray-900 line-clamp-2 group-hover:text-indigo-700 transition-colors">
          {post.title}
        </h3>
        <p className="mt-2 text-xs md:text-sm text-gray-600 line-clamp-2">{post.excerpt}</p>
        <div className="mt-auto pt-3 flex items-center justify-between">
          {source ? (
            <span className="text-[11px] text-gray-400 truncate max-w-[60%]">{source}</span>
          ) : <span />}
          <a
            href={href}
            target={external ? "_blank" : "_self"}
            rel="noopener noreferrer"
            className="text-xs md:text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Read more →
          </a>
        </div>
      </div>
    </article>
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
            : latest.map((post) => <NewsCard key={post.id} post={post} variant="featured" />)}
        </div>

        {/* Older grid */}
        {older.length > 0 && (
          <div className="mt-10">
            <h3 className="text-lg font-bold text-gray-900 mb-4">More AI News</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {older.map((post) => (
                <NewsCard key={post.id} post={post} variant="compact" />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
