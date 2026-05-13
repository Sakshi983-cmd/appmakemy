CREATE TABLE public.ai_blogs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'Industry News',
  published_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view ai blogs"
ON public.ai_blogs FOR SELECT
USING (true);

CREATE INDEX idx_ai_blogs_published ON public.ai_blogs (published_date DESC);
CREATE INDEX idx_ai_blogs_category ON public.ai_blogs (category);