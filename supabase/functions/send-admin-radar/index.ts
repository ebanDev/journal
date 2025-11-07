import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

// Admin client using service role key
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

// Fixed admin submitter id provided in the request description
const ADMIN_SUBMITTER_ID = "bbbe421f-b26c-4a96-85fb-ec655e494b04";

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    // Validate shared secret from query param `key` or header `x-radar-secret`
    const url = new URL(req.url);
    const providedKey = url.searchParams.get("key") || req.headers.get("x-radar-secret") || "";
    const expectedKey = Deno.env.get("RADAR_SECRET") || "";

    if (!expectedKey || providedKey !== expectedKey) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid shared secret" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Expect a simple JSON body with the provided fields
    // { title?: string, url: string, description?: string, image?: string, source?: string }
    const body = await req.json().catch(() => ({}));
    const title = typeof body?.title === "string" ? body.title : "";
    const urlStr = typeof body?.url === "string" ? body.url.trim() : "";
    const description = typeof body?.description === "string" ? body.description : "";
    const cover = typeof body?.image === "string" ? body.image : "";
    const source = typeof body?.source === "string" ? body.source : "";

    if (!urlStr) {
      return new Response(
        JSON.stringify({ error: "Missing required field: url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build payload in the normal format
    const payload = {
      title,
      type: "article" as const,
      url: urlStr,
      description,
      cover,
      source,
      submitter_id: ADMIN_SUBMITTER_ID,
      anonymous_id: null as string | null,
      status: "approved" as const,
    };

    // Insert as admin to bypass RLS
    const { data: inserted, error } = await supabaseAdmin
      .from("laveille")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Error inserting radar entry:", error);
      return new Response(
        JSON.stringify({ error: "Insert failed", details: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: inserted?.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("send-admin-radar error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: err?.message ?? String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
