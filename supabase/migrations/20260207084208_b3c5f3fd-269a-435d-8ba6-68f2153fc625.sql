-- Add subscription date tracking columns to racklerush_businesses
ALTER TABLE public.racklerush_businesses
ADD COLUMN subscription_started_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN subscription_ends_at TIMESTAMP WITH TIME ZONE;

-- Add payment_status tracking for churn analysis
-- Already exists but let's add last_payment_at for better tracking
ALTER TABLE public.racklerush_businesses
ADD COLUMN last_payment_at TIMESTAMP WITH TIME ZONE;

-- Create a view to calculate subscription metrics for admin dashboard
CREATE OR REPLACE FUNCTION public.get_admin_subscription_metrics()
RETURNS TABLE(
  active_subscriptions bigint,
  churned_subscriptions bigint,
  churn_rate numeric,
  avg_subscription_days numeric,
  expiring_soon bigint
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH subscription_stats AS (
    SELECT 
      COUNT(*) FILTER (WHERE subscription_tier != 'Spark' AND (subscription_ends_at IS NULL OR subscription_ends_at > now())) as active_paid,
      COUNT(*) FILTER (WHERE subscription_tier = 'Spark' AND last_payment_at IS NOT NULL) as churned,
      COUNT(*) FILTER (WHERE subscription_ends_at IS NOT NULL AND subscription_ends_at BETWEEN now() AND now() + INTERVAL '7 days') as expiring_7_days
    FROM public.racklerush_businesses
  )
  SELECT 
    active_paid as active_subscriptions,
    churned as churned_subscriptions,
    CASE WHEN (active_paid + churned) > 0 
      THEN ROUND((churned::numeric / (active_paid + churned)::numeric) * 100, 2)
      ELSE 0 
    END as churn_rate,
    COALESCE(
      (SELECT AVG(EXTRACT(EPOCH FROM (COALESCE(subscription_ends_at, now()) - subscription_started_at)) / 86400)
       FROM public.racklerush_businesses 
       WHERE subscription_started_at IS NOT NULL), 
      0
    ) as avg_subscription_days,
    expiring_7_days as expiring_soon
  FROM subscription_stats;
$$;

-- Create function to get detailed business data for admin
CREATE OR REPLACE FUNCTION public.get_admin_business_details()
RETURNS TABLE(
  id uuid,
  name text,
  slug text,
  subscription_tier subscription_tier,
  referral_count_total integer,
  contest_count_total integer,
  currency text,
  created_at timestamp with time zone,
  subscription_started_at timestamp with time zone,
  subscription_ends_at timestamp with time zone,
  payment_status text,
  last_payment_at timestamp with time zone,
  days_until_expiry integer,
  user_email text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    b.id,
    b.name,
    b.slug,
    b.subscription_tier,
    b.referral_count_total,
    b.contest_count_total,
    b.currency,
    b.created_at,
    b.subscription_started_at,
    b.subscription_ends_at,
    b.payment_status,
    b.last_payment_at,
    CASE 
      WHEN b.subscription_ends_at IS NOT NULL 
      THEN EXTRACT(DAY FROM (b.subscription_ends_at - now()))::integer
      ELSE NULL 
    END as days_until_expiry,
    u.email as user_email
  FROM public.racklerush_businesses b
  LEFT JOIN auth.users u ON b.user_id = u.id
  ORDER BY b.created_at DESC;
$$;

-- Create function to get user accounts overview
CREATE OR REPLACE FUNCTION public.get_admin_user_accounts()
RETURNS TABLE(
  user_id uuid,
  email text,
  created_at timestamp with time zone,
  business_count bigint,
  total_referrals bigint,
  total_contests bigint,
  highest_tier text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    u.id as user_id,
    u.email,
    u.created_at,
    COUNT(DISTINCT b.id) as business_count,
    COALESCE(SUM(b.referral_count_total), 0) as total_referrals,
    COALESCE(SUM(b.contest_count_total), 0) as total_contests,
    MAX(
      CASE b.subscription_tier
        WHEN 'Velocity' THEN 'Velocity'
        WHEN 'Growth' THEN 'Growth'
        ELSE 'Spark'
      END
    ) as highest_tier
  FROM auth.users u
  LEFT JOIN public.racklerush_businesses b ON u.id = b.user_id
  GROUP BY u.id, u.email, u.created_at
  ORDER BY u.created_at DESC;
$$;

-- Create function to get monthly growth stats
CREATE OR REPLACE FUNCTION public.get_admin_monthly_growth()
RETURNS TABLE(
  month text,
  new_businesses bigint,
  new_referrals bigint,
  revenue numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  WITH months AS (
    SELECT generate_series(
      date_trunc('month', now() - INTERVAL '5 months'),
      date_trunc('month', now()),
      '1 month'::interval
    ) as month_start
  )
  SELECT 
    TO_CHAR(m.month_start, 'Mon YYYY') as month,
    COALESCE(COUNT(DISTINCT b.id), 0) as new_businesses,
    COALESCE(SUM(b.referral_count_total), 0) as new_referrals,
    COALESCE(SUM(p.amount), 0) as revenue
  FROM months m
  LEFT JOIN public.racklerush_businesses b 
    ON date_trunc('month', b.created_at) = m.month_start
  LEFT JOIN public.racklerush_payments p 
    ON date_trunc('month', p.created_at) = m.month_start AND p.status = 'successful'
  GROUP BY m.month_start
  ORDER BY m.month_start;
$$;