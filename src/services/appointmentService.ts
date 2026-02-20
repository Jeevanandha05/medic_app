import { supabase } from '@/integrations/supabase/client';

interface AppointmentHistory {
  date: string;
  time: string;
  status: string;
}

interface PredictionResponse {
  predicted_date: string;
  confidence: number;
  recommended_time: string;
  reason: string;
}

const parseGeminiResponse = (text: string): PredictionResponse => {
  try {
    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(text);
  } catch {
    // Return a default prediction if parsing fails
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return {
      predicted_date: tomorrow.toISOString().split('T')[0],
      confidence: 50,
      recommended_time: 'morning',
      reason: 'Default prediction',
    };
  }
};

export const appointmentService = {
  async predictNextAppointment(
    userId: string,
    gpt: string
  ): Promise<PredictionResponse> {
    try {
      // Fetch patient's appointment history
      const { data: appointments, error: apptError } = await supabase
        .from('appointments')
        .select('appointment_date, start_time, status')
        .eq('patient_id', userId)
        .order('appointment_date', { ascending: false })
        .limit(10);

      if (apptError) throw apptError;

      if (!appointments || appointments.length === 0) {
        throw new Error('No appointment history found');
      }

      const appointmentHistory: AppointmentHistory[] = appointments.map((a) => ({
        date: a.appointment_date,
        time: a.start_time,
        status: a.status,
      }));

      const prompt = `Analyze this patient's appointment history and predict when their next appointment should be scheduled.

Appointment History:
${appointmentHistory.map((a, i) => `${i + 1}. ${a.date} at ${a.time} - Status: ${a.status}`).join('\n')}

Based on this pattern, predict:
1. The recommended date for the next appointment (in YYYY-MM-DD format)
2. The confidence level (0-100)
3. Recommended time of day (morning/afternoon/evening)
4. Reason for this prediction

Return ONLY a valid JSON object with these exact fields: predicted_date, confidence (number), recommended_time, reason. No markdown, no other text.`;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${gpt}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return parseGeminiResponse(content);
    } catch (error) {
      console.error('Prediction error:', error);
      throw error;
    }
  },

  async autoBookAppointment(
    userId: string,
    prediction: PredictionResponse,
    providerId?: string
  ): Promise<any> {
    try {
      // Get user's most recent provider if not specified
      let selectedProviderId = providerId;

      if (!selectedProviderId) {
        const { data: appointments } = await supabase
          .from('appointments')
          .select('provider_id')
          .eq('patient_id', userId)
          .order('appointment_date', { ascending: false })
          .limit(1)
          .single();

        if (!appointments?.provider_id) {
          throw new Error('No provider specified and no recent appointments found');
        }
        selectedProviderId = appointments.provider_id;
      }

      // Time slot selection based on recommendation
      const timeSlots = [
        '09:00',
        '09:30',
        '10:00',
        '10:30',
        '11:00',
        '11:30',
        '13:00',
        '13:30',
        '14:00',
        '14:30',
        '15:00',
        '15:30',
      ];

      let selectedTime = '10:00';
      if (prediction.recommended_time === 'afternoon') {
        selectedTime = '14:00';
      } else if (prediction.recommended_time === 'evening') {
        selectedTime = '15:00';
      }

      // Check if time slot is available
      let finalTime = selectedTime;
      for (const slot of timeSlots) {
        const { data: existingAppt } = await supabase
          .from('appointments')
          .select('id')
          .eq('provider_id', selectedProviderId)
          .eq('appointment_date', prediction.predicted_date)
          .eq('start_time', slot + ':00')
          .single();

        if (!existingAppt) {
          finalTime = slot;
          break;
        }
      }

      // Calculate end time (30 minute appointment)
      const [h, m] = finalTime.split(':').map(Number);
      const endMin = m + 30;
      const endTime = `${(h + Math.floor(endMin / 60))
        .toString()
        .padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}:00`;

      // Create appointment
      const { data: newAppt, error: insertError } = await supabase
        .from('appointments')
        .insert({
          patient_id: userId,
          provider_id: selectedProviderId,
          appointment_date: prediction.predicted_date,
          start_time: finalTime + ':00',
          end_time: endTime,
          status: 'pending',
          type: 'consultation',
          notes: `AI-predicted follow-up appointment. Confidence: ${prediction.confidence}%`,
        })
        .select();

      if (insertError) throw insertError;

      return newAppt?.[0];
    } catch (error) {
      console.error('Auto-booking error:', error);
      throw error;
    }
  },
};
