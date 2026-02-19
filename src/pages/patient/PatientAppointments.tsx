import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Clock, X } from 'lucide-react';

const PatientAppointments = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointments = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('appointments')
      .select('*, providers(specialization, profiles:user_id(first_name, last_name))')
      .eq('patient_id', user.id)
      .order('appointment_date', { ascending: false });
    setAppointments(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAppointments(); }, [user]);

  const cancel = async (id: string) => {
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Cancelled' }); fetchAppointments(); }
  };

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status));

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
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
                    <p className="text-sm font-medium text-foreground">
                      Dr. {a.providers?.profiles?.first_name} {a.providers?.profiles?.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.providers?.specialization} · {a.appointment_date} · {a.start_time?.slice(0, 5)}</p>
                  </div>
                  <Badge variant="outline">{a.status}</Badge>
                  {tab === 'upcoming' && a.status === 'pending' && (
                    <Button variant="ghost" size="icon" onClick={() => cancel(a.id)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </SimpleLayout>
  );
};

export default PatientAppointments;
