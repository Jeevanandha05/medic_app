import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, X } from 'lucide-react';

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

  const cancelAppointment = async (id: string) => {
    const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Appointment cancelled' });
      fetchAppointments();
    }
  };

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status));

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      completed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      no_show: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  const AppointmentCard = ({ appt, showCancel }: { appt: any; showCancel?: boolean }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Clock className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">
          Dr. {appt.providers?.profiles?.first_name} {appt.providers?.profiles?.last_name}
        </p>
        <p className="text-xs text-muted-foreground">{appt.providers?.specialization} · {appt.appointment_date} · {appt.start_time}</p>
      </div>
      <Badge className={statusColor(appt.status)}>{appt.status}</Badge>
      {showCancel && appt.status === 'pending' && (
        <Button variant="ghost" size="icon" onClick={() => cancelAppointment(appt.id)}>
          <X className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcoming.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No upcoming appointments</CardContent></Card>
            ) : upcoming.map(a => <AppointmentCard key={a.id} appt={a} showCancel />)}
          </TabsContent>
          <TabsContent value="past" className="mt-4 space-y-3">
            {past.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No past appointments</CardContent></Card>
            ) : past.map(a => <AppointmentCard key={a.id} appt={a} />)}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default PatientAppointments;
