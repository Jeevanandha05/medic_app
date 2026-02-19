import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock } from 'lucide-react';

const DoctorAppointments = () => {
  const { user } = useAuthStore();
  const [appointments, setAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: prov } = await supabase.from('providers').select('id').eq('user_id', user.id).single();
      if (prov) {
        const { data: appts } = await supabase
          .from('appointments')
          .select('*')
          .eq('provider_id', prov.id)
          .order('appointment_date', { ascending: false });

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
    };
    fetch();
  }, [user]);

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status));

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">All Appointments</h1>
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          {['upcoming', 'past'].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-2">
              {(tab === 'upcoming' ? upcoming : past).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No {tab} appointments</p>
              ) : (tab === 'upcoming' ? upcoming : past).map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded border border-border">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{a.patient_name}</p>
                    <p className="text-xs text-muted-foreground">{a.appointment_date} · {a.start_time?.slice(0, 5)}</p>
                  </div>
                  <Badge variant="outline">{a.status}</Badge>
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </SimpleLayout>
  );
};

export default DoctorAppointments;
