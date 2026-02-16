-- Create enum for field types
CREATE TYPE public.racklerush_field_type AS ENUM ('text', 'number', 'email', 'phone', 'url');

-- Create businesses table
CREATE TABLE public.racklerush_businesses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  api_key UUID NOT NULL DEFAULT gen_random_uuid(),
  primary_color TEXT DEFAULT '#10b981',
  logo_url TEXT,
  custom_domain TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contests table
CREATE TABLE public.racklerush_contests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID REFERENCES public.racklerush_businesses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  prize_info TEXT NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contest fields table
CREATE TABLE public.racklerush_contest_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID REFERENCES public.racklerush_contests(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  field_type public.racklerush_field_type NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create participants table
CREATE TABLE public.racklerush_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contest_id UUID REFERENCES public.racklerush_contests(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  referral_code TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(4), 'hex'),
  referred_by_code TEXT,
  joined_contest BOOLEAN NOT NULL DEFAULT false,
  referral_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(contest_id, email)
);

-- Create participant data table for custom field values
CREATE TABLE public.racklerush_participant_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  participant_id UUID REFERENCES public.racklerush_participants(id) ON DELETE CASCADE NOT NULL,
  field_id UUID REFERENCES public.racklerush_contest_fields(id) ON DELETE CASCADE NOT NULL,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(participant_id, field_id)
);

-- Enable RLS on all tables
ALTER TABLE public.racklerush_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.racklerush_contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.racklerush_contest_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.racklerush_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.racklerush_participant_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for businesses
CREATE POLICY "Users can view their own businesses"
  ON public.racklerush_businesses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own businesses"
  ON public.racklerush_businesses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own businesses"
  ON public.racklerush_businesses FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own businesses"
  ON public.racklerush_businesses FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for contests
CREATE POLICY "Business owners can view their contests"
  ON public.racklerush_contests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.racklerush_businesses
      WHERE id = business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active contests"
  ON public.racklerush_contests FOR SELECT
  USING (active = true);

CREATE POLICY "Business owners can create contests"
  ON public.racklerush_contests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.racklerush_businesses
      WHERE id = business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can update their contests"
  ON public.racklerush_contests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.racklerush_businesses
      WHERE id = business_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Business owners can delete their contests"
  ON public.racklerush_contests FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.racklerush_businesses
      WHERE id = business_id AND user_id = auth.uid()
    )
  );

-- RLS Policies for contest fields
CREATE POLICY "Anyone can view contest fields for active contests"
  ON public.racklerush_contest_fields FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.racklerush_contests
      WHERE id = contest_id AND active = true
    )
  );

CREATE POLICY "Business owners can manage contest fields"
  ON public.racklerush_contest_fields FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.racklerush_contests c
      JOIN public.racklerush_businesses b ON c.business_id = b.id
      WHERE c.id = contest_id AND b.user_id = auth.uid()
    )
  );

-- RLS Policies for participants
CREATE POLICY "Anyone can create participants"
  ON public.racklerush_participants FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view participants for leaderboard"
  ON public.racklerush_participants FOR SELECT
  USING (true);

CREATE POLICY "Participants can update their own entry"
  ON public.racklerush_participants FOR UPDATE
  USING (true);

-- RLS Policies for participant data
CREATE POLICY "Anyone can create participant data"
  ON public.racklerush_participant_data FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Business owners can view participant data"
  ON public.racklerush_participant_data FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.racklerush_participants p
      JOIN public.racklerush_contests c ON p.contest_id = c.id
      JOIN public.racklerush_businesses b ON c.business_id = b.id
      WHERE p.id = participant_id AND b.user_id = auth.uid()
    )
  );

-- Function to increment referral count when someone uses a referral code
CREATE OR REPLACE FUNCTION public.increment_referral_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referred_by_code IS NOT NULL THEN
    UPDATE public.racklerush_participants
    SET referral_count = referral_count + 1
    WHERE referral_code = NEW.referred_by_code
    AND contest_id = NEW.contest_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to auto-increment referral count
CREATE TRIGGER on_participant_created
  AFTER INSERT ON public.racklerush_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_referral_count();

-- Function to get business by slug (public access)
CREATE OR REPLACE FUNCTION public.get_racklerush_business_by_slug(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  primary_color TEXT,
  logo_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, slug, primary_color, logo_url
  FROM public.racklerush_businesses
  WHERE slug = p_slug;
$$;

-- Function to get active contest by business slug
CREATE OR REPLACE FUNCTION public.get_racklerush_active_contest(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  business_id UUID,
  title TEXT,
  description TEXT,
  prize_info TEXT,
  end_date TIMESTAMP WITH TIME ZONE,
  business_name TEXT,
  primary_color TEXT,
  logo_url TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    c.id, 
    c.business_id, 
    c.title, 
    c.description, 
    c.prize_info, 
    c.end_date,
    b.name as business_name,
    b.primary_color,
    b.logo_url
  FROM public.racklerush_contests c
  JOIN public.racklerush_businesses b ON c.business_id = b.id
  WHERE b.slug = p_slug AND c.active = true
  ORDER BY c.created_at DESC
  LIMIT 1;
$$;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION public.get_racklerush_leaderboard(p_contest_id UUID)
RETURNS TABLE (
  referral_code TEXT,
  referral_count INTEGER,
  rank BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    referral_code,
    referral_count,
    RANK() OVER (ORDER BY referral_count DESC) as rank
  FROM public.racklerush_participants
  WHERE contest_id = p_contest_id AND joined_contest = true
  ORDER BY referral_count DESC
  LIMIT 10;
$$;

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_racklerush_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply updated_at triggers
CREATE TRIGGER update_racklerush_businesses_updated_at
  BEFORE UPDATE ON public.racklerush_businesses
  FOR EACH ROW EXECUTE FUNCTION public.update_racklerush_updated_at();

CREATE TRIGGER update_racklerush_contests_updated_at
  BEFORE UPDATE ON public.racklerush_contests
  FOR EACH ROW EXECUTE FUNCTION public.update_racklerush_updated_at();