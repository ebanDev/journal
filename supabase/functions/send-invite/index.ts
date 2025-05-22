import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";
import { corsHeaders } from '../_shared/cors.ts'

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const { email, redirectTo } = await req.json();

    // 1) Verify membership
    const { data: members, error: selErr } = await supabaseAdmin
      .from("members")
      .select("user_id")
      .eq("email", email)
      .limit(1);

    if (selErr) throw selErr;
    if (!members?.length) {
      return new Response(JSON.stringify({ error: "user_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 2) Check if user already exists in auth system by looking if the members has a user_id
    // If user_id is null, it means the user has linked their email to the auth system
  
    console.log(Deno.env.get("SUPABASE_REDIRECT_URL"));
    // If user exists, send login magic link
    if (members[0].user_id) {
      // User exists, send login magic link
      const { data: inviteData, error: inviteErr } =
        await supabaseAdmin.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: redirectTo,
            shouldCreateUser: false,
          },
        });

      if (inviteErr) throw inviteErr;
      return new Response(JSON.stringify(inviteData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 3) Send invite link if user does not exist
    const { data: inviteData, error: inviteErr } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        emailRedirectTo: redirectTo,
      });

    if (inviteErr) throw inviteErr;
    return new Response(JSON.stringify(inviteData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Invite error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
