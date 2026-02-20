import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PredictionRequest {
  action: 'predict' | 'auto_book';
  provider_id?: string;
}

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

    const { action, provider_id } = await req.json() as PredictionRequest;

    // Fetch patient's appointment history
    const { data: appointments, error: apptError } = await supabase
      .from("appointments")
      .select("appointment_date, start_time, status, provider_id")
      .eq("patient_id", user.id)
      .order("appointment_date", { ascending: false })
      .limit(10);

    if (apptError) throw apptError;

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ 
        error: "No appointment history found",
        prediction: null 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prepare data for Gemini
    const appointmentHistory = appointments.map(a => ({
      date: a.appointment_date,
      time: a.start_time,
      status: a.status,
    }));

    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

    const prompt = `Analyze this patient's appointment history and predict when their next appointment should be scheduled.

Appointment History:
${appointmentHistory.map((a, i) => `${i + 1}. ${a.date} at ${a.time} - Status: ${a.status}`).join('\n')}

Based on this pattern, predict:
1. The recommended date for the next appointment (in YYYY-MM-DD format)
2. The confidence level (0-100)
3. Recommended time of day (morning/afternoon/evening)
4. Reason for this prediction

Return as JSON with fields: predicted_date (string), confidence (number), recommended_time (string), reason (string)`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const content = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const prediction = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(content);

    if (action === "predict") {
      return new Response(JSON.stringify({
        success: true,
        prediction: {
          predicted_date: prediction.predicted_date,
          confidence: prediction.confidence,
          recommended_time: prediction.recommended_time,
          reason: prediction.reason,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "auto_book") {
      // Auto-book the appointment
      if (!provider_id) {
        // Use the most recent provider
        const lastProviderId = appointments[0].provider_id;
        if (!lastProviderId) throw new Error("No provider specified and no recent appointments found");
      }

      const selectedProviderId = provider_id || appointments[0].provider_id;

      // Find an available time slot
      const predictedDate = new Date(prediction.predicted_date);
      const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];
      
      // Select time based on recommendation
      let selectedTime = '10:00';
      if (prediction.recommended_time === 'afternoon') {
        selectedTime = '14:00';
      } else if (prediction.recommended_time === 'evening') {
        selectedTime = '15:00';
      }

      // Check if this time slot is already booked
      const [h, m] = selectedTime.split(':').map(Number);
      const endMin = m + 30;
      const endTime = `${(h + Math.floor(endMin / 60)).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}:00`;

      const { data: existingAppt } = await supabase
        .from("appointments")
        .select("id")
        .eq("provider_id", selectedProviderId)
        .eq("appointment_date", prediction.predicted_date)
        .eq("start_time", selectedTime + ':00')
        .single();

      if (existingAppt) {
        // Try next available slot
        for (const slot of timeSlots) {
          const [hs, ms] = slot.split(':').map(Number);
          const testEndMin = ms + 30;
          const testEndTime = `${(hs + Math.floor(testEndMin / 60)).toString().padStart(2, '0')}:${(testEndMin % 60).toString().padStart(2, '0')}:00`;
          
          const { data: available } = await supabase
            .from("appointments")
            .select("id")
            .eq("provider_id", selectedProviderId)
            .eq("appointment_date", prediction.predicted_date)
            .eq("start_time", slot + ':00')
            .single();

          if (!available) {
            selectedTime = slot;
            break;
          }
        }
      }

      const [hf, mf] = selectedTime.split(':').map(Number);
      const endMinF = mf + 30;
      const endTimeF = `${(hf + Math.floor(endMinF / 60)).toString().padStart(2, '0')}:${(endMinF % 60).toString().padStart(2, '0')}:00`;

      // Create the appointment
      const { data: newAppt, error: insertError } = await supabase
        .from("appointments")
        .insert({
          patient_id: user.id,
          provider_id: selectedProviderId,
          appointment_date: prediction.predicted_date,
          start_time: selectedTime + ':00',
          end_time: endTimeF,
          status: 'pending',
          type: 'consultation',
          notes: `AI-predicted follow-up appointment. Confidence: ${prediction.confidence}%`,
        })
        .select();

      if (insertError) throw insertError;

      return new Response(JSON.stringify({
        success: true,
        appointment: newAppt?.[0],
        prediction: {
          predicted_date: prediction.predicted_date,
          confidence: prediction.confidence,
          reason: prediction.reason,
        },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Invalid action");
  } catch (e: any) {
    console.error("predict-appointment error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
