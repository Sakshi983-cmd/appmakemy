import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Clock, Tag, Twitter, Linkedin, MessageSquare, Link as LinkIcon, ArrowRight, Sparkles, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { AIBlog } from "./AINews";

const FALLBACK_IMG = (seed: string) =>
  `https://source.unsplash.com/1600x900/?artificial-intelligence,technology&sig=${encodeURIComponent(seed)}`;

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

const readMins = (s: string) => Math.max(1, Math.round(s.split(/\s+/).length / 220));

// Minimal markdown renderer (h2, blockquote, lists, paragraphs, code)
function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => {
    const lines = text.split(/\r?\n/);
    const out: { type: string; content: string[] }[] = [];
    let buf: string[] = [];
    let mode: string = "p";
    const flush = () => { if (buf.length) { out.push({ type: mode, content: buf }); buf = []; } };
    for (const raw of lines) {
      const l = raw;
      if (/^```/.test(l)) {
        flush();
        if (mode === "code") { mode = "p"; }
        else { mode = "code"; }
        continue;
      }
      if (mode === "code") { buf.push(l); continue; }
      if (/^##\s+/.test(l)) { flush(); out.push({ type: "h2", content: [l.replace(/^##\s+/, "")] }); mode = "p"; continue; }
      if (/^###\s+/.test(l)) { flush(); out.push({ type: "h3", content: [l.replace(/^###\s+/, "")] }); mode = "p"; continue; }
      if (/^>\s+/.test(l)) {
        if (mode !== "quote") { flush(); mode = "quote"; }
        buf.push(l.replace(/^>\s+/, ""));
        continue;
      }
      if (/^[-*]\s+/.test(l)) {
        if (mode !== "ul") { flush(); mode = "ul"; }
        buf.push(l.replace(/^[-*]\s+/, ""));
        continue;
      }
      if (/^\d+\.\s+/.test(l)) {
        if (mode !== "ol") { flush(); mode = "ol"; }
        buf.push(l.replace(/^\d+\.\s+/, ""));
        continue;
      }
      if (l.trim() === "") { flush(); mode = "p"; continue; }
      if (mode !== "p") { flush(); mode = "p"; }
      buf.push(l);
    }
    flush();
    return out;
  }, [text]);

  const renderInline = (s: string) => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
    return parts.map((p, i) => {
      if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i} className="text-white">{p.slice(2, -2)}</strong>;
      if (/^\*[^*]+\*$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>;
      if (/^`[^`]+`$/.test(p)) return <code key={i} className="px-1.5 py-0.5 rounded bg-white/10 text-orange-300 text-[0.9em] font-mono">{p.slice(1, -1)}</code>;
      return <span key={i}>{p}</span>;
    });
  };

  return (
    <div className="space-y-6 text-slate-300 text-lg leading-relaxed">
      {blocks.map((b, i) => {
        if (b.type === "h2") return <h2 key={i} className="text-3xl font-bold text-white mt-10 mb-2 tracking-tight">{b.content[0]}</h2>;
        if (b.type === "h3") return <h3 key={i} className="text-2xl font-semibold text-white mt-8 mb-2">{b.content[0]}</h3>;
        if (b.type === "quote") return (
          <blockquote key={i} className="border-l-4 border-orange-400 pl-6 py-2 italic text-slate-200 bg-white/5 rounded-r-xl">
            {b.content.map((c, j) => <p key={j}>{renderInline(c)}</p>)}
          </blockquote>
        );
        if (b.type === "ul") return (
          <ul key={i} className="list-disc list-outside pl-6 space-y-2 marker:text-orange-400">
            {b.content.map((c, j) => <li key={j}>{renderInline(c)}</li>)}
          </ul>
        );
        if (b.type === "ol") return (
          <ol key={i} className="list-decimal list-outside pl-6 space-y-2 marker:text-orange-400">
            {b.content.map((c, j) => <li key={j}>{renderInline(c)}</li>)}
          </ol>
        );
        if (b.type === "code") return (
          <pre key={i} className="rounded-xl bg-slate-900/80 border border-white/10 p-4 overflow-x-auto text-sm text-slate-200 font-mono">
            <code>{b.content.join("\n")}</code>
          </pre>
        );
        return <p key={i}>{b.content.map((c, j) => <span key={j}>{renderInline(c)}{j < b.content.length - 1 ? " " : ""}</span>)}</p>;
      })}
    </div>
  );
}

