-- Create waitlist_entries table
CREATE TABLE public.waitlist_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  queue_position INTEGER NOT NULL,
  referral_code TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  referred_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for public inserts (anyone can join the waitlist)
CREATE POLICY "Anyone can join the waitlist" 
ON public.waitlist_entries 
FOR INSERT 
WITH CHECK (true);

-- Create policy for reading own entry by email (for queue position display)
CREATE POLICY "Users can read their own entry" 
ON public.waitlist_entries 
FOR SELECT 
USING (true);

-- Create function to get next queue position
CREATE OR REPLACE FUNCTION public.get_next_queue_position()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(MAX(queue_position), 0) + 1 FROM public.waitlist_entries
$$;

-- Create function to join waitlist with automatic queue position
CREATE OR REPLACE FUNCTION public.join_waitlist(
  p_name TEXT,
  p_email TEXT,
  p_referred_by TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  name TEXT,
  email TEXT,
  queue_position INTEGER,
  referral_code TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next_position INTEGER;
  v_id UUID;
  v_referral_code TEXT;
BEGIN
  -- Get next queue position
  SELECT COALESCE(MAX(we.queue_position), 0) + 1 INTO v_next_position FROM public.waitlist_entries we;
  
  -- Insert the new entry
  INSERT INTO public.waitlist_entries (name, email, queue_position, referred_by)
  VALUES (p_name, p_email, v_next_position, p_referred_by)
  RETURNING 
    waitlist_entries.id, 
    waitlist_entries.name, 
    waitlist_entries.email, 
    waitlist_entries.queue_position, 
    waitlist_entries.referral_code
  INTO v_id, name, email, queue_position, referral_code;
  
  RETURN NEXT;
END;
$$;