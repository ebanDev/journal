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
    const { email } = await req.json();

    if (typeof email !== "string" || !email.trim()) {
      return new Response(JSON.stringify({ error: "invalid_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const targetEmail = email.trim().toLowerCase();

    // 1) Verify membership
    const { data: members, error: selErr } = await supabaseAdmin
      .from("members")
      .select("user_id")
      .eq("email", targetEmail)
      .limit(1);

    if (selErr) throw selErr;
    if (!members?.length) {
      return new Response(JSON.stringify({ error: "user_not_found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // 2) Decide which OTP flow to trigger based on whether the member already has an auth.user
  
    const otpType = members[0].user_id ? "email" : "invite";

    if (otpType === "email") {
      const { error: otpErr } = await supabaseAdmin.auth.signInWithOtp({
        email: targetEmail,
        options: {
          shouldCreateUser: false,
        },
      });

      if (otpErr) throw otpErr;
    } else {
      const { error: inviteErr } = await supabaseAdmin.auth.admin.inviteUserByEmail(targetEmail);

      if (inviteErr) throw inviteErr;
    }

    return new Response(JSON.stringify({ otpType }), {
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
