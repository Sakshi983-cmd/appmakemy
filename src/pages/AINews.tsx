import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, ArrowRight, Sparkles, Calendar, Filter, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export interface AIBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string | null;
  category: string;
  published_date: string;
}

const CATEGORIES = ["All", "AI Research", "Industry News", "AI Tools", "Tutorials"] as const;
type Cat = typeof CATEGORIES[number];

const FALLBACK_IMG = (seed: string) =>
  `https://source.unsplash.com/1200x675/?artificial-intelligence,technology&sig=${encodeURIComponent(seed)}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const isToday = (d: string) => {
  const a = new Date(d), b = new Date();
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const re = new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "ig");
  return text.split(re).map((p, i) =>
    re.test(p) ? <mark key={i} className="bg-orange-200/80 text-orange-950 rounded px-0.5">{p}</mark> : <span key={i}>{p}</span>
  );
}

function NavBar() {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
        <Link to="/" className="flex items-center gap-2 text-white">
          <ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium opacity-80 hover:opacity-100">Back to Home</span>
        </Link>
        <Link to="/ai-news" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-white tracking-tight">AI News</span>
        </Link>
      </div>
    </header>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-white/5 border border-white/10 animate-pulse">
      <div className="aspect-video bg-white/10" />
      <div className="p-5 space-y-3">
        <div className="h-3 w-20 bg-white/10 rounded" />
        <div className="h-5 w-3/4 bg-white/10 rounded" />
        <div className="h-3 w-full bg-white/10 rounded" />
        <div className="h-3 w-2/3 bg-white/10 rounded" />
      </div>
    </div>
  );
}

function BlogCard({ b, q }: { b: AIBlog; q: string }) {
  const img = b.image_url || FALLBACK_IMG(b.id);
  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 200 }}
      className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-orange-400/40 backdrop-blur-xl shadow-xl hover:shadow-orange-500/10"
    >
      <Link to={`/ai-news/${b.slug}`} className="block">
        <div className="relative aspect-video overflow-hidden">
          <img
            src={img}
            alt={b.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG(b.id); }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent" />
          <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-[11px] font-semibold bg-white/90 text-slate-900 backdrop-blur">
            {b.category}
          </span>
          {isToday(b.published_date) && (
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-bold bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg">
              NEW
            </span>
          )}
        </div>
        <div className="p-5">
          <h3 className="text-lg font-bold text-white leading-snug line-clamp-2 group-hover:text-orange-300 transition-colors">
            {highlight(b.title, q)}
          </h3>
          <p className="mt-2 text-sm text-slate-400 line-clamp-3">{highlight(b.excerpt, q)}</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> {fmtDate(b.published_date)}
            </span>
            <span className="text-sm font-semibold text-orange-400 inline-flex items-center gap-1 group-hover:gap-2 transition-all">
              Read More <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

export default function AINews() {
  const [blogs, setBlogs] = useState<AIBlog[] | null>(null);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<Cat>("All");
  const [sort, setSort] = useState<"latest" | "relevant">("latest");
  const [visible, setVisible] = useState(15);
  const [featuredIdx, setFeaturedIdx] = useState(0);

  const fetchBlogs = async () => {
    const { data } = await supabase
      .from("ai_blogs")
      .select("*")
      .order("published_date", { ascending: false })
      .limit(100);
    setBlogs((data ?? []) as AIBlog[]);
  };

  useEffect(() => {
    fetchBlogs();
    const t = setInterval(fetchBlogs, 30 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const featured = useMemo(() => (blogs ?? []).slice(0, 5), [blogs]);

  // auto-rotate featured
  useEffect(() => {
    if (featured.length < 2) return;
    const t = setInterval(() => setFeaturedIdx((i) => (i + 1) % featured.length), 5000);
    return () => clearInterval(t);
  }, [featured.length]);

  const all = useMemo(() => {
    if (!blogs) return [];
    let list = [...blogs];
    if (cat !== "All") list = list.filter((b) => b.category === cat);
    if (q.trim()) {
      const t = q.toLowerCase();
      list = list.filter((b) =>
        b.title.toLowerCase().includes(t) ||
        b.excerpt.toLowerCase().includes(t) ||
        b.content.toLowerCase().includes(t)
      );
    }
    if (sort === "latest") {
      list.sort((a, b) => +new Date(b.published_date) - +new Date(a.published_date));
    } else {
      const t = q.toLowerCase();
      list.sort((a, b) => (b.title.toLowerCase().includes(t) ? 1 : 0) - (a.title.toLowerCase().includes(t) ? 1 : 0));
    }
    return list;
  }, [blogs, cat, q, sort]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <NavBar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(124,58,237,.35), transparent 70%)" }} />
          <div className="absolute -bottom-40 -right-32 w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(249,115,22,.3), transparent 70%)" }} />
          <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/15 text-xs font-semibold text-orange-300 mb-6">
            <Sparkles className="w-3.5 h-3.5" /> AI-CURATED · UPDATED DAILY
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight">
            Latest <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400 bg-clip-text text-transparent">AI Industry</span> News
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            className="mt-5 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto">
            Fresh insights powered by AI · Updated daily at 9 AM IST
          </motion.p>
        </div>
      </section>

      {/* Today's Top Stories */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-12">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Today's Top Stories</h2>
            <p className="text-sm text-slate-400 mt-1">The 5 most important reads, auto-rotating</p>
          </div>
          {featured.length > 0 && (
            <div className="hidden sm:flex gap-1.5">
              {featured.map((_, i) => (
                <button key={i} onClick={() => setFeaturedIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${i === featuredIdx ? "w-8 bg-orange-400" : "w-2 bg-white/20"}`} />
              ))}
            </div>
          )}
        </div>

        {blogs === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : featured.length === 0 ? null : (
          <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-thin">
            {featured.map((b, i) => (
              <div key={b.id} className={`snap-start shrink-0 w-[88%] sm:w-[55%] lg:w-[40%] transition-all ${i === featuredIdx ? "scale-100" : "scale-95 opacity-80"}`}>
                <BlogCard b={b} q={q} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sticky search & filters */}
      <div className="sticky top-16 sm:top-20 z-40 bg-slate-950/85 backdrop-blur-xl border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles…"
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400/40"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-thin">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  cat === c
                    ? "bg-gradient-to-r from-violet-500 to-orange-500 text-white border-transparent shadow-lg shadow-orange-500/20"
                    : "bg-white/5 text-slate-300 border-white/10 hover:border-orange-400/40"
                }`}>
                {c}
              </button>
            ))}
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select value={sort} onChange={(e) => setSort(e.target.value as any)}
              className="pl-9 pr-8 py-2.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white focus:outline-none focus:ring-2 focus:ring-orange-400/40 appearance-none cursor-pointer">
              <option value="latest" className="bg-slate-900">Latest</option>
              <option value="relevant" className="bg-slate-900">Most Relevant</option>
            </select>
          </div>
        </div>
      </div>

      {/* All Articles */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold">All Articles</h2>
          <span className="text-sm text-slate-400">{all.length} {all.length === 1 ? "article" : "articles"}</span>
        </div>

        {blogs === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : all.length === 0 ? (
          <div className="text-center py-24 rounded-3xl bg-white/5 border border-white/10 backdrop-blur">
            <Sparkles className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Check back at 9 AM daily for fresh AI news!</h3>
            <p className="text-slate-400 text-sm">Our AI is brewing tomorrow's top stories right now.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {all.slice(0, visible).map((b) => <BlogCard key={b.id} b={b} q={q} />)}
            </div>
            {visible < all.length && (
              <div className="flex justify-center mt-10">
                <Button onClick={() => setVisible((v) => v + 9)}
                  className="rounded-full bg-gradient-to-r from-violet-600 to-orange-500 hover:opacity-90 text-white px-8 py-6 text-sm font-semibold shadow-xl shadow-orange-500/20">
                  Load More Articles
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
