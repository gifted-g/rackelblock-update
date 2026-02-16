-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('user', 'super-admin');

-- Create user_roles table for role management (security best practice)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Super admins can view all roles"
ON public.user_roles FOR SELECT
USING (public.has_role(auth.uid(), 'super-admin'));

CREATE POLICY "Super admins can manage roles"
ON public.user_roles FOR ALL
USING (public.has_role(auth.uid(), 'super-admin'));

-- Create subscription_tier enum
CREATE TYPE public.subscription_tier AS ENUM ('Spark', 'Growth', 'Velocity');

-- Add subscription and tracking columns to racklerush_businesses
ALTER TABLE public.racklerush_businesses
ADD COLUMN subscription_tier subscription_tier NOT NULL DEFAULT 'Spark',
ADD COLUMN referral_count_total INTEGER NOT NULL DEFAULT 0,
ADD COLUMN contest_count_total INTEGER NOT NULL DEFAULT 0,
ADD COLUMN currency TEXT NOT NULL DEFAULT 'NGN',
ADD COLUMN api_access_enabled BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN payment_status TEXT DEFAULT 'pending',
ADD COLUMN flutterwave_tx_ref TEXT;

-- Create payments table for tracking transactions
CREATE TABLE public.racklerush_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.racklerush_businesses(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL,
    tier subscription_tier NOT NULL,
    tx_ref TEXT NOT NULL UNIQUE,
    flw_ref TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payments
ALTER TABLE public.racklerush_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for payments
CREATE POLICY "Business owners can view their payments"
ON public.racklerush_payments FOR SELECT
USING (EXISTS (
    SELECT 1 FROM public.racklerush_businesses b
    WHERE b.id = racklerush_payments.business_id
    AND b.user_id = auth.uid()
));

CREATE POLICY "Super admins can view all payments"
ON public.racklerush_payments FOR SELECT
USING (public.has_role(auth.uid(), 'super-admin'));

-- Function to get subscription limits
CREATE OR REPLACE FUNCTION public.get_subscription_limits(tier subscription_tier)
RETURNS TABLE(max_contests INTEGER, max_referrals INTEGER, api_access BOOLEAN)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE tier
      WHEN 'Spark' THEN 1
      WHEN 'Growth' THEN 2
      WHEN 'Velocity' THEN -1  -- unlimited
    END as max_contests,
    CASE tier
      WHEN 'Spark' THEN 50
      WHEN 'Growth' THEN 100
      WHEN 'Velocity' THEN -1  -- unlimited
    END as max_referrals,
    CASE tier
      WHEN 'Velocity' THEN true
      ELSE false
    END as api_access;
$$;

-- Function to check if business can create contest
CREATE OR REPLACE FUNCTION public.can_create_contest(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier subscription_tier;
  v_contest_count INTEGER;
  v_max_contests INTEGER;
BEGIN
  SELECT subscription_tier, contest_count_total INTO v_tier, v_contest_count
  FROM public.racklerush_businesses WHERE id = p_business_id;
  
  SELECT max_contests INTO v_max_contests FROM public.get_subscription_limits(v_tier);
  
  IF v_max_contests = -1 THEN
    RETURN true;
  END IF;
  
  RETURN v_contest_count < v_max_contests;
END;
$$;

-- Function to check if contest can accept more referrals
CREATE OR REPLACE FUNCTION public.can_accept_referral(p_business_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tier subscription_tier;
  v_referral_count INTEGER;
  v_max_referrals INTEGER;
BEGIN
  SELECT subscription_tier, referral_count_total INTO v_tier, v_referral_count
  FROM public.racklerush_businesses WHERE id = p_business_id;
  
  SELECT max_referrals INTO v_max_referrals FROM public.get_subscription_limits(v_tier);
  
  IF v_max_referrals = -1 THEN
    RETURN true;
  END IF;
  
  RETURN v_referral_count < v_max_referrals;
END;
$$;

-- Trigger to increment contest_count_total when contest is created
CREATE OR REPLACE FUNCTION public.increment_contest_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.racklerush_businesses
  SET contest_count_total = contest_count_total + 1
  WHERE id = NEW.business_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_contest_created
AFTER INSERT ON public.racklerush_contests
FOR EACH ROW
EXECUTE FUNCTION public.increment_contest_count();

-- Trigger to increment referral_count_total when participant joins
CREATE OR REPLACE FUNCTION public.increment_business_referral_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.joined_contest = true AND (OLD IS NULL OR OLD.joined_contest = false) THEN
    UPDATE public.racklerush_businesses b
    SET referral_count_total = referral_count_total + 1
    FROM public.racklerush_contests c
    WHERE c.id = NEW.contest_id AND b.id = c.business_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_participant_joined
AFTER INSERT OR UPDATE ON public.racklerush_participants
FOR EACH ROW
EXECUTE FUNCTION public.increment_business_referral_count();

-- Super admin view functions
CREATE OR REPLACE FUNCTION public.get_admin_business_overview()
RETURNS TABLE(
  id UUID,
  name TEXT,
  slug TEXT,
  subscription_tier subscription_tier,
  referral_count_total INTEGER,
  contest_count_total INTEGER,
  currency TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, name, slug, subscription_tier, referral_count_total, contest_count_total, currency, created_at
  FROM public.racklerush_businesses
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_admin_platform_stats()
RETURNS TABLE(
  total_businesses BIGINT,
  total_contests BIGINT,
  total_referrals BIGINT,
  active_contests BIGINT,
  spark_count BIGINT,
  growth_count BIGINT,
  velocity_count BIGINT,
  ngn_revenue DECIMAL,
  usd_revenue DECIMAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM public.racklerush_businesses) as total_businesses,
    (SELECT COUNT(*) FROM public.racklerush_contests) as total_contests,
    (SELECT COALESCE(SUM(referral_count_total), 0) FROM public.racklerush_businesses) as total_referrals,
    (SELECT COUNT(*) FROM public.racklerush_contests WHERE active = true AND end_date > now()) as active_contests,
    (SELECT COUNT(*) FROM public.racklerush_businesses WHERE subscription_tier = 'Spark') as spark_count,
    (SELECT COUNT(*) FROM public.racklerush_businesses WHERE subscription_tier = 'Growth') as growth_count,
    (SELECT COUNT(*) FROM public.racklerush_businesses WHERE subscription_tier = 'Velocity') as velocity_count,
    (SELECT COALESCE(SUM(amount), 0) FROM public.racklerush_payments WHERE currency = 'NGN' AND status = 'successful') as ngn_revenue,
    (SELECT COALESCE(SUM(amount), 0) FROM public.racklerush_payments WHERE currency = 'USD' AND status = 'successful') as usd_revenue;
$$;