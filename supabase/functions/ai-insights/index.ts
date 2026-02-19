import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { action } = await req.json();

    // Fetch patient data
    const [appointmentsRes, noShowRes, predictionsRes] = await Promise.all([
      supabase.from("appointments").select("*").eq("patient_id", user.id).order("appointment_date", { ascending: false }).limit(20),
      supabase.from("no_show_scores").select("*").eq("patient_id", user.id).single(),
      supabase.from("ai_predictions").select("*").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(5),
    ]);

    const appointments = appointmentsRes.data || [];
    const noShowScore = noShowRes.data;
    const existingPredictions = predictionsRes.data || [];

    const totalAppts = appointments.length;
    const cancelledAppts = appointments.filter((a: any) => a.status === "cancelled").length;
    const completedAppts = appointments.filter((a: any) => a.status === "completed").length;
    const noShows = appointments.filter((a: any) => a.status === "no_show").length;
    const lastApptDate = appointments[0]?.appointment_date || "none";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const prompt = `You are a healthcare AI assistant. Analyze this patient's appointment data and provide personalized insights.

Patient Data:
- Total appointments: ${totalAppts}
- Completed: ${completedAppts}
- Cancelled: ${cancelledAppts}
- No-shows: ${noShows}
- Last appointment: ${lastApptDate}
- No-show risk score: ${noShowScore?.score || 0}
- Recent appointment dates: ${appointments.slice(0, 5).map((a: any) => a.appointment_date).join(", ")}
- Appointment types: ${appointments.slice(0, 5).map((a: any) => a.type || "consultation").join(", ")}

Provide a JSON response with exactly these fields:
1. "follow_up" - object with "recommended" (boolean), "urgency" ("high"/"medium"/"low"), "reason" (string), "suggested_days" (number, days until follow-up)
2. "no_show_risk" - object with "level" ("high"/"medium"/"low"), "score" (0-100), "tips" (string)
3. "optimal_times" - object with "best_day" (string), "best_time" (string), "reason" (string)
4. "health_summary" - string, 2-3 sentences summarizing their scheduling health

Return ONLY valid JSON, no markdown.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a medical scheduling AI. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "{}";

    // Parse AI response
    let insights;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      insights = JSON.parse(cleaned);
    } catch {
      insights = {
        follow_up: { recommended: true, urgency: "medium", reason: "Regular check-up recommended", suggested_days: 14 },
        no_show_risk: { level: "low", score: 15, tips: "Keep up your great attendance!" },
        optimal_times: { best_day: "Tuesday", best_time: "10:00 AM", reason: "Based on general patterns" },
        health_summary: "Your scheduling data is being analyzed. Book more appointments to get better AI insights.",
      };
    }

    // Save prediction to DB
    await supabase.from("ai_predictions").insert({
      patient_id: user.id,
      prediction_type: "comprehensive_insights",
      prediction_data: insights,
      confidence_score: 0.85,
    });

    return new Response(JSON.stringify({ insights, appointments_summary: { total: totalAppts, completed: completedAppts, cancelled: cancelledAppts, no_shows: noShows } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-insights error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
