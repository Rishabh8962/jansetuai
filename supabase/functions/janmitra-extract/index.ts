// JanMitra structured complaint extractor
// Uses Lovable AI tool-calling to convert free text into a structured complaint draft.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { text } = await req.json();
    if (!text || typeof text !== "string") {
      return new Response(JSON.stringify({ error: "text required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are JanMitra's complaint structuring engine for an Indian civic grievance system.
Convert the citizen's free-form description (English / Hindi / Hinglish) into a clean structured complaint.
Rules:
- category MUST be one of: pothole, garbage, water_leak, streetlight, drainage, road_damage, sewage, other.
- priority MUST be one of: low, medium, high, critical.
- "critical" only for life-safety / hazard / emergency keywords (fire, flooding, electric shock, gas leak, accident, collapse, injury).
- Provide a short clean title (max 60 chars).
- "reasoning" lists 2-3 short keyword-based justifications.
- "missing_info" lists fields the user should add for faster resolution (e.g., "exact landmark", "duration", "photo").
- If location landmark is mentioned (road / area / ward), put it in "location"; otherwise null.
- Keep all text concise.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        tools: [{
          type: "function",
          function: {
            name: "structure_complaint",
            description: "Return a structured civic complaint draft.",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string" },
                category: {
                  type: "string",
                  enum: ["pothole", "garbage", "water_leak", "streetlight", "drainage", "road_damage", "sewage", "other"],
                },
                category_label: { type: "string" },
                department: { type: "string" },
                priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
                location: { type: ["string", "null"] },
                summary: { type: "string", description: "1-2 sentence cleaned-up complaint description." },
                reasoning: { type: "array", items: { type: "string" } },
                missing_info: { type: "array", items: { type: "string" } },
                emergency: { type: "boolean" },
                confidence: { type: "number", description: "0-1 classification confidence" },
              },
              required: ["title", "category", "category_label", "department", "priority", "summary", "reasoning", "missing_info", "emergency", "confidence"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "structure_complaint" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("extract gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const json = await resp.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      return new Response(JSON.stringify({ error: "No structured output" }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const args = JSON.parse(call.function.arguments);

    return new Response(JSON.stringify({ draft: args }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("janmitra-extract error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
