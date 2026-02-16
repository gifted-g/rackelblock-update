import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const apiKey = req.headers.get("x-api-key");
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "Missing x-api-key header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { referral_code, contest_id } = body;

    if (!referral_code) {
      return new Response(
        JSON.stringify({ error: "Missing referral_code in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Validate the API key and get the business
    const { data: business, error: businessError } = await supabase
      .from("racklerush_businesses")
      .select("id, name")
      .eq("api_key", apiKey)
      .maybeSingle();

    if (businessError || !business) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build the query for finding the participant
    let participantQuery = supabase
      .from("racklerush_participants")
      .select(`
        id,
        referral_code,
        referral_count,
        contest_id,
        racklerush_contests!inner(business_id)
      `)
      .eq("referral_code", referral_code)
      .eq("joined_contest", true)
      .eq("racklerush_contests.business_id", business.id);

    // If contest_id provided, filter by it
    if (contest_id) {
      participantQuery = participantQuery.eq("contest_id", contest_id);
    }

    const { data: participant, error: participantError } = await participantQuery.maybeSingle();

    if (participantError) {
      console.error("Participant query error:", participantError);
      return new Response(
        JSON.stringify({ error: "Failed to find participant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!participant) {
      return new Response(
        JSON.stringify({ error: "Referral code not found or not active for this business" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Increment the referral count
    const { error: updateError } = await supabase
      .from("racklerush_participants")
      .update({ referral_count: participant.referral_count + 1 })
      .eq("id", participant.id);

    if (updateError) {
      console.error("Update error:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to increment referral count" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        referral_code: participant.referral_code,
        new_count: participant.referral_count + 1,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
