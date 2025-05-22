import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  try {
    // 1) Validate the shared secret
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    const SECRET = Deno.env.get("SHARED_SECRET");
    if (!key || key !== SECRET) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: invalid shared secret" }),
        { status: 401 }
      );
    }
    
    const payload = await req.json();
    console.log("Received payload:", payload);
    if (payload.eventType !== "Order") return new Response(null, { status: 204 });

    const profile = {
      email: payload.data.payer.email,
      full_name: `${payload.data.items[0].user.firstName || ""} ${payload.data.items[0].user.lastName || ""}`,
      phone: payload.data.items[0].customFields.find((field) => field.name === "Numéro de téléphone\t")?.answer,
      uni_year: payload.data.items[0].customFields.find((field) => field.name === "Année (1A/L1, etc.)")?.answer,
    }

    const { error } = await supabaseAdmin
      .from("members")
      .insert([profile]);
    
    console.log("Profile inserted:", profile);

    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
