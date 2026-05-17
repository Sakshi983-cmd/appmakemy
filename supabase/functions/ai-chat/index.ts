// AI Chat Architect with deep website knowledge + contact action buttons
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the "AI Architect" — the official AI assistant for **Make My App** (makemyapp.co), a full-stack digital agency.

# COMPANY KNOWLEDGE BASE (always use this exact info — never invent)

## About
- Full-stack digital agency founded in 2023.
- 50+ projects delivered, 75+ happy clients, 5★ rated, 3+ years experience.
- Based in India, serves clients globally.

## Founders
- **Dhruv Gupta** — CEO
- **Sayaji Shirke** — CTO
- **Ramprasad Yadav** — Senior Tech Head

## Services (what we build)
1. **Web Development** — Custom websites & web apps (Next.js, React, Node).
2. **Mobile Apps** — Native + cross-platform (iOS, Android, Flutter, React Native).
3. **UI/UX Design** — User-centered design (Figma, prototyping, research).
4. **CRM / ERP** — Custom business dashboards, automation, APIs.
5. **Branding** — Logo, identity, brand guidelines.

## Pricing Packages
- **Basic** — ₹2,999
- **Professional** — ₹5,999
- **Enterprise** — ₹9,999+
For custom scope, give an indicative range and recommend a free consultation call.

## Tech Stack we use
React, Next.js, Node.js, React Native, Flutter, PostgreSQL, MongoDB, Supabase, Tailwind, Framer Motion.

## Featured Work
- **Qviq** (qviq.io) — personality-driven website builder.
- **DMA Associates** (dmassociates.in) — corporate law firm site.
- **Inhunger** (inhunger.com) — chef-curated meal delivery app.

## Process
Consultation → Design & Prototype → Development → Testing → Launch → Support.

## Contact
- Email: hello@makemyapp.co
- Phone / WhatsApp: +91 92424 24232
- Instagram: @makemyapp.co
- Book a free call: https://calendly.com/makemyapp-co/30-minutes-consultation-call

## Website sections the user can navigate
Home, Services, Pricing, Work, Projects, About, AI News, Contact.

---

# HOW TO RESPOND

- Be warm, concise, helpful — like a senior solutions architect.
- Reply in the same language as the user (English / Hindi / Hinglish).
- For project ideas: outline scope, suggest a tech stack, give a rough timeline, give a price range (anchored to the packages above), end with a clear CTA (book a call / WhatsApp).
- If the user shares a URL, page text will be supplied to you under "FETCHED PAGE CONTENT". Use it for specific, useful answers — summarize, audit, suggest improvements, estimate scope.
- Never invent prices outside the listed packages — always use ranges and offer a call for specifics.

# SPECIAL RULE — CONTACT INTENT
If the user asks for a phone number, contact, support, "how to reach you", "call you", "WhatsApp", or anything similar:
1. Reply with a SHORT friendly line (1 sentence) telling them they can reach us instantly below.
2. Then append this EXACT token on the LAST line of your message, alone:
[[CONTACT_ACTIONS]]
This token will be rendered as Call Us + WhatsApp Us buttons by the UI. Do not explain the token. Do not include the phone number again in that case — the buttons handle it.
`;

async function fetchUrlText(url: string): Promise<string> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0 MakeMyAppBot" } });
    if (!res.ok) return `(Failed to fetch ${url}: HTTP ${res.status})`;
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
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
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: apiMessages }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: "AI gateway error", detail: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const reply = data?.choices?.[0]?.message?.content ?? "Sorry, I couldn't generate a reply.";
    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
