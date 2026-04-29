// JanSetu AI — Multi-layer civic complaint classifier
// Layer 1: rule-based keyword preprocessing (emergency / urgency / sentiment)
// Layer 2: LLM classification via Lovable AI Gateway (Gemini 2.5 Flash)
// Layer 3: context-aware re-ranking, calibrated confidence, explainability

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
  "water_leakage",
  "road_damage",
  "sewage_overflow",
  "other",
] as const;
type Category = typeof CATEGORIES[number];

const DEPARTMENT_MAP: Record<Category, string> = {
  pothole: "Road Maintenance",
  garbage: "Sanitation",
  drainage: "Drainage & Sewerage",
  streetlight: "Electricity",
  water_leakage: "Water Supply",
  road_damage: "Road Maintenance",
  sewage_overflow: "Drainage & Sewerage",
  other: "General Administration",
};

// Layer-1 keyword tables
const KEYWORDS: Record<Category, string[]> = {
  pothole: ["pothole", "gaddha", "hole in road", "crater"],
  garbage: ["garbage", "trash", "kachra", "waste", "not collected", "dump", "rubbish", "stink"],
  drainage: ["drain", "blocked", "clogged", "nala", "gutter", "rain water", "waterlogged"],
  streetlight: ["streetlight", "street light", "lamp", "dark", "bulb", "no light", "pole light"],
  water_leakage: ["leak", "leaking", "pipe burst", "water flow", "no water", "tap", "supply"],
  road_damage: ["road damage", "broken road", "crack", "alligator", "sinking road", "edge"],
  sewage_overflow: ["sewage", "sewer", "overflow", "manhole", "drain overflow", "stinking water"],
  other: [],
};

const EMERGENCY = [
  "fire", "burning", "electric shock", "shock", "live wire", "exposed wire",
  "accident", "collapse", "collapsed", "injured", "bleeding", "gas leak",
  "explosion", "drowning", "trapped",
];
const URGENCY = ["urgent", "immediately", "asap", "danger", "dangerous", "critical", "emergency", "hazard", "risky", "kids", "children", "school", "hospital"];
const NEGATIVE = ["worst", "horrible", "pathetic", "useless", "frustrated", "angry", "ignored", "disgusting", "filthy", "many days", "weeks", "months"];
const POSITIVE = ["thanks", "thank you", "good", "appreciate", "resolved"];

interface RuleHit {
  category?: Category;
  matchedKeywords: string[];
  isEmergency: boolean;
  urgencyHits: string[];
  sentiment: "negative" | "neutral" | "positive";
}

function ruleLayer(text: string): RuleHit {
  const t = (text || "").toLowerCase();
  const matchedKeywords: string[] = [];
  const scores: Partial<Record<Category, number>> = {};
  for (const cat of CATEGORIES) {
    for (const kw of KEYWORDS[cat]) {
      if (t.includes(kw)) {
        matchedKeywords.push(kw);
        scores[cat] = (scores[cat] || 0) + (kw.length > 5 ? 2 : 1);
      }
    }
  }
  let topCat: Category | undefined;
  let topScore = 0;
  for (const [c, s] of Object.entries(scores)) {
    if ((s as number) > topScore) { topScore = s as number; topCat = c as Category; }
  }

  const isEmergency = EMERGENCY.some(k => t.includes(k));
  const urgencyHits = URGENCY.filter(k => t.includes(k));

  let sentiment: RuleHit["sentiment"] = "neutral";
  const neg = NEGATIVE.filter(k => t.includes(k)).length;
  const pos = POSITIVE.filter(k => t.includes(k)).length;
  if (neg > pos && neg > 0) sentiment = "negative";
  else if (pos > neg && pos > 0) sentiment = "positive";

  return { category: topCat, matchedKeywords, isEmergency, urgencyHits, sentiment };
}

function calibrate(raw: number): "low" | "medium" | "high" {
  if (raw >= 0.8) return "high";
  if (raw >= 0.5) return "medium";
  return "low";
}

