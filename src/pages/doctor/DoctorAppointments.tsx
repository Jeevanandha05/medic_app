import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        const { data } = await supabase
          .from('appointments')
          .select('*, profiles:patient_id(first_name, last_name)')
          .eq('provider_id', prov.id)
          .order('appointment_date', { ascending: false });
        setAppointments(data || []);
      }
    };
    fetch();
  }, [user]);

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status));

  const statusColor = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700', pending: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700', completed: 'bg-blue-100 text-blue-700', no_show: 'bg-gray-100 text-gray-700',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  const Row = ({ a }: { a: any }) => (
    <div className="flex items-center gap-4 p-4 rounded-lg border border-border">
      <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
        <Clock className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{a.profiles?.first_name} {a.profiles?.last_name}</p>
        <p className="text-xs text-muted-foreground">{a.appointment_date} · {a.start_time}</p>
      </div>
      <Badge className={statusColor(a.status)}>{a.status}</Badge>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">All Appointments</h1>
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {upcoming.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">No upcoming appointments</CardContent></Card> : upcoming.map(a => <Row key={a.id} a={a} />)}
          </TabsContent>
          <TabsContent value="past" className="mt-4 space-y-3">
            {past.length === 0 ? <Card><CardContent className="p-8 text-center text-muted-foreground">No past appointments</CardContent></Card> : past.map(a => <Row key={a.id} a={a} />)}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DoctorAppointments;
