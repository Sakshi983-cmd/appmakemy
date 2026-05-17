import { useState, useEffect, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe, Smartphone, Palette, Layers, ChartColumn, Sparkles, ArrowRight, ExternalLink,
  Mail, Phone, Instagram, Linkedin, MessageSquare, Send, X, Menu, ChevronUp, Star,
  CheckCircle2, FileText, Filter, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import qviqLogo from "@/assets/qviq-logo.png";
import dmaLogo from "@/assets/dma-logo.png";
import LatestAINews from "@/components/LatestAINews";
import InstagramReels from "@/components/InstagramReels";

const CUSTOM_LOGOS: Record<string, string> = {
  "qviq.io": qviqLogo,
  "www.dmassociates.in": dmaLogo,
  "dmassociates.in": dmaLogo,
};

const openCalendly = () => window.open("https://calendly.com/makemyapp-co/30-minutes-consultation-call", "_blank");
const openWhatsApp = () => window.open("https://api.whatsapp.com/send?phone=919242424232", "_blank");

const NAV = [
  { label: "Home", id: "home" },
  { label: "Services", id: "services" },
  { label: "Pricing", id: "pricing" },
  { label: "Work", id: "work" },
  { label: "Projects", id: "projects" },
  { label: "About", id: "about" },
  { label: "Contact", id: "contact" },
];

const SERVICES = [
  { icon: Globe, title: "Web Development", desc: "Custom websites and web apps built with cutting-edge tech.", color: "#7C3AED", gradient: "from-violet-500 to-purple-700", emoji: "🌐", tags: ["Next.js", "React", "Node"] },
  { icon: Smartphone, title: "Mobile Apps", desc: "Native & cross-platform apps with seamless performance.", color: "#F97316", gradient: "from-orange-500 to-rose-600", emoji: "📱", tags: ["iOS", "Android", "Flutter"] },
  { icon: Palette, title: "UI/UX Design", desc: "User-centered design merging aesthetics with function.", color: "#EC4899", gradient: "from-pink-500 to-fuchsia-600", emoji: "🎨", tags: ["Figma", "Prototyping", "Research"] },
  { icon: ChartColumn, title: "CRM / ERP", desc: "Custom business solutions to streamline operations.", color: "#0EA5E9", gradient: "from-sky-500 to-blue-700", emoji: "📊", tags: ["Dashboards", "Automation", "API"] },
  { icon: Layers, title: "Branding", desc: "Strategic brand identity that makes you stand out.", color: "#10B981", gradient: "from-emerald-500 to-teal-700", emoji: "✨", tags: ["Logo", "Identity", "Guidelines"] },
];

const FEATURED = [
  {
    title: "Qviq",
    badge: "qviq",
    badgeIcon: Globe,
    desc: "Create a website that reflects your personality and grows your brand quickly and easily.",
    image: "/project-qviq.jpg",
    url: "https://qviq.io/",
    accent: "#7C3AED",
    bg: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
    centerKind: "logo" as const,
  },
  {
    title: "DMA Associates",
    badge: "dma associates",
    badgeIcon: Layers,
    desc: "Expertise in Corporate and Allied Laws, delivered by seasoned in-house professionals.",
    image: "/project-dma.jpg",
    url: "https://www.dmassociates.in/",
    accent: "#2563EB",
    bg: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
    centerKind: "logo" as const,
  },
  {
    title: "Inhunger",
    badge: "inhunger.com",
    badgeIcon: Smartphone,
    desc: "Delivering fresh, chef-curated meals straight to your doorstep.",
    image: "/project-inhunger.jpg",
    url: "https://inhunger.com/",
    accent: "#EA580C",
    bg: "linear-gradient(135deg, #FFFFFF, #FFE4D6)",
    centerKind: "wordmark" as const,
  },
];

const CATS = ["All", "Website", "Mobile App", "Branding", "Design"] as const;
type Cat = typeof CATS[number];

const PROJECTS: { title: string; cat: Cat; url: string; desc: string; tag: string }[] = [
  { title: "Deciwood", cat: "Website", url: "https://deciwood.com/", desc: "Premium furniture & decor", tag: "E-commerce" },
  { title: "Shararat", cat: "Website", url: "https://shararat.in/", desc: "Bold fashion brand", tag: "Fashion" },
  { title: "DM Associates", cat: "Website", url: "https://www.dmassociates.in/", desc: "Corporate law firm", tag: "Corporate" },
  { title: "Qviq", cat: "Website", url: "https://qviq.io/", desc: "Personal websites SaaS", tag: "SaaS" },
  { title: "Sneakersurge", cat: "Website", url: "https://www.sneakersurge.com", desc: "Trendy footwear store", tag: "E-commerce" },
  { title: "Bijoliyo", cat: "Website", url: "https://bijoliyo.com/", desc: "Elegant jewelry", tag: "Jewelry" },
  { title: "Label Komal Shah", cat: "Website", url: "https://www.labelkomalshah.com/", desc: "High-fashion label", tag: "Fashion" },
  { title: "Godavari Cuts", cat: "Website", url: "https://godavaricuts.com/", desc: "Restaurant ordering", tag: "Food" },
  { title: "Online Hearing", cat: "Website", url: "https://onlinehearing.com/", desc: "Hearing healthcare", tag: "Healthcare" },
  { title: "Market Grey Boutique", cat: "Website", url: "https://marketgreyboutique.net/", desc: "Fashion boutique", tag: "Fashion" },
  { title: "Brainflakes", cat: "Website", url: "https://brainflakes.com/", desc: "Tech education", tag: "EdTech" },
  { title: "Divine Copper", cat: "Website", url: "https://divinecopper.com/", desc: "Artisan copper goods", tag: "Crafts" },
  { title: "Bake My T-Shirt", cat: "Website", url: "https://bakemytshirt.com/", desc: "Custom printing", tag: "Custom" },
  { title: "Hanfi Handicraft", cat: "Website", url: "https://hanfihandicraft.com/", desc: "Handicraft marketplace", tag: "Crafts" },
  { title: "Rizari", cat: "Website", url: "https://rizari.in/", desc: "Personalized fashion", tag: "Fashion" },
  { title: "Cococart", cat: "Website", url: "https://cococart.in/", desc: "Grocery delivery", tag: "Food" },
  { title: "Drink Wakeup Water", cat: "Website", url: "https://drinkwakeupwater.com/", desc: "Beverage brand", tag: "Beverage" },
  { title: "Funkvibes", cat: "Website", url: "https://funkvibes.com/", desc: "Lifestyle brand", tag: "Lifestyle" },
  { title: "Meethi Elaichi", cat: "Website", url: "https://www.meethiellaichi.com/", desc: "Food brand", tag: "Food" },
  { title: "Akutee", cat: "Website", url: "https://akutee.store/", desc: "Sustainable fashion", tag: "Fashion" },
  { title: "Chapter Skin", cat: "Website", url: "https://chapterskin.in/", desc: "Skincare e-commerce", tag: "Beauty" },
  { title: "Tomahawk Tools", cat: "Website", url: "https://www.tomahawk.tools/", desc: "Tools & hardware", tag: "Tools" },
  { title: "Athlab", cat: "Website", url: "https://athlab.in/", desc: "Clean supplements", tag: "Fitness" },
  { title: "Gaffit", cat: "Website", url: "https://www.gaffit.in/", desc: "Services marketplace", tag: "Services" },
  { title: "The Fizz Company", cat: "Website", url: "https://thefizzcompany.in/", desc: "Beverage brand", tag: "Beverage" },
  { title: "Regal Plus", cat: "Website", url: "https://regalplus.com/", desc: "Professional services", tag: "Corporate" },
  { title: "Gossip Confetti", cat: "Website", url: "https://gossipconfetti.com/", desc: "Entertainment media", tag: "Media" },
  { title: "Kyzaindia", cat: "Website", url: "https://kyzaindia.com/", desc: "Ethnic & fusion wear", tag: "Fashion" },
  { title: "Heatronics", cat: "Website", url: "https://heatronics.in/", desc: "Electronics e-commerce", tag: "Electronics" },
  { title: "Little Thing Studio", cat: "Website", url: "https://www.littlethingstudio.com/", desc: "Creative agency", tag: "Agency" },
  { title: "Laad India", cat: "Website", url: "https://laadindia.com/", desc: "Gifting platform", tag: "Gifting" },
  { title: "Teslahh", cat: "Website", url: "https://teslahh.com/", desc: "Tech showcase", tag: "Tech" },
  { title: "The Nail Lobby", cat: "Website", url: "https://thenaillobby.com", desc: "Beauty salon", tag: "Beauty" },
  { title: "Circle of Life", cat: "Website", url: "https://circleoflife.co.in", desc: "Wellness platform", tag: "Wellness" },
  { title: "ESC Elite", cat: "Website", url: "https://esc.theeliteenterprise.com/", desc: "Enterprise solutions", tag: "Enterprise" },
  { title: "ESS Elite", cat: "Website", url: "https://ess.theeliteenterprise.com/", desc: "Service automation", tag: "Enterprise" },
  { title: "EGN Elite", cat: "Website", url: "https://egn.theeliteenterprise.com/", desc: "Growth network", tag: "Enterprise" },
  { title: "Kisanwala", cat: "Mobile App", url: "https://play.google.com/store/apps/details?id=com.kisanwala", desc: "Agriculture app", tag: "AgriTech" },
  { title: "Pavlok", cat: "Mobile App", url: "https://play.google.com/store/apps/details?id=com.pavlok3.core", desc: "Habit tracking", tag: "Health" },
  { title: "WedHaven", cat: "Mobile App", url: "https://play.google.com/store/apps/details?id=com.wedhaven.app", desc: "Wedding planning", tag: "Lifestyle" },
  { title: "SafeSnap", cat: "Mobile App", url: "https://play.google.com/store/apps/details?id=com.ads.app.safesnap", desc: "Secure photo manager", tag: "Utility" },
  { title: "Tripster", cat: "Mobile App", url: "https://play.google.com/store/apps/details?id=ru.tripster.tripster", desc: "Travel planning", tag: "Travel" },
  { title: "Branding Portfolio", cat: "Branding", url: "#", desc: "Logos, guidelines, marketing", tag: "Identity" },
  { title: "Packaging Designs", cat: "Design", url: "https://drive.google.com/drive/folders/1kW0VqRBU0UXm0KbBKqlTcEFaRaDbReB6", desc: "Print-ready packaging", tag: "Print" },
  { title: "AI Videos", cat: "Design", url: "https://drive.google.com/drive/folders/1kW0VqRBU0UXm0KbBKqlTcEFaRaDbReB6", desc: "AI-generated videos", tag: "Video" },
  { title: "UGC Videos", cat: "Design", url: "https://drive.google.com/drive/folders/1kW0VqRBU0UXm0KbBKqlTcEFaRaDbReB6", desc: "Authentic UGC content", tag: "Video" },
];

const PALETTES = [
  { from: "#7C3AED", to: "#A78BFA" },
  { from: "#F97316", to: "#FB923C" },
  { from: "#2563EB", to: "#60A5FA" },
  { from: "#EC4899", to: "#F472B6" },
  { from: "#10B981", to: "#34D399" },
  { from: "#EA580C", to: "#FB923C" },
  { from: "#8B5CF6", to: "#C084FC" },
  { from: "#0EA5E9", to: "#38BDF8" },
];
const paletteFor = (s: string) => PALETTES[s.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTES.length];

const PRICING = [
  { name: "Basic", price: "₹2,999", desc: "Perfect for small businesses establishing their digital presence.", features: ["Custom design & development", "Responsive across all devices", "Basic SEO", "CMS integration", "1 month support"], popular: false },
  { name: "Professional", price: "₹5,999", desc: "Comprehensive solution for growing businesses.", features: ["Everything in Basic", "Advanced functionality", "E-commerce integration", "Advanced SEO", "3 months support", "Performance optimization"], popular: true },
  { name: "Enterprise", price: "₹9,999+", desc: "Tailored solutions for large businesses.", features: ["Everything in Professional", "Custom integrations", "Dedicated PM", "Priority support", "6 months support", "Comprehensive analytics"], popular: false },
];

const PROCESS = [
  { title: "Initial Consultation", desc: "We discuss your goals and vision.", icon: MessageSquare, color: "#7C3AED" },
  { title: "Planning & Strategy", desc: "Detailed roadmap for your project.", icon: ChartColumn, color: "#F97316" },
  { title: "Development", desc: "We bring your vision to life.", icon: Zap, color: "#A855F7" },
  { title: "Testing & QA", desc: "Rigorous testing for quality.", icon: CheckCircle2, color: "#F59E0B" },
  { title: "Launch & Support", desc: "Deploy and ongoing maintenance.", icon: Globe, color: "#F43F5E" },
];

const FOUNDERS = [
  { name: "Dhruv Gupta", title: "Co-Founder & CEO", bio: "Visionary leader building scalable solutions that turn ideas into impactful products.", image: "/founder-dhruv.jpg", color: "#7C3AED", links: [{ t: "linkedin" as const, u: "https://www.linkedin.com/in/iamdhruvguptaa/" }, { t: "instagram" as const, u: "https://www.instagram.com/iamdhruvguptaa/" }] },
  { name: "Sayaji Shirke", title: "Co-Founder & CTO", bio: "Tech architect building future-proof solutions with clean, empowering code.", image: "/founder-sayaji.jpg", color: "#F97316", links: [{ t: "linkedin" as const, u: "https://www.linkedin.com/in/sayajishirke/" }, { t: "instagram" as const, u: "https://www.instagram.com/sayajishirke/" }] },
  { name: "Ramprasad Yadav", title: "Senior Tech Head", bio: "Oversees all technical aspects with focus on clean code and excellence.", image: "/founder-ramprasad.jpg", color: "#EA580C", links: [{ t: "instagram" as const, u: "https://www.instagram.com/iamyadavram/" }] },
];

const TESTIMONIALS = [
  { quote: "Make My App delivered our project on time and exceeded our expectations.", name: "Sarah Johnson", role: "TechVenture Inc.", initials: "SJ" },
  { quote: "Working with this team was refreshing. They truly understood our business.", name: "Michael Chen", role: "Innovate Solutions", initials: "MC" },
];

const STATS_MARQUEE = ["50+ Projects Delivered", "75+ Happy Clients", "5.0★ Avg Rating", "3yr+ Experience"];

const QUICK = [
  { label: "Roadmap", icon: "🗺️", prompt: "Give me a typical project roadmap for building a web application" },
  { label: "Costing", icon: "💰", prompt: "What are the indicative costs for different types of projects?" },
  { label: "Tech Stack", icon: "⚙️", prompt: "What tech stack do you recommend for a startup MVP?" },
];

interface Msg { role: "user" | "assistant"; content: string; }

function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, thinking]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || thinking) return;
    setInput("");
    const newMsgs: Msg[] = [...messages, { role: "user", content: t }];
    setMessages(newMsgs);
    setThinking(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", { body: { messages: newMsgs } });
      if (error) throw error;
      if (data?.error) {
        setMessages((p) => [...p, { role: "assistant", content: data.error }]);
      } else {
        setMessages((p) => [...p, { role: "assistant", content: data?.reply ?? "Hmm, I couldn't reply." }]);
      }
    } catch (e: any) {
      setMessages((p) => [...p, { role: "assistant", content: "Network error — please try again." }]);
    } finally {
      setThinking(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/30 z-[55]" />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[420px] z-[60] flex flex-col bg-white border-l border-gray-200">
            <div className="flex items-center justify-between px-5 py-4 border-b bg-gradient-to-r from-violet-50 to-orange-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">AI Architect</h3>
                  <p className="text-xs text-orange-600">Make My App Bot · Online</p>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/50"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-gray-50/50">
              {messages.length === 0 && (
                <div className="space-y-3">
                  <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 text-sm text-gray-700 max-w-[85%] shadow-sm">
                    Hey there! 👋 I'm the AI Architect for Make My App. Tell me about your project idea — or paste any website URL and I'll review it. Try a quick action below!
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK.map((a) => (
                      <button key={a.label} onClick={() => send(a.prompt)} className="px-3 py-1.5 text-xs rounded-full border border-gray-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-gray-700 flex items-center gap-1.5 transition-colors">
                        <span>{a.icon}</span> {a.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m, i) => {
                const hasContact = m.role === "assistant" && m.content.includes("[[CONTACT_ACTIONS]]");
                const cleanContent = hasContact ? m.content.replace("[[CONTACT_ACTIONS]]", "").trim() : m.content;
                return (
                  <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${m.role === "user" ? "bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-br-md" : "bg-white text-gray-700 rounded-bl-md shadow-sm"}`}>
                      {cleanContent}
                    </div>
                    {hasContact && (
                      <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
                        <a href="tel:+919242424232" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white text-sm font-semibold shadow-md hover:scale-105 transition-transform">
                          <Phone className="w-4 h-4" /> Call Us
                        </a>
                        <a href="https://wa.me/919242424232" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-semibold shadow-md hover:scale-105 transition-transform">
                          <MessageSquare className="w-4 h-4" /> WhatsApp Us
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
              {thinking && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-4 py-3 bg-white shadow-sm">
                    <div className="flex gap-1.5">
                      <span className="thinking-dot w-2 h-2 rounded-full bg-violet-500" />
                      <span className="thinking-dot w-2 h-2 rounded-full bg-orange-500" />
                      <span className="thinking-dot w-2 h-2 rounded-full bg-violet-400" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="p-3 border-t bg-white flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything or paste a link…"
                className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400" />
              <button type="submit" disabled={!input.trim() || thinking}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-violet-600 to-orange-500 text-white flex items-center justify-center disabled:opacity-50 hover:shadow-lg transition-all">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getDomain(url?: string) {
  if (!url || url === "#") return null;
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; }
}

function BrandLogo({ url, title, size = 48, rounded = true }: { url?: string; title: string; size?: number; rounded?: boolean }) {
  const domain = getDomain(url);
  const custom = domain ? CUSTOM_LOGOS[domain] : undefined;
  // Build a fallback chain so smaller brands also get a logo
  const sources = useMemo(() => {
    if (custom) return [custom];
    if (!domain) return [] as string[];
    return [
      `https://logo.clearbit.com/${domain}`,
      `https://icons.duckduckgo.com/ip3/${domain}.ico`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=256`,
      `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
    ];
  }, [custom, domain]);
  const [idx, setIdx] = useState(0);
  const initials = title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  if (sources.length === 0 || idx >= sources.length) {
    return (
      <div className={`flex items-center justify-center bg-white shadow-lg ${rounded ? "rounded-2xl" : ""}`}
        style={{ width: size, height: size }}>
        <span className="font-black tracking-tight bg-gradient-to-br from-gray-900 to-gray-600 bg-clip-text text-transparent" style={{ fontSize: size * 0.42 }}>
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow-lg flex items-center justify-center overflow-hidden p-2 ${rounded ? "rounded-2xl" : ""}`}
      style={{ width: size, height: size }}>
      <img
        src={sources[idx]}
        alt={`${title} logo`}
        loading="lazy"
        onError={() => setIdx((i) => i + 1)}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

function BrandTile({ title, tag, palette, url, large = false }: { title: string; tag: string; palette: { from: string; to: string }; url?: string; large?: boolean }) {
  return (
    <div className={`relative ${large ? "h-48 sm:h-56" : "h-36 sm:h-40"} overflow-hidden flex items-center justify-center`}
      style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}>
      {/* glow accents */}
      <div className="absolute inset-0 opacity-40" style={{ background: `radial-gradient(circle at 25% 15%, rgba(255,255,255,.7), transparent 55%)` }} />
      <div className="absolute -right-6 -bottom-8 w-32 h-32 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -left-6 -top-8 w-28 h-28 rounded-full bg-black/15 blur-2xl" />
      {/* mesh grid */}
      <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      {/* shine sweep on hover */}
      <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:translate-x-[300%] transition-transform duration-1000" />
      <div className="relative z-10 flex flex-col items-center gap-2 px-2">
        <BrandLogo url={url} title={title} size={large ? 104 : 72} />
        <div className={`mt-1 ${large ? "text-xs" : "text-[10px]"} font-bold uppercase tracking-[0.18em] text-white/95 px-2.5 py-0.5 rounded-full bg-black/25 backdrop-blur-sm`}>{tag}</div>
      </div>
    </div>
  );
}

const Index = () => {
  const [chatOpen, setChatOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [activeCat, setActiveCat] = useState<Cat>("All");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => { setScrolled(window.scrollY > 20); setShowTop(window.scrollY > 600); };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };
  const filtered = activeCat === "All" ? PROJECTS : PROJECTS.filter((p) => p.cat === activeCat);

  return (
    <div className="min-h-screen bg-white text-gray-900 relative overflow-x-hidden">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? "bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100" : "bg-white"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16 sm:h-20">
          <button onClick={() => scrollTo("home")} className="shrink-0">
            <img src="/makemyapp-logo.png" alt="MakeMyApp" className="h-12 sm:h-14 w-auto object-contain" style={{ maxWidth: 200 }} />
          </button>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((l) => (
              <button key={l.id} onClick={() => scrollTo(l.id)}
                className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition-colors">
                {l.label}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => setChatOpen(true)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-orange-500 flex items-center justify-center text-white hover:shadow-lg transition-all" title="AI Architect">
              <Sparkles className="w-4 h-4" />
            </button>
            <Button onClick={openCalendly} className="hidden sm:flex rounded-full bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 text-sm font-semibold">
              Book a Call
            </Button>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 rounded-lg hover:bg-gray-100"><Menu className="w-5 h-5" /></button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72 bg-white">
                <SheetHeader><SheetTitle className="text-left">Menu</SheetTitle></SheetHeader>
                <div className="flex flex-col gap-1 mt-6">
                  {NAV.map((l) => (
                    <button key={l.id} onClick={() => scrollTo(l.id)}
                      className="px-4 py-3 text-left text-sm font-medium text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors">
                      {l.label}
                    </button>
                  ))}
                  <Button onClick={openCalendly} className="mt-4 w-full rounded-full bg-orange-500 hover:bg-orange-600 text-white">Book a Call</Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section id="home" className="relative pt-28 sm:pt-36 lg:pt-40 pb-16 sm:pb-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[450px] h-[450px] rounded-full pulse-glow-1" style={{ background: "radial-gradient(circle, rgba(124,58,237,.18), transparent 70%)" }} />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] rounded-full pulse-glow-2" style={{ background: "radial-gradient(circle, rgba(249,115,22,.16), transparent 70%)" }} />
          <div className="absolute top-28 left-[6%] w-24 h-24 border-[2.5px] border-purple-300/25 rounded-xl geo-float-1" />
          <div className="absolute top-40 right-[10%] w-20 h-20 border-[2.5px] border-orange-300/25 rounded-full geo-float-2" />
          <div className="absolute bottom-24 left-[20%] w-16 h-16 border-2 border-purple-300/20 -rotate-12 geo-float-3" />
          <div className="bubble w-8 h-8 border-purple-300/20" style={{ left: "15%", animationDuration: "18s" }} />
          <div className="bubble w-6 h-6 border-orange-300/20" style={{ left: "35%", animationDuration: "22s", animationDelay: "4s" }} />
          <div className="bubble w-10 h-10 border-purple-200/15" style={{ left: "55%", animationDuration: "20s", animationDelay: "2s" }} />
          <div className="bubble w-7 h-7 border-orange-200/15" style={{ left: "80%", animationDuration: "19s", animationDelay: "6s" }} />
          <div className="enhanced-particle w-2 h-2" style={{ left: "10%", animationDuration: "14s" }} />
          <div className="enhanced-particle w-1.5 h-1.5" style={{ left: "45%", animationDuration: "18s", animationDelay: "3s" }} />
          <div className="enhanced-particle w-2 h-2" style={{ left: "85%", animationDuration: "16s", animationDelay: "5s" }} />
          <div className="absolute inset-0 grid-pattern" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 border border-orange-200 text-orange-700 text-sm font-semibold shadow-sm backdrop-blur-sm hero-float-1">
            <Sparkles className="w-4 h-4" /> Full-Stack Digital Agency
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="mt-6 text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold tracking-tight text-gray-900 leading-[1.05]">
            We Turn Your Vision <br />
            <span className="gradient-text">Into Digital Reality.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 text-xl sm:text-2xl font-bold text-gray-400 tracking-wide">
            Apps. Websites. Brands. — Built to Scale.
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 max-w-2xl mx-auto text-base sm:text-lg text-gray-500 leading-relaxed">
            From idea to launch — we design, develop, and deliver world-class digital products that drive growth.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 hero-float-2">
            <Button onClick={openCalendly} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/30 transition-all hover:scale-105">
              Book a Free Call <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button variant="outline" onClick={() => scrollTo("work")} className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg font-semibold transition-all hover:scale-105">
              View Our Work
            </Button>
          </motion.div>
          <div className="mt-10 flex items-center justify-center gap-6 sm:gap-10">
            {[["50+", "Projects"], ["75+", "Clients"], ["5.0", "Rating"], ["3yr+", "Experience"]].map((s, i) => (
              <div key={i} className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">{s[0]}</div>
                  <div className="text-xs sm:text-sm text-gray-400 font-medium">{s[1]}</div>
                </div>
                {i < 3 && <div className="w-px h-10 bg-gray-200" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marquee */}
      <section className="py-6 bg-gray-50 border-y border-gray-100 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {[...STATS_MARQUEE, ...STATS_MARQUEE, ...STATS_MARQUEE].map((s, i) => (
            <div key={i} className="flex items-center gap-2 mx-8 sm:mx-12 text-gray-700 font-semibold text-sm sm:text-base">
              <span>{s}</span><span className="text-orange-400">•</span>
            </div>
          ))}
        </div>
      </section>

      {/* Services */}
      <section id="services" className="py-16 sm:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-10 right-[5%] w-56 h-56 morph-blob pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(124,58,237,.06), rgba(249,115,22,.04))" }} />
        <div className="absolute bottom-10 left-[3%] w-44 h-44 morph-blob pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(249,115,22,.05), rgba(124,58,237,.03))", animationDelay: "6s" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">Our Services</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">We deliver exceptional digital solutions tailored to your unique business needs.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {SERVICES.map((s, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }}
                className="group relative rounded-3xl border border-gray-200 bg-white p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
                {/* gradient orb bg */}
                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${s.gradient} opacity-10 group-hover:opacity-25 group-hover:scale-125 transition-all duration-700 blur-2xl`} />
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, rgba(124,58,237,.06), transparent 60%)" }} />
                {/* icon block */}
                <div className={`relative w-16 h-16 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <s.icon className="w-7 h-7 text-white" strokeWidth={2.2} />
                  <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white shadow-md flex items-center justify-center text-base">{s.emoji}</div>
                </div>
                <h3 className="relative text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="relative text-sm text-gray-500 leading-relaxed mb-4">{s.desc}</p>
                <div className="relative flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span key={t} className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 group-hover:bg-white group-hover:shadow-sm transition-all">{t}</span>
                  ))}
                </div>
                <div className="absolute bottom-3 right-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2 transition-all duration-300">
                  <ArrowRight className="w-4 h-4" style={{ color: s.color }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 sm:py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">Our Pricing</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">Flexible packages designed to meet your needs and budget.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {PRICING.map((p, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl bg-white border p-6 sm:p-8 transition-all hover:shadow-xl ${p.popular ? "border-orange-400 ring-2 ring-orange-400/20 shadow-lg scale-105" : "border-gray-200"}`}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-orange-500 text-white text-xs font-bold tracking-wider">POPULAR</div>}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{p.name} Package</h3>
                <div className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">{p.price}</div>
                <p className="text-sm text-gray-500 mb-6">{p.desc}</p>
                <ul className="space-y-3 mb-8">
                  {p.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-orange-500" />{f}
                    </li>
                  ))}
                </ul>
                <Button onClick={openCalendly} className={`w-full rounded-full py-3 text-sm font-semibold ${p.popular ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20" : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"}`}>
                  {p.popular ? "Get Started" : "Contact Us"}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">Our Process</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">A streamlined approach to high-quality delivery.</p>
          </div>
          <div className="relative">
            {/* connector line */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-violet-300 via-orange-300 to-rose-300 opacity-60" />
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 lg:gap-6 relative">
              {PROCESS.map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="group text-center relative">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-full blur-xl opacity-40 group-hover:opacity-70 transition-opacity" style={{ background: s.color }} />
                    <div className="relative w-24 h-24 rounded-full flex items-center justify-center bg-white border-4 shadow-xl group-hover:scale-110 group-hover:-rotate-6 transition-all duration-500" style={{ borderColor: s.color }}>
                      <s.icon className="w-9 h-9" style={{ color: s.color }} strokeWidth={2.2} />
                    </div>
                    <div className="absolute -top-1 -right-1 w-9 h-9 rounded-full text-white text-sm font-black flex items-center justify-center shadow-lg ring-4 ring-white" style={{ background: s.color }}>{i + 1}</div>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Work */}
      <section id="work" className="py-16 sm:py-24 bg-gray-50 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-sm font-medium mb-4">
              50+ projects delivered
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">Our Work</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {FEATURED.map((p, i) => (
              <motion.a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
                initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="group relative rounded-3xl overflow-hidden border border-gray-200 bg-white hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                <div className="relative h-64 overflow-hidden" style={{ background: p.bg }}>
                  <div className="absolute inset-0 opacity-25 mix-blend-overlay">
                    <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <div className="absolute inset-0 opacity-[0.18]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.4) 1px, transparent 1px)", backgroundSize: "26px 26px" }} />
                  <div className="absolute -right-8 -bottom-10 w-40 h-40 rounded-full bg-white/15 blur-3xl" />
                  <div className="absolute -left-8 -top-10 w-36 h-36 rounded-full bg-black/15 blur-3xl" />
                  {/* shine */}
                  <div className="absolute inset-y-0 -left-1/2 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 group-hover:translate-x-[300%] transition-transform duration-1000" />
                  {/* Branded badge */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-sm shadow-md">
                    <p.badgeIcon className="w-3.5 h-3.5" style={{ color: p.centerKind === "wordmark" ? "#000" : p.accent }} />
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: p.centerKind === "wordmark" ? "#000" : p.accent }}>{p.badge}</span>
                  </div>
                  <div className="absolute top-4 right-4 inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md group-hover:rotate-45 transition-transform">
                    <ExternalLink className="w-4 h-4" style={{ color: p.centerKind === "wordmark" ? "#000" : p.accent }} />
                  </div>
                  {/* Center: real brand logo OR black wordmark */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    {p.centerKind === "wordmark" ? (
                      <div className="text-3xl sm:text-4xl font-black tracking-tight text-black drop-shadow-sm">
                        inhunger<span className="text-orange-500">.com</span>
                      </div>
                    ) : (
                      <BrandLogo url={p.url} title={p.title} size={108} />
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{p.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-4">{p.desc}</p>
                  <div className="flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all" style={{ color: p.accent }}>
                    Visit live site <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="/portfolio.pdf" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/20 transition-all">
              <FileText className="w-4 h-4" /> Explore All Projects
            </a>
          </div>
        </div>
      </section>

      {/* Projects (full portfolio with branded tiles) */}
      <section id="projects" className="py-16 sm:py-24 bg-white relative overflow-hidden">
        <div className="absolute top-16 right-[6%] w-60 h-60 morph-blob pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(124,58,237,.06), rgba(249,115,22,.04))" }} />
        <div className="absolute bottom-10 left-[5%] w-48 h-48 morph-blob pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(249,115,22,.05), rgba(124,58,237,.03))", animationDelay: "4s" }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-orange-100 border border-orange-200 text-orange-700 text-xs font-bold uppercase tracking-wider mb-4">
              <Sparkles className="w-3.5 h-3.5" /> {PROJECTS.length}+ live projects
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">
              Our <span className="gradient-text">Projects</span>
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-lg">A curated portfolio across industries — every tile is a real client we've launched.</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <Filter className="w-4 h-4 text-gray-400 mr-1" />
            {CATS.map((c) => {
              const count = c === "All" ? PROJECTS.length : PROJECTS.filter((p) => p.cat === c).length;
              return (
                <button key={c} onClick={() => setActiveCat(c)}
                  className={`relative px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${activeCat === c ? "text-white shadow-lg shadow-orange-500/30 bg-gradient-to-r from-orange-500 to-violet-500 scale-105" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {c}
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeCat === c ? "bg-white/25" : "bg-white text-gray-500"}`}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {filtered.map((p, i) => {
              const palette = paletteFor(p.title);
              const isLink = p.url && p.url !== "#";
              return (
                <motion.a key={p.title + i} href={isLink ? p.url : undefined} target={isLink ? "_blank" : undefined} rel={isLink ? "noopener noreferrer" : undefined}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ delay: Math.min(i * 0.02, 0.4) }}
                  className="group relative rounded-2xl overflow-hidden bg-white border border-gray-200 hover:border-transparent hover:shadow-2xl hover:shadow-orange-500/15 hover:-translate-y-2 transition-all duration-500 cursor-pointer block">
                  {/* gradient ring on hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})`, padding: 2, WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)", WebkitMaskComposite: "xor", maskComposite: "exclude" }} />
                  <BrandTile title={p.title} tag={p.tag} palette={palette} url={p.url} />
                  <div className="p-3.5 relative">
                    <h3 className="text-sm font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">{p.title}</h3>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded" style={{ color: palette.from, background: `${palette.from}12` }}>{p.cat}</span>
                      {isLink && <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-orange-500 group-hover:rotate-12 transition-all" />}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5 line-clamp-1">{p.desc}</p>
                  </div>
                </motion.a>
              );
            })}
          </div>
          <div className="text-center mt-14 p-8 sm:p-10 rounded-2xl bg-gradient-to-br from-violet-50 to-orange-50 border border-orange-100">
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Ready to Start Your Project?</h3>
            <Button onClick={openCalendly} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 text-base font-semibold shadow-lg shadow-orange-500/20">
              Book a Free Consultation <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* Latest AI News */}
      <LatestAINews />

      {/* About */}
      <section id="about" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-sm font-medium mb-4">Our Story</div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-8">
            From a <span className="gradient-text">Small Team</span> to a <span className="gradient-text">Full-Stack Agency</span>
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-4">
              <p className="text-gray-600 leading-relaxed">In 2023, three developers with a shared vision came together to create something meaningful. We knew the struggles of building digital products firsthand — and we wanted to make that journey easier for others.</p>
              <p className="text-gray-600 leading-relaxed">Today, we've delivered 50+ projects for 75+ happy clients across India and beyond. From startups to enterprises, we transform ideas into impactful digital solutions.</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-gray-900 mb-2">The Make My App Difference</h3>
              {["We build products, not just code", "Direct communication with founders", "Fast delivery without compromising quality", "5-star rated on every project"].map((d, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white border border-gray-200">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-orange-500" />
                  <span className="text-sm text-gray-700">{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founders */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-sm font-medium text-orange-600 mb-2">The minds behind the magic</p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">Meet the <span className="gradient-text">Architects</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {FOUNDERS.map((f, i) => (
              <motion.div key={f.name} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="rounded-2xl bg-white border border-gray-200 p-8 text-center hover:shadow-xl transition-all">
                <div className="w-44 h-44 mx-auto rounded-full overflow-hidden mb-5 border-[6px]" style={{ borderColor: f.color }}>
                  <img src={f.image} alt={f.name} className="w-full h-full object-cover object-top" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{f.name}</h3>
                <p className="text-sm font-semibold mb-3" style={{ color: f.color }}>{f.title}</p>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{f.bio}</p>
                <div className="flex justify-center gap-3 pt-3 border-t border-gray-100">
                  {f.links.map((l) => (
                    <a key={l.u} href={l.u} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center hover:scale-110 transition-all hover:text-white"
                      onMouseEnter={(e) => (e.currentTarget.style.background = f.color)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      {l.t === "linkedin" ? <Linkedin className="w-4 h-4" /> : <Instagram className="w-4 h-4" />}
                    </a>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900">What Our Clients Say</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-8 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} className="w-4 h-4 fill-orange-400 text-orange-400" />)}
                </div>
                <p className="text-gray-700 leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-orange-500 flex items-center justify-center text-white text-sm font-bold">{t.initials}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-violet-50 via-white to-orange-50 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/80 border border-violet-200 text-violet-700 text-sm font-semibold shadow-sm backdrop-blur-sm mb-6">
            <Sparkles className="w-4 h-4" /> AI-Powered
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 text-gray-900">
            Chat with Our <span className="gradient-text">AI Architect</span>
          </h2>
          <p className="text-gray-500 max-w-2xl mx-auto text-lg mb-8">
            Not sure where to start? Our AI Architect can plan your project, estimate costs, and even review any link you share — instantly.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button onClick={() => setChatOpen(true)} className="rounded-full bg-gradient-to-r from-violet-600 to-orange-500 hover:opacity-90 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-violet-500/20 transition-all hover:scale-105">
              <Sparkles className="w-5 h-5 mr-2" /> Start AI Chat <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button onClick={openWhatsApp} variant="outline" className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-6 text-lg font-semibold">
              <MessageSquare className="w-5 h-5 mr-2" /> Talk to Human
            </Button>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 mb-4">Talk to Us Today</h2>
          <p className="text-gray-500 text-lg mb-8">Let's turn your idea into a product users love. Start with a free strategy call.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            <a href="mailto:hello@makemyapp.co" className="p-4 rounded-2xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors flex flex-col items-center gap-2">
              <Mail className="w-5 h-5 text-orange-500" /><span className="text-sm font-medium">hello@makemyapp.co</span>
            </a>
            <a href="https://api.whatsapp.com/send?phone=919242424232" target="_blank" rel="noopener noreferrer" className="p-4 rounded-2xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors flex flex-col items-center gap-2">
              <Phone className="w-5 h-5 text-green-600" /><span className="text-sm font-medium">+91 92424 24232</span>
            </a>
            <a href="https://makemyapp.qviq.io/" target="_blank" rel="noopener noreferrer" className="p-4 rounded-2xl border border-gray-200 hover:border-violet-300 hover:bg-violet-50 transition-colors flex flex-col items-center gap-2">
              <Globe className="w-5 h-5 text-violet-600" /><span className="text-sm font-medium">makemyapp.qviq.io</span>
            </a>
          </div>
          <Button onClick={openCalendly} className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 py-6 text-lg font-semibold shadow-lg shadow-orange-500/20">
            Book a Free Strategy Call <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Instagram Reels (3x3) */}
      <InstagramReels />

      {/* Footer */}
      <footer className="bg-white text-gray-600 pt-12 pb-8 relative border-t border-gray-100">
        <div className="absolute top-0 left-0 right-0 h-[2px] footer-gradient-border" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            <div>
              <img src="/makemyapp-logo.png" alt="MakeMyApp" className="h-12 w-auto object-contain mb-4" style={{ maxWidth: 200 }} />
              <p className="text-sm leading-relaxed mb-4 text-gray-500">Full-stack agency for websites, mobile apps & custom software solutions.</p>
              <p className="text-sm font-semibold text-gray-900 mb-2">Follow Us</p>
              <div className="flex items-center gap-3">
                <a href="https://www.instagram.com/makemyapp.co/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-orange-500 hover:text-white transition-all"><Instagram className="w-4 h-4" /></a>
                <a href="https://makemyapp.qviq.io/" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-orange-500 hover:text-white transition-all"><Globe className="w-4 h-4" /></a>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {NAV.map((l) => (
                  <li key={l.id}><button onClick={() => scrollTo(l.id)} className="text-sm text-gray-600 hover:text-orange-500 transition-colors">{l.label}</button></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Services</h4>
              <ul className="space-y-2">
                {SERVICES.map((s) => <li key={s.title} className="text-sm text-gray-600">{s.title}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-3">
                <li><a href="mailto:hello@makemyapp.co" className="text-sm text-gray-600 hover:text-orange-500 flex items-center gap-2"><Mail className="w-4 h-4" /> hello@makemyapp.co</a></li>
                <li><a href="https://api.whatsapp.com/send?phone=919242424232" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-orange-500 flex items-center gap-2"><Phone className="w-4 h-4" /> +91 92424 24232</a></li>
                <li><a href="https://makemyapp.qviq.io/" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-600 hover:text-orange-500 flex items-center gap-2"><Globe className="w-4 h-4" /> makemyapp.qviq.io</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-xs text-gray-400">© 2026 Make My App. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Scroll to top */}
      <AnimatePresence>
        {showTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-24 right-8 z-40 w-11 h-11 rounded-full bg-gray-800 text-white shadow-lg hover:bg-gray-700 flex items-center justify-center">
            <ChevronUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating chat button */}
      <button onClick={() => setChatOpen(true)}
        className="fixed bottom-8 right-8 z-50 w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all group"
        style={{ background: "linear-gradient(135deg, #FBBF24, #F59E0B, #D97706)", animation: "chatBotPulse 2s ease-in-out infinite" }}
        title="Chat with AI Architect">
        <MessageSquare className="w-7 h-7 text-white" />
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
          <span className="text-[10px] text-white font-bold">1</span>
        </span>
      </button>

      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default Index;
