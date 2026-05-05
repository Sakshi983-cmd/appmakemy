// AI Chat Architect with link/URL fetching support
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the AI Architect for "Make My App" — a full-stack digital agency that builds websites, mobile apps, branding, UI/UX, and CRM/ERP solutions.

About Make My App:
- 50+ projects delivered, 75+ happy clients, 5★ rated, 3+ years experience
- Founders: Dhruv Gupta (CEO), Sayaji Shirke (CTO), Ramprasad Yadav (Sr Tech Head)
- Pricing: Basic ₹2,999 · Professional ₹5,999 · Enterprise ₹9,999+
- Tech: React, Next.js, Node, React Native, Flutter, Postgres, MongoDB
- Contact: hello@makemyapp.co · +91 92424 24232 · WhatsApp 9242424232
- Book a call: https://calendly.com/makemyapp-co/30-minutes-consultation-call

How to respond:
- Be friendly, concise, and helpful — like a senior solutions architect.
- Answer in the same language the user writes (English / Hindi / Hinglish).
- If the user shares a URL, the page text will be supplied to you under "FETCHED PAGE CONTENT". Use it to give specific, useful answers — summarize, audit, suggest improvements, estimate scope, recommend tech.
- For project ideas: outline scope, suggest tech stack, give a rough timeline & price range, and end with a clear CTA (book a call / WhatsApp).
- Never invent prices outside the listed packages — use ranges instead.`;

async function fetchUrlText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 MakeMyAppBot" } });
    if (!res.ok) return `(Failed to fetch ${url}: HTTP ${res.status})`;
    const html = await res.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    return text.slice(0, 6000);
  } catch (e) {
    return `(Error fetching ${url}: ${(e as Error).message})`;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
    let extra = "";
    if (lastUser?.content) {
      const urls = (lastUser.content.match(/https?:\/\/[^\s)]+/g) || []).slice(0, 2);
      if (urls.length) {
        const fetched = await Promise.all(urls.map(fetchUrlText));
        extra = "\n\nFETCHED PAGE CONTENT:\n" + urls.map((u, i) => `--- ${u} ---\n${fetched[i]}`).join("\n\n");
      }
    }

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT + extra },
      ...messages,
    ];

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: t }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
