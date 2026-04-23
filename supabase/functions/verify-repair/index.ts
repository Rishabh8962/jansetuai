import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { beforeImageUrl, afterImageUrl, category, description } = await req.json();

    if (!beforeImageUrl || !afterImageUrl) {
      return new Response(
        JSON.stringify({ error: "beforeImageUrl and afterImageUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an AI inspector for civic repair work. Compare a BEFORE image (original civic issue) with an AFTER image (worker's repair proof). Determine if the issue was actually fixed.

Be strict but fair. Look for:
- Is the repair visible in the after image?
- Is it the same location/issue?
- Is the work complete or partial?
- Any quality concerns?`;

    const userPrompt = `Compare these two images for a civic complaint.
Category: ${category || "unknown"}
Original description: ${description || "n/a"}

Image 1 = BEFORE (the reported issue).
Image 2 = AFTER (the worker's repair proof).

Verify if the repair is genuine and complete.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: beforeImageUrl } },
              { type: "image_url", image_url: { url: afterImageUrl } },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "verify_repair",
              description: "Return verification result for the repair work.",
              parameters: {
                type: "object",
                properties: {
                  status: {
                    type: "string",
                    enum: ["resolved", "partially_resolved", "not_fixed"],
                    description: "Final verification status",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence 0-1 in the verdict",
                  },
                  reasoning: {
                    type: "string",
                    description: "Short explanation of what AI observed comparing both images",
                  },
                  quality_score: {
                    type: "number",
                    description: "Quality of repair from 0 to 100",
                  },
                  recommendation: {
                    type: "string",
                    enum: ["approve", "review", "rework"],
                    description: "Recommended action for the admin",
                  },
                },
                required: ["status", "confidence", "reasoning", "quality_score", "recommendation"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "verify_repair" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(JSON.stringify({ error: "AI verification failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No verification result returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-repair error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
