import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { appointmentService } from '@/services/appointmentService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Prediction {
  predicted_date: string;
  confidence: number;
  recommended_time: string;
  reason: string;
}

const AIPredictionWidget = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [autoBooking, setAutoBooking] = useState(false);
  const [prediction, setPrediction] = useState<Prediction | null>(null);

  const handlePredict = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const geminiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!geminiKey) {
        throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file');
      }

      const result = await appointmentService.predictNextAppointment(user.id, geminiKey);
      setPrediction(result);
      toast({
        title: 'Prediction generated!',
        description: `Next appointment suggested for ${result.predicted_date}`,
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message,
        variant: 'destructive',
      });
    }
    setLoading(false);
  };

  const handleAutoBook = async () => {
    if (!user || !prediction) return;
    setAutoBooking(true);
    try {
      const appointment = await appointmentService.autoBookAppointment(user.id, prediction);
      toast({
        title: 'Appointment booked!',
        description: `Your appointment has been scheduled for ${appointment.appointment_date} at ${appointment.start_time}`,
      });
      setPrediction(null);
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message,
        variant: 'destructive',
      });
    }
    setAutoBooking(false);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Appointment Prediction
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!prediction ? (
          <>
            <p className="text-xs text-muted-foreground">
              Let AI analyze your appointment history and suggest the next appointment date.
            </p>
            <Button
              size="sm"
              onClick={handlePredict}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Predict Next Appointment
                </>
              )}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-foreground">Predicted Date</p>
                  <p className="text-lg font-bold text-primary">{prediction.predicted_date}</p>
                </div>
                <Badge variant="outline">{prediction.confidence}% confidence</Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Recommended Time</p>
                <p className="text-sm text-muted-foreground">{prediction.recommended_time}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">Reason</p>
                <p className="text-xs text-muted-foreground">{prediction.reason}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPrediction(null)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleAutoBook}
                disabled={autoBooking}
                className="flex-1"
              >
                {autoBooking ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Auto Book'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AIPredictionWidget;
