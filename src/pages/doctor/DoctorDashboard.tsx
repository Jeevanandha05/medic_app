import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [provider, setProvider] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user) return;
    const { data: prov } = await supabase.from('providers').select('*').eq('user_id', user.id).single();
    setProvider(prov);
    if (prov) {
      const { data: appts } = await supabase
        .from('appointments')
        .select('*')
        .eq('provider_id', prov.id)
        .order('appointment_date', { ascending: true })
        .limit(10);

      if (appts && appts.length > 0) {
        const patientIds = [...new Set(appts.map(a => a.patient_id))];
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', patientIds);

        const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
        setAppointments(appts.map(a => ({
          ...a,
          patient_name: profileMap[a.patient_id]
            ? `${profileMap[a.patient_id].first_name} ${profileMap[a.patient_id].last_name}`
            : 'Patient',
        })));
      } else {
        setAppointments([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAction = async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: `Appointment ${status}` });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  const pending = appointments.filter(a => a.status === 'pending');
  const today = appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]);

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Doctor Dashboard</h1>

        <div className="grid grid-cols-3 gap-4">
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Today</p><p className="text-2xl font-bold text-foreground">{today.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-bold text-foreground">{pending.length}</p></CardContent></Card>
          <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Rating</p><p className="text-2xl font-bold text-foreground">{provider?.rating_avg || '—'}</p></CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Pending Appointments</CardTitle></CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No pending appointments</p>
            ) : pending.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded border border-border mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{a.patient_name}</p>
                  <p className="text-xs text-muted-foreground">{a.appointment_date} · {a.start_time?.slice(0, 5)}</p>
                </div>
                <Button size="sm" onClick={() => handleAction(a.id, 'confirmed')}>
                  <CheckCircle2 className="h-3 w-3 mr-1" /> Accept
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleAction(a.id, 'cancelled')}>
                  <XCircle className="h-3 w-3 mr-1" /> Decline
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Today's Schedule</CardTitle></CardHeader>
          <CardContent>
            {today.length === 0 ? (
              <p className="text-center py-4 text-muted-foreground">No appointments today</p>
            ) : today.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded bg-muted/50 mb-2">
                <span className="text-sm font-mono text-primary w-12">{a.start_time?.slice(0, 5)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{a.patient_name}</p>
                </div>
                <Badge variant="outline">{a.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </SimpleLayout>
  );
};

export default DoctorDashboard;
