import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const CATEGORIES = ['AI Research', 'Industry News', 'AI Tools', 'Tutorials'];

const slugify = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80) +
  '-' + Math.random().toString(36).slice(2, 7);

const IMG_QUERIES = [
  'artificial-intelligence', 'technology', 'neural-network', 'robot', 'data-science',
  'machine-learning', 'computer', 'futuristic', 'circuit', 'innovation',
];

async function generateBlogIdeas(): Promise<Array<{title: string; category: string; topic: string}>> {
  const prompt = `Generate exactly 6 diverse, current AI industry blog post ideas for ${new Date().toDateString()}. 
Mix of: AI Research, Industry News, AI Tools, Tutorials.
Return ONLY a JSON array (no markdown) like:
[{"title":"...","category":"AI Research|Industry News|AI Tools|Tutorials","topic":"brief topic for content generation"}]
Topics should feel fresh — new model launches, research breakthroughs, practical AI tools, or how-to tutorials.`;

  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`ideas: ${r.status} ${await r.text()}`);
  const j = await r.json();
  const txt: string = j.choices?.[0]?.message?.content ?? '';
  const m = txt.match(/\[[\s\S]*\]/);
  return JSON.parse(m ? m[0] : txt);
}

async function generateArticle(title: string, category: string, topic: string) {
  const prompt = `Write a premium tech blog article in TechCrunch style.
Title: "${title}"
Category: ${category}
Topic: ${topic}

Return JSON only (no markdown fences):
{
  "excerpt": "1-2 sentence hook (max 200 chars)",
  "content": "Full article in markdown — use ## H2 headings, paragraphs, bullet lists, and at least one > blockquote. 600-900 words. Include concrete details and a forward-looking conclusion."
}`;
  const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!r.ok) throw new Error(`article: ${r.status} ${await r.text()}`);
  const j = await r.json();
  const txt: string = j.choices?.[0]?.message?.content ?? '';
  const m = txt.match(/\{[\s\S]*\}/);
  return JSON.parse(m ? m[0] : txt);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
    const ideas = await generateBlogIdeas();
    const inserted: any[] = [];

    for (const idea of ideas.slice(0, 5)) {
      try {
        const cat = CATEGORIES.includes(idea.category) ? idea.category : 'Industry News';
        const article = await generateArticle(idea.title, cat, idea.topic);
        const q = IMG_QUERIES[Math.floor(Math.random() * IMG_QUERIES.length)];
        const seed = Math.floor(Math.random() * 100000);
        const image_url = `https://source.unsplash.com/1200x675/?${q}&sig=${seed}`;

        const { data, error } = await supabase.from('ai_blogs').insert({
          title: idea.title,
          slug: slugify(idea.title),
          excerpt: article.excerpt,
          content: article.content,
          image_url,
          category: cat,
          published_date: new Date().toISOString(),
        }).select().single();
        if (error) throw error;
        inserted.push(data);
      } catch (e) {
        console.error('skip idea', idea?.title, e);
      }
    }

    return new Response(JSON.stringify({ ok: true, count: inserted.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message ?? 'failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
