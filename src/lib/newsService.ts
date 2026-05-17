// ─── newsService.ts ───────────────────────────────────────────────────────────
// Fetches AI news from RSS → simplifies with Gemini → stores in Supabase
// Auto-runs once daily at 9 AM IST, triggered from the frontend.
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

// ── RSS feeds: top AI tools + top companies ──────────────────────────────────
const RSS_FEEDS = [
  { url: "https://venturebeat.com/category/ai/feed/",                        category: "AI Tools" },
  { url: "https://techcrunch.com/category/artificial-intelligence/feed/",    category: "Industry News" },
  { url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", category: "AI Research" },
  { url: "https://feeds.feedburner.com/oreilly/radar",                       category: "AI Research" },
];

// ── Make title catchy with emoji ────────────────────────────────────────────
function makeImpressive(title: string): string {
  const t = title.toLowerCase();
  let emoji = "🤖";
  if (t.includes("health") || t.includes("cancer") || t.includes("medical") || t.includes("doctor")) emoji = "🏥";
  else if (t.includes("billion") || t.includes("million") || t.includes("fund") || t.includes("money")) emoji = "💰";
  else if (t.includes("google")) emoji = "🔍";
  else if (t.includes("microsoft") || t.includes("windows") || t.includes("copilot")) emoji = "💻";
  else if (t.includes("apple")) emoji = "🍎";
  else if (t.includes("meta") || t.includes("facebook")) emoji = "📘";
  else if (t.includes("law") || t.includes("rule") || t.includes("ban") || t.includes("regulat")) emoji = "📜";
  else if (t.includes("job") || t.includes("work") || t.includes("hire")) emoji = "💼";
  else if (t.includes("launch") || t.includes("release") || t.includes("new") || t.includes("introduc")) emoji = "🚀";
  else if (t.includes("best") || t.includes("top") || t.includes("win") || t.includes("beat")) emoji = "🏆";
  else if (t.includes("warn") || t.includes("danger") || t.includes("risk") || t.includes("threat")) emoji = "⚠️";
  else if (t.includes("openai") || t.includes("chatgpt")) emoji = "✨";
  return `${emoji} ${title}`;
}

// ── Make excerpt short and readable ─────────────────────────────────────────
function makeReadable(text: string): string {
  // Take first 2 sentences max, keep under 120 chars
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const first = sentences[0]?.trim() ?? text;
  return first.length > 120 ? first.slice(0, 117) + "..." : first + ".";
}

const CORS_PROXY = "https://corsproxy.io/?";

// ── Parse a single RSS feed ───────────────────────────────────────────────────
async function parseRSS(feedUrl: string, category: string): Promise<NewsPost[]> {
  try {
    const res = await fetch(CORS_PROXY + encodeURIComponent(feedUrl), {
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return [];
    const text = await res.text();
    const doc = new DOMParser().parseFromString(text, "application/xml");
    const items = Array.from(doc.querySelectorAll("item")).slice(0, 5);

    return items.map((item) => {
      const rawExcerpt = (
        item.querySelector("description")?.textContent ?? ""
      ).replace(/<[^>]+>/g, "").trim().slice(0, 350);

      const imgNode =
        item.querySelector("enclosure[type^='image']") ??
        item.querySelector("media\\:thumbnail, thumbnail") ??
        item.querySelector("media\\:content");

      const link =
        item.querySelector("link")?.textContent?.trim() ??
        item.querySelector("link")?.nextSibling?.textContent?.trim() ??
        "";

      return {
        id: `rss-${Date.now()}-${Math.random()}`,
        title: item.querySelector("title")?.textContent?.trim() ?? "",
        excerpt: rawExcerpt,
        image_url:
          imgNode?.getAttribute("url") ??
          imgNode?.getAttribute("src") ??
          null,
        category,
        published_date: new Date(
          item.querySelector("pubDate")?.textContent ?? Date.now()
        ).toISOString(),
        url: link,
      } satisfies NewsPost;
    });
  } catch {
    return [];
  }
}

// ── Ask Gemini to simplify titles + excerpts ──────────────────────────────────
async function simplifyWithGemini(
  posts: NewsPost[],
  apiKey: string
): Promise<NewsPost[]> {
  if (!apiKey || posts.length === 0) return posts;

  const input = posts.map((p) => ({ id: p.id, title: p.title, excerpt: p.excerpt }));

  const prompt =
    "You explain today's news to a 5-year-old child in simple English.\n\n" +
    "STRICT RULES:\n" +
    "- Write in plain simple English only. No Hindi, no Hinglish.\n" +
    "- BANNED words: AI, ML, model, algorithm, LLM, API, benchmark, neural, dataset, parameters, compute, GPU, training, inference, framework, multimodal, generative.\n" +
    '- Instead use: \"smart computer helper\", \"robot brain\", \"magic learning tool\", \"clever machine\", \"teaches itself\".\n' +
    "- Title: max 10 words. Simple and fun, like a children's book. Must be in English.\n" +
    "- Excerpt: max 20 words. One short simple English sentence, like a bedtime story.\n" +
    '- Good title example: \"A Smart Computer Helper Got Even Better Today!\"\n' +
    '- Good excerpt example: \"A clever computer can now answer hard questions better than ever before!\"\n' +
    "- Return ONLY a valid JSON array. No markdown, no backticks, no extra text.\n" +
    '- Format: [{\"id\":\"...\",\"title\":\"...\",\"excerpt\":\"...\"}]\n\n' +
    "Simplify this news:\n" +
    JSON.stringify(input);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1200 },
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const clean = raw.replace(/```json|```/g, "").trim();
    const simplified = JSON.parse(clean) as { id: string; title: string; excerpt: string }[];

    return posts.map((p) => {
      const s = simplified.find((x) => x.id === p.id);
      return s ? { ...p, title: s.title, excerpt: s.excerpt } : p;
    });
  } catch {
    return posts; // fallback: return original if Gemini fails
  }
}

// ── Save posts to Supabase ────────────────────────────────────────────────────
async function saveToSupabase(posts: NewsPost[]): Promise<void> {
  if (posts.length === 0) return;
  const rows = posts.map((p) => ({
    title: p.title,
    excerpt: p.excerpt,
    image_url: p.image_url,
    category: p.category,
    published_date: p.published_date,
    url: p.url ?? null,
    // slug is auto-generated or left empty
    content: p.excerpt ?? "",
  }));

  // Upsert based on url to avoid duplicates
  await supabase.from("ai_blogs").upsert(rows, {
    onConflict: "url",
    ignoreDuplicates: true,
  });
}

// ── 9 AM IST daily gate ───────────────────────────────────────────────────────
const STORAGE_KEY = "ai_news_last_fetch_ist";

export function shouldFetchToday(): boolean {
  const last = localStorage.getItem(STORAGE_KEY);
  const nowUTC = new Date();
  // IST = UTC+5:30
  const nowIST = new Date(nowUTC.getTime() + 5.5 * 60 * 60 * 1000);

  // Today's 9 AM IST
  const nineAmToday = new Date(nowIST);
  nineAmToday.setHours(9, 0, 0, 0);

  if (!last) {
    // First ever visit — fetch if it's past 9 AM IST
    return nowIST >= nineAmToday;
  }

  const lastFetch = new Date(last);
  // Already fetched after today's 9 AM IST?
  return lastFetch < nineAmToday && nowIST >= nineAmToday;
}

function markFetched() {
  localStorage.setItem(STORAGE_KEY, new Date().toISOString());
}

// ── Main entry: fetch → simplify → save → return ─────────────────────────────
export async function fetchAndUpdateNews(): Promise<NewsPost[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

  // 1. Fetch all RSS feeds in parallel
  const batches = await Promise.all(
    RSS_FEEDS.map((f) => parseRSS(f.url, f.category))
  );
  let posts = batches.flat();

  // 2. Deduplicate by URL
  const seen = new Set<string>();
  posts = posts.filter((p) => {
    if (!p.url || seen.has(p.url)) return false;
    seen.add(p.url);
    return true;
  });

  // 3. Simplify language with Gemini (if API key present)
  if (apiKey) {
    posts = await simplifyWithGemini(posts, apiKey);
  }

  // 4. Save to Supabase
  await saveToSupabase(posts);

  markFetched();
  return posts;
}
