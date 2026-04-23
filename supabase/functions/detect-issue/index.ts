// Edge function: detect civic issue from an uploaded image using Lovable AI (Gemini Vision)
// Public function (verify_jwt = false) - safe because LOVABLE_API_KEY is server-side only.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const CATEGORIES = [
  "pothole",
  "garbage",
  "drainage",
  "streetlight",
  "water_leak",
  "road_damage",
  "sewage_overflow",
  "other",
] as const;

const DEPARTMENT_MAP: Record<string, string> = {
  pothole: "Road Maintenance",
  garbage: "Sanitation",
  drainage: "Drainage & Sewerage",
  streetlight: "Electricity",
  water_leak: "Water Supply",
  road_damage: "Road Maintenance",
  sewage_overflow: "Drainage & Sewerage",
  other: "General Administration",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl, imageBase64 } = await req.json();
    if (!imageUrl && !imageBase64) {
      return new Response(
        JSON.stringify({ error: "imageUrl or imageBase64 is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const imageContent = imageBase64
      ? { type: "image_url", image_url: { url: imageBase64 } }
      : { type: "image_url", image_url: { url: imageUrl } };

    const systemPrompt = `You are a civic issue classifier for a smart-city platform called JanSetu AI.
Look at the image and identify the most likely civic problem visible.
Always pick exactly one category from the allowed list.
Severity: low (cosmetic, low traffic), medium (noticeable, daily impact), high (safety hazard / public health risk).
Be concise and factual. If the image shows no civic issue, use "other" with low confidence.`;

    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
                imageContent,
                {
                  type: "text",
                  text: "Classify this civic issue.",
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "report_civic_issue",
                description: "Return classified civic issue details.",
                parameters: {
                  type: "object",
                  properties: {
                    category: {
                      type: "string",
                      enum: CATEGORIES as unknown as string[],
                    },
                    confidence: {
                      type: "number",
                      description: "0-1 confidence score",
                    },
                    severity: {
                      type: "string",
                      enum: ["low", "medium", "high"],
                    },
                    title: {
                      type: "string",
                      description: "Short 3-7 word title",
                    },
                    description: {
                      type: "string",
                      description: "1-2 sentence factual description for citizen complaint",
                    },
                  },
                  required: ["category", "confidence", "severity", "title", "description"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "report_civic_issue" } },
        }),
      },
    );

    if (!aiResponse.ok) {
      const text = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, text);
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(JSON.stringify({ error: "AI gateway failure" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResponse.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "AI did not return structured output" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const args = JSON.parse(toolCall.function.arguments);
    const category = CATEGORIES.includes(args.category) ? args.category : "other";

    return new Response(
      JSON.stringify({
        category,
        confidence: Math.max(0, Math.min(1, Number(args.confidence) || 0.7)),
        severity: args.severity || "medium",
        title: args.title || "Civic issue reported",
        description: args.description || "",
        department: DEPARTMENT_MAP[category],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("detect-issue error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
