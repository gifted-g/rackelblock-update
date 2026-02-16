-- Drop and recreate the function with new return type
DROP FUNCTION IF EXISTS public.get_racklerush_active_contest(text);

CREATE OR REPLACE FUNCTION public.get_racklerush_active_contest(p_slug text)
 RETURNS TABLE(id uuid, business_id uuid, title text, description text, prize_info text, end_date timestamp with time zone, business_name text, primary_color text, logo_url text, whatsapp_enabled boolean, whatsapp_number text, whatsapp_message_template text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    c.whatsapp_message_template
  FROM public.racklerush_contests c
  JOIN public.racklerush_businesses b ON c.business_id = b.id
  WHERE b.slug = p_slug AND c.active = true
  ORDER BY c.created_at DESC
  LIMIT 1;
$function$;