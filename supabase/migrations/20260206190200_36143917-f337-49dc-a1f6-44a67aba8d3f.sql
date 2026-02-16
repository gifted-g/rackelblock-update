-- Add WhatsApp redirect fields to contests table
ALTER TABLE public.racklerush_contests
ADD COLUMN whatsapp_enabled boolean NOT NULL DEFAULT false,
ADD COLUMN whatsapp_number text,
ADD COLUMN whatsapp_message_template text DEFAULT 'Hi! I just entered your contest. Here are my details:

{participant_details}

My referral link: {referral_link}';