-- Add referral mode toggle and custom success message fields to contests
ALTER TABLE public.racklerush_contests
ADD COLUMN IF NOT EXISTS referral_enabled boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS success_message text DEFAULT 'Thank you for joining! Share your referral link to climb the leaderboard and win!';