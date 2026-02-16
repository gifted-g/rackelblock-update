-- Add leaderboard configuration columns to contests
ALTER TABLE public.racklerush_contests
ADD COLUMN show_referral_count boolean NOT NULL DEFAULT true,
ADD COLUMN leaderboard_limit integer NOT NULL DEFAULT 10;

-- Update the RPC function to include new fields
DROP FUNCTION IF EXISTS public.get_racklerush_active_contest(text);

CREATE OR REPLACE FUNCTION public.get_racklerush_active_contest(p_slug text)
RETURNS TABLE(
  id uuid,
  business_id uuid,
  title text,
  description text,
  prize_info text,
  end_date timestamp with time zone,
  business_name text,
  primary_color text,
  logo_url text,
  whatsapp_enabled boolean,
  whatsapp_number text,
  whatsapp_message_template text,
  show_referral_count boolean,
  leaderboard_limit integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
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
    b.logo_url,
    c.whatsapp_enabled,
    c.whatsapp_number,
    c.whatsapp_message_template,
    c.show_referral_count,
    c.leaderboard_limit
  FROM public.racklerush_contests c
  JOIN public.racklerush_businesses b ON c.business_id = b.id
  WHERE b.slug = p_slug AND c.active = true
  ORDER BY c.created_at DESC
  LIMIT 1;
$$;

-- Update leaderboard RPC to accept dynamic limit
DROP FUNCTION IF EXISTS public.get_racklerush_leaderboard(uuid);

CREATE OR REPLACE FUNCTION public.get_racklerush_leaderboard(p_contest_id uuid, p_limit integer DEFAULT 10)
RETURNS TABLE(referral_code text, referral_count integer, rank bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    referral_code,
    referral_count,
    RANK() OVER (ORDER BY referral_count DESC) as rank
  FROM public.racklerush_participants
  WHERE contest_id = p_contest_id AND joined_contest = true
  ORDER BY referral_count DESC
  LIMIT p_limit;
$$;