function priorityFromSignals(severity: "low" | "medium" | "high", rule: RuleHit): "low" | "medium" | "high" | "critical" {
  if (rule.isEmergency) return "critical";
  if (severity === "high" && (rule.urgencyHits.length > 0 || rule.sentiment === "negative")) return "critical";
  if (severity === "high") return "high";
  if (severity === "medium" && rule.urgencyHits.length > 0) return "high";
  if (severity === "medium") return "medium";
  return "low";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const text: string = (body.text || body.description || "").toString().slice(0, 2000);
    const imageUrl: string | undefined = body.imageUrl;
    const lat: number | undefined = body.lat;
    const lng: number | undefined = body.lng;

    if (!text && !imageUrl) {
      return new Response(JSON.stringify({ error: "text or imageUrl is required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Layer 1: rule-based preprocessing
    const rule = ruleLayer(text);

    // ===== Layer 2: LLM classification (text + optional image)
    const userContent: any[] = [];
    if (imageUrl) {
      userContent.push({ type: "image_url", image_url: { url: imageUrl } });
    }
    userContent.push({
      type: "text",
      text: `Citizen complaint text: "${text || "(no text — analyse image)"}".
Rule-based hints: keywords=${JSON.stringify(rule.matchedKeywords)}, urgency=${JSON.stringify(rule.urgencyHits)}, emergency=${rule.isEmergency}, sentiment=${rule.sentiment}.
Classify the civic issue.`,
    });

    const sys = `You are JanSetu AI's civic-issue classifier for Indian municipal grievances.
Pick exactly one category from the allowed list. Return concise factual fields.
- severity: low (cosmetic), medium (daily impact), high (safety hazard / public health risk).
- title: 3–7 words.
- description: 1–2 factual sentences suitable for a complaint record.
- factors: 2–4 short bullet phrases explaining WHY (mention keywords, visual cues, urgency).`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: userContent },
        ],
        tools: [{
          type: "function",
          function: {
            name: "classify_civic_issue",
            description: "Return classified civic issue with explainability factors.",
            parameters: {
              type: "object",
              properties: {
                category: { type: "string", enum: CATEGORIES as unknown as string[] },
                confidence: { type: "number", description: "0–1 confidence score" },
                severity: { type: "string", enum: ["low", "medium", "high"] },
                title: { type: "string" },
                description: { type: "string" },
                factors: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 5 },
              },
              required: ["category", "confidence", "severity", "title", "description", "factors"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "classify_civic_issue" } },
      }),
    });

    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error:", aiResp.status, t);
      if (aiResp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiResp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Lovable workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "AI gateway failure" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await aiResp.json();
    const tc = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!tc) {
      return new Response(JSON.stringify({ error: "AI did not return structured output" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const args = JSON.parse(tc.function.arguments);

    let category: Category = CATEGORIES.includes(args.category) ? args.category : "other";
    let confidence: number = Math.max(0, Math.min(1, Number(args.confidence) || 0.7));
    let severity: "low" | "medium" | "high" = ["low", "medium", "high"].includes(args.severity) ? args.severity : "medium";

    // ===== Layer 3: context-aware adjustment
    let confidenceBoost = 0;
    const adjustments: string[] = [];

    if (rule.category && rule.category === category) {
      confidenceBoost += 0.08;
      adjustments.push(`Rule layer agrees (${rule.matchedKeywords.slice(0, 3).join(", ")})`);
    } else if (rule.category && rule.category !== category && rule.matchedKeywords.length >= 2) {
      // Strong textual signal disagrees with model — slight downweight
      confidenceBoost -= 0.1;
      adjustments.push(`Rule layer suggests "${rule.category}" — reduced confidence`);
    }
    if (imageUrl && text && text.length > 20) {
      confidenceBoost += 0.04;
      adjustments.push("Multi-modal evidence (text + image)");
    }
    if (rule.isEmergency) {
      severity = "high";
      adjustments.push("Emergency keyword detected — severity escalated");
    } else if (rule.urgencyHits.length > 0 && severity === "low") {
      severity = "medium";
      adjustments.push(`Urgency cues: ${rule.urgencyHits.slice(0, 2).join(", ")}`);
    }

    confidence = Math.max(0.1, Math.min(0.99, confidence + confidenceBoost));
    const confidenceBand = calibrate(confidence);
    const priority = priorityFromSignals(severity, rule);

    const factors: string[] = Array.isArray(args.factors) ? args.factors.slice(0, 5) : [];
    if (rule.matchedKeywords.length > 0) {
      factors.unshift(`Keywords detected: ${rule.matchedKeywords.slice(0, 4).join(", ")}`);
    }

    const explanation = `Classified as ${category.replace("_", " ")} with ${(confidence * 100).toFixed(0)}% confidence. `
      + (rule.matchedKeywords.length ? `Driven by terms like ${rule.matchedKeywords.slice(0, 3).map(k => `"${k}"`).join(", ")}. ` : "")
      + (rule.isEmergency ? "Emergency signals present — routed as critical. " : "")
      + (rule.sentiment === "negative" ? "Citizen sentiment is negative." : "");

    const needsConfirmation = confidence < 0.5;

    return new Response(JSON.stringify({
      category,
      department: DEPARTMENT_MAP[category],
      confidence,
      confidenceBand, // "low" | "medium" | "high"
      severity,
      priority,
      title: args.title || "Civic issue reported",
      description: args.description || "",
      explanation,
      factors,
      keywords: rule.matchedKeywords,
      isEmergency: rule.isEmergency,
      urgencyHits: rule.urgencyHits,
      sentiment: rule.sentiment,
      adjustments,
      needsConfirmation,
      modelLayers: ["rule-preprocess", "gemini-2.5-flash", "context-rerank"],
      location: lat && lng ? { lat, lng } : null,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e) {
    console.error("classify-complaint error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
