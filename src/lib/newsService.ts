import { supabase } from "@/integrations/supabase/client";

export interface NewsPost {
  id: string;
  title: string;
  excerpt: string;
  image_url: string | null;
  category: string;
  published_date: string;
  url?: string | null;
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
];

const CORS_PROXY = "https://corsproxy.io/?";

function cleanExcerpt(text: string): string {
  const clean = text.replace(/<[^>]+>/g, "").trim();

  if (clean.length <= 180) return clean;

  return clean.slice(0, 177) + "...";
}

async function parseRSS(
  feedUrl: string,
  category: string
): Promise<NewsPost[]> {
  try {
    const res = await fetch(
      `${CORS_PROXY}${encodeURIComponent(feedUrl)}`
    );

    if (!res.ok) return [];

    const text = await res.text();

    const doc = new DOMParser().parseFromString(
      text,
      "application/xml"
    );

    const items = Array.from(
      doc.querySelectorAll("item")
    ).slice(0, 8);

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

        title:
          item.querySelector("title")?.textContent?.trim() ??
          "Latest AI News",

        excerpt: cleanExcerpt(rawExcerpt),

        image_url:
          imgNode?.getAttribute("url") ??
          imgNode?.getAttribute("src") ??
          "https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop",

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

export async function fetchAndUpdateNews(): Promise<NewsPost[]> {
  try {
    const batches = await Promise.all(
      RSS_FEEDS.map((feed) =>
        parseRSS(feed.url, feed.category)
      )
    );

    let posts = batches.flat();

    const seen = new Set<string>();

    posts = posts.filter((post) => {
      if (!post.url || seen.has(post.url)) {
        return false;
      }

      seen.add(post.url);
      return true;
    });

    posts.sort(
      (a, b) =>
        new Date(b.published_date).getTime() -
        new Date(a.published_date).getTime()
    );

    await saveToSupabase(posts);

    return posts;
  } catch (error) {
    console.error("News Update Error:", error);
    return [];
  }
}
