// ─── newsService.ts ───────────────────────────────────────────────────────────
// Premium AI news fetch + rewrite + save
// Fixed:
// ✅ no frontend cache issue
// ✅ no childish wording
// ✅ better freshness
// ✅ better social-media style summaries
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "@/integrations/supabase/client";

export interface NewsPost {
  id: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  category: string;
  published_date: string;
  url?: string | null;
  slug?: string;
}

const RSS_FEEDS = [
  {
    url: "https://venturebeat.com/category/ai/feed/",
    category: "AI Tools",
  },
  {
    url: "https://techcrunch.com/category/artificial-intelligence/feed/",
    category: "Industry News",
  },
  {
    url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
    category: "Research",
  },
  {
    url: "https://feeds.feedburner.com/oreilly/radar",
    category: "Technology",
  },
];

const CORS_PROXY = "https://corsproxy.io/?";

// ─────────────────────────────────────────────────────────────────────────────
// Make headline better
// ─────────────────────────────────────────────────────────────────────────────
function enhanceTitle(title: string): string {
  const t = title.toLowerCase();

  let emoji = "🚀";

  if (t.includes("google")) emoji = "🔍";
  else if (t.includes("openai")) emoji = "✨";
  else if (t.includes("microsoft")) emoji = "💻";
  else if (t.includes("meta")) emoji = "📘";
  else if (t.includes("apple")) emoji = "🍎";
  else if (t.includes("launch")) emoji = "🚀";
  else if (t.includes("money")) emoji = "💰";
  else if (t.includes("warning")) emoji = "⚠️";

  return `${emoji} ${title}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Clean excerpt
// ─────────────────────────────────────────────────────────────────────────────
function cleanExcerpt(text: string): string {
  const clean = text.replace(/<[^>]+>/g, "").trim();

  if (clean.length <= 180) return clean;

  return clean.slice(0, 177) + "...";
}

// ─────────────────────────────────────────────────────────────────────────────
// Parse RSS
// ─────────────────────────────────────────────────────────────────────────────
async function parseRSS(
  feedUrl: string,
  category: string
): Promise<NewsPost[]> {
  try {
    const res = await fetch(
      `${CORS_PROXY}${encodeURIComponent(feedUrl)}&_t=${Date.now()}`,
      {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          Pragma: "no-cache",
        },
        signal: AbortSignal.timeout(10000),
      }
    );

    if (!res.ok) return [];

    const text = await res.text();

    const doc = new DOMParser().parseFromString(
      text,
      "application/xml"
    );

    const items = Array.from(doc.querySelectorAll("item")).slice(0, 8);

    return items.map((item) => {
      const rawExcerpt =
        item.querySelector("description")?.textContent ?? "";

      const imgNode =
        item.querySelector("enclosure[type^='image']") ??
        item.querySelector("media\\:thumbnail, thumbnail") ??
        item.querySelector("media\\:content");

      const link =
        item.querySelector("link")?.textContent?.trim() ?? "";

      return {
        id: crypto.randomUUID(),

        title: enhanceTitle(
          item.querySelector("title")?.textContent?.trim() ??
            "Latest Technology Update"
        ),

        excerpt: cleanExcerpt(rawExcerpt),

        image_url:
          imgNode?.getAttribute("url") ??
          imgNode?.getAttribute("src") ??
          null,

        category,

        published_date: new Date(
          item.querySelector("pubDate")?.textContent ??
            Date.now()
        ).toISOString(),

        url: link,
      };
    });
  } catch (error) {
    console.error("RSS Parse Error:", error);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Rewrite using Gemini
// ─────────────────────────────────────────────────────────────────────────────
async function rewriteWithGemini(
  posts: NewsPost[],
  apiKey: string
): Promise<NewsPost[]> {
  if (!apiKey || posts.length === 0) return posts;

  const input = posts.map((p) => ({
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
  }));

  const prompt = `
You are a top technology news editor.

Rewrite the following news for Instagram and LinkedIn audiences.

RULES:
- Simple English
- Modern tone
- Human sounding
- Engaging and clear
- No technical jargon
- No childish wording
- No buzzwords
- No "AI/ML revolution" style phrases

TITLE:
- max 12 words
- catchy
- premium social-media style

EXCERPT:
- max 40 words
- explain why it matters
- easy to understand

Return ONLY valid JSON.

Format:
[
  {
    "id":"...",
    "title":"...",
    "excerpt":"..."
  }
]

NEWS:
${JSON.stringify(input)}
`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },

        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],

          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          },
        }),

        signal: AbortSignal.timeout(20000),
      }
    );

    const data = await res.json();

    const raw =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    const clean = raw.replace(/```json|```/g, "").trim();

    const rewritten = JSON.parse(clean);

    return posts.map((p) => {
      const found = rewritten.find(
        (x: any) => x.id === p.id
      );

      if (!found) return p;

      return {
        ...p,
        title: found.title,
        excerpt: found.excerpt,
      };
    });
  } catch (error) {
    console.error("Gemini Rewrite Error:", error);
    return posts;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Save to Supabase
// ─────────────────────────────────────────────────────────────────────────────
async function saveToSupabase(posts: NewsPost[]) {
  if (posts.length === 0) return;

  const rows = posts.map((p) => ({
    title: p.title,
    excerpt: p.excerpt,
    image_url: p.image_url,
    category: p.category,
    published_date: p.published_date,
    url: p.url ?? null,
    content: p.excerpt,
  }));

  const { error } = await supabase
    .from("ai_blogs")
    .upsert(rows, {
      onConflict: "url",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error("Supabase Save Error:", error);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────
export async function fetchAndUpdateNews(): Promise<NewsPost[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  try {
    const batches = await Promise.all(
      RSS_FEEDS.map((feed) =>
        parseRSS(feed.url, feed.category)
      )
    );

    let posts = batches.flat();

    // Remove duplicates
    const seen = new Set<string>();

    posts = posts.filter((post) => {
      if (!post.url || seen.has(post.url)) {
        return false;
      }

      seen.add(post.url);
      return true;
    });

    // Sort newest first
    posts.sort(
      (a, b) =>
        new Date(b.published_date).getTime() -
        new Date(a.published_date).getTime()
    );

    // Rewrite
    posts = await rewriteWithGemini(posts, apiKey);

    // Save
    await saveToSupabase(posts);

    return posts;
  } catch (error) {
    console.error("News Update Error:", error);
    return [];
  }
}
