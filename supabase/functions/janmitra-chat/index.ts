// JanMitra — conversational AI assistant for JanSetu AI
// Streams role-aware responses (citizen / worker / authority) in EN / HI / Hinglish.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type Role = "citizen" | "worker" | "authority";

const ROLE_PROMPTS: Record<Role, string> = {
  citizen: `You are JanMitra (जनमित्र), the friendly AI civic companion inside the JanSetu AI citizen app.
Help the user report civic issues (potholes, garbage, drainage, streetlight, water leak, sewage, road damage), track complaint status, find nearby issues, and understand next steps.
Be warm, concise, and proactive. Suggest actions like "Upload a photo", "Track complaint", "View map".
Reply in the SAME language the user uses (English, हिन्दी, or Hinglish — auto-match).
Use light emojis sparingly. Keep replies under 4 short sentences unless explaining a process.`,
  worker: `You are JanMitra, the AI field-assistant inside the JanSetu AI worker app.
Help the field worker understand assigned tasks, recommend repair steps for the issue category, remind them to upload before/after proof images, and explain AI verification outcomes (resolved / partially_resolved / not_fixed / rework).
Be direct, practical, action-oriented. Match the worker's language (EN / HI / Hinglish).`,
  authority: `You are JanMitra, the AI governance copilot inside the JanSetu AI command center.
Help the authority interpret KPIs, identify hotspot wards, slow departments, top workers, predict risk, and recommend interventions.
Be analytical, structured (use short bullet markdown when helpful), and decisive. Match user language.`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, role = "citizen", context } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sysRole = ROLE_PROMPTS[(role as Role)] ?? ROLE_PROMPTS.citizen;
    const ctxStr = context
      ? `\n\nCURRENT APP CONTEXT (read-only):\n${JSON.stringify(context).slice(0, 1500)}`
      : "";

    const actionInstr = `\n\nWhen the user clearly asks to perform an in-app action, END your reply with a single line:
[[ACTION:<name>]] where <name> is one of: report_issue | track_complaint | open_map | open_notifications | upload_repair | view_tasks | view_analytics | view_review_queue.
Otherwise omit the action tag.`;

    const systemPrompt = sysRole + ctxStr + actionInstr;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          stream: true,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "JanMitra is busy — too many requests. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("janmitra gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway failure" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("janmitra error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
