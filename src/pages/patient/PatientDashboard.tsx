import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Brain, ArrowRight } from 'lucide-react';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      // Fetch appointments with provider info
      const { data: appts } = await supabase
        .from('appointments')
        .select('*, providers(id, specialization, user_id)')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true })
        .limit(5);

      if (appts && appts.length > 0) {
        // Get unique provider user_ids to fetch their names
        const providerUserIds = [...new Set(appts.map(a => a.providers?.user_id).filter(Boolean))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', providerUserIds);

        const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
        const enriched = appts.map(a => ({
          ...a,
          doctor_name: a.providers?.user_id && profileMap[a.providers.user_id]
            ? `Dr. ${profileMap[a.providers.user_id].first_name} ${profileMap[a.providers.user_id].last_name}`
            : 'Doctor',
        }));
        setAppointments(enriched);
      } else {
        setAppointments([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length;
  const completed = appointments.filter(a => a.status === 'completed').length;

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Patient Dashboard</h1>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold text-foreground">{upcoming}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold text-foreground">{completed}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-2xl font-bold text-foreground">{appointments.length}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Brain className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-foreground">AI Recommendation</p>
                <p className="text-sm text-muted-foreground">Get personalized scheduling insights from AI</p>
              </div>
              <Button size="sm" onClick={() => navigate('/patient/ai-insights')}>
                View Insights <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Recent Appointments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/patient/appointments')}>View All</Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground text-center py-4">Loading...</p>
            ) : appointments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-muted-foreground mb-3">No appointments yet</p>
                <Button size="sm" onClick={() => navigate('/patient/book')}>Book Appointment</Button>
              </div>
            ) : (
              <div className="space-y-2">
                {appointments.map(appt => (
                  <div key={appt.id} className="flex items-center gap-3 p-3 rounded border border-border">
                    <Clock className="h-4 w-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{appt.doctor_name} — {appt.providers?.specialization || 'Consultation'}</p>
                      <p className="text-xs text-muted-foreground">{appt.appointment_date} · {appt.start_time?.slice(0, 5)}</p>
                    </div>
                    <Badge variant="outline">{appt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </SimpleLayout>
  );
};

export default PatientDashboard;
