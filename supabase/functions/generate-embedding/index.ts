import { createClient } from "https://esm.sh/@supabase/supabase-js@2?target=deno";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const model = new Supabase.ai.Session('gte-small')

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()
  console.log('Received payload:', payload, req)
  const { content, id } = payload.record

  // Generate embedding.
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  })

  // Store in database.
  const { error } = await supabase
    .from('articles')
    .update({ embedding: JSON.stringify(embedding) })
    .eq('id', id)
  if (error) console.warn(error.message)

  return new Response('ok')
})
