import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Calendar, Clock, Users, Star, CheckCircle2, XCircle, Brain, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [provider, setProvider] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: prov } = await supabase.from('providers').select('*').eq('user_id', user.id).single();
      setProvider(prov);
      if (prov) {
        const { data: appts } = await supabase
          .from('appointments')
          .select('*, profiles:patient_id(first_name, last_name)')
          .eq('provider_id', prov.id)
          .order('appointment_date', { ascending: true })
          .limit(10);
        setAppointments(appts || []);
      }
      setLoading(false);
    };
    fetch();
  }, [user]);

  const handleAction = async (id: string, status: string) => {
    const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Appointment ${status}` });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }
  };

  const todayAppts = appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]);
  const pendingAppts = appointments.filter(a => a.status === 'pending');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctor Dashboard</h1>
          <p className="text-muted-foreground">Manage your appointments and patients</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Today's Patients", value: todayAppts.length, icon: Users, color: 'text-primary' },
            { label: 'Pending Review', value: pendingAppts.length, icon: Clock, color: 'text-yellow-600' },
            { label: 'Rating', value: provider?.rating_avg || '—', icon: Star, color: 'text-yellow-600' },
            { label: 'Total Reviews', value: provider?.total_reviews || 0, icon: TrendingUp, color: 'text-green-600' },
          ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">{stat.value}</p>
                    </div>
                    <div className={`h-10 w-10 rounded-xl bg-accent flex items-center justify-center ${stat.color}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Pending Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pending Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            {pendingAppts.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">No pending appointments</p>
            ) : (
              <div className="space-y-3">
                {pendingAppts.map(appt => (
                  <div key={appt.id} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                    <div className="h-10 w-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-sm">
                      {appt.profiles?.first_name?.[0]}{appt.profiles?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{appt.profiles?.first_name} {appt.profiles?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{appt.appointment_date} · {appt.start_time}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleAction(appt.id, 'confirmed')} className="gradient-primary text-primary-foreground">
                        <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Accept
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleAction(appt.id, 'cancelled')}>
                        <XCircle className="h-3.5 w-3.5 mr-1" /> Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {todayAppts.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">No appointments today</p>
            ) : (
              <div className="space-y-3">
                {todayAppts.map(appt => (
                  <div key={appt.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                    <span className="text-sm font-mono font-medium text-primary w-14">{appt.start_time?.slice(0, 5)}</span>
                    <div className="h-8 w-0.5 bg-primary/30 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{appt.profiles?.first_name} {appt.profiles?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{appt.type || 'Consultation'}</p>
                    </div>
                    <Badge className={appt.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>{appt.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