export default function AINewsDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<AIBlog | null | undefined>(undefined);
  const [related, setRelated] = useState<AIBlog[]>([]);

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!slug) return;
      const { data } = await supabase.from("ai_blogs").select("*").eq("slug", slug).maybeSingle();
      if (cancel) return;
      setBlog((data as AIBlog) ?? null);
      if (data) {
        const { data: rel } = await supabase.from("ai_blogs").select("*")
          .eq("category", (data as AIBlog).category).neq("slug", slug)
          .order("published_date", { ascending: false }).limit(3);
        if (!cancel) setRelated((rel ?? []) as AIBlog[]);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
    })();
    return () => { cancel = true; };
  }, [slug]);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const share = {
    twitter: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(blog?.title ?? "")}&url=${encodeURIComponent(url)}`, "_blank"),
    linkedin: () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank"),
    whatsapp: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent((blog?.title ?? "") + " " + url)}`, "_blank"),
    copy: async () => { await navigator.clipboard.writeText(url); toast({ title: "Link copied!", description: "Share it anywhere." }); },
  };

  if (blog === undefined) {
    return (
      <div className="min-h-screen bg-slate-950 text-white">
        <div className="animate-pulse max-w-4xl mx-auto px-6 py-24">
          <div className="h-8 w-32 bg-white/10 rounded mb-8" />
          <div className="h-12 w-3/4 bg-white/10 rounded mb-4" />
          <div className="h-96 bg-white/10 rounded-2xl mb-8" />
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-4 bg-white/10 rounded" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-slate-950 text-white grid place-items-center px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">Article not found</h1>
          <Link to="/ai-news" className="text-orange-400 hover:underline">← Back to All News</Link>
        </div>
      </div>
    );
  }

  const img = blog.image_url || FALLBACK_IMG(blog.id);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Top nav */}
      <header className="sticky top-0 z-50 bg-slate-950/85 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <button onClick={() => navigate("/ai-news")} className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white">
            <ChevronLeft className="w-5 h-5" /> Back to All News
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight">AI News</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative h-[60vh] min-h-[420px] max-h-[640px] overflow-hidden">
        <img src={img} alt={blog.title} className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-slate-950/70 to-slate-950" />
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          className="relative h-full max-w-4xl mx-auto px-6 flex flex-col justify-end pb-16">
          <div className="flex items-center gap-4 text-xs sm:text-sm text-slate-300 mb-4">
            <span className="inline-flex items-center gap-1.5"><Calendar className="w-4 h-4" />{fmtDate(blog.published_date)}</span>
            <span className="inline-flex items-center gap-1.5"><Tag className="w-4 h-4 text-orange-400" />{blog.category}</span>
            <span className="inline-flex items-center gap-1.5"><Clock className="w-4 h-4" />{readMins(blog.content)} min read</span>
          </div>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            {blog.title}
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-3xl">{blog.excerpt}</p>
        </motion.div>
      </section>

      {/* Content + share */}
      <section className="relative max-w-4xl mx-auto px-6 py-16">
        {/* Floating share */}
        <div className="hidden lg:flex flex-col gap-2 fixed left-6 top-1/2 -translate-y-1/2 z-30">
          {[
            { icon: Twitter, fn: share.twitter, label: "Twitter" },
            { icon: Linkedin, fn: share.linkedin, label: "LinkedIn" },
            { icon: MessageSquare, fn: share.whatsapp, label: "WhatsApp" },
            { icon: LinkIcon, fn: share.copy, label: "Copy link" },
          ].map((s) => (
            <button key={s.label} onClick={s.fn} title={s.label}
              className="w-11 h-11 rounded-full bg-white/5 border border-white/10 backdrop-blur hover:bg-orange-500 hover:border-orange-500 hover:scale-110 transition-all grid place-items-center text-slate-300 hover:text-white">
              <s.icon className="w-4 h-4" />
            </button>
          ))}
        </div>

        <article className="prose prose-invert max-w-none">
          <Markdown text={blog.content} />
        </article>

        {/* Mobile share */}
        <div className="mt-10 flex lg:hidden gap-2 justify-center">
          {[
            { icon: Twitter, fn: share.twitter },
            { icon: Linkedin, fn: share.linkedin },
            { icon: MessageSquare, fn: share.whatsapp },
            { icon: LinkIcon, fn: share.copy },
          ].map((s, i) => (
            <button key={i} onClick={s.fn}
              className="w-11 h-11 rounded-full bg-white/5 border border-white/10 hover:bg-orange-500 hover:border-orange-500 grid place-items-center text-slate-300 hover:text-white transition-all">
              <s.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 pb-20">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6">Related Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {related.map((r) => (
              <Link key={r.id} to={`/ai-news/${r.slug}`}
                className="group rounded-2xl overflow-hidden bg-white/5 border border-white/10 hover:border-orange-400/40 backdrop-blur transition-all hover:-translate-y-1">
                <div className="aspect-video overflow-hidden">
                  <img src={r.image_url || FALLBACK_IMG(r.id)} alt={r.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK_IMG(r.id); }} />
                </div>
                <div className="p-5">
                  <span className="text-[11px] font-semibold text-orange-400 uppercase tracking-wide">{r.category}</span>
                  <h3 className="mt-1.5 font-bold text-white line-clamp-2 group-hover:text-orange-300 transition-colors">{r.title}</h3>
                  <p className="mt-2 text-sm text-slate-400 line-clamp-2">{r.excerpt}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="max-w-4xl mx-auto px-6 pb-20">
        <Link to="/ai-news" className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-white/5 border border-white/10 hover:border-orange-400/40 text-sm font-semibold transition-all">
          <ArrowLeft className="w-4 h-4" /> Back to All News
        </Link>
      </div>
    </div>
  );
}
