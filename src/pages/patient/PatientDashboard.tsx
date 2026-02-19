import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Brain, Star, ArrowRight, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import type { Appointment } from '@/types';

const PatientDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*, providers(specialization, rating_avg, profiles:user_id(first_name, last_name))')
        .eq('patient_id', user.id)
        .order('appointment_date', { ascending: true })
        .limit(5);
      setAppointments(data || []);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const upcomingCount = appointments.filter(a => ['pending', 'confirmed'].includes(a.status)).length;
  const completedCount = appointments.filter(a => a.status === 'completed').length;

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      case 'pending': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'cancelled': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'completed': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Patient Dashboard</h1>
          <p className="text-muted-foreground">Your health scheduling at a glance</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Upcoming', value: upcomingCount, icon: Calendar, color: 'text-primary' },
            { label: 'Completed', value: completedCount, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'AI Insights', value: '3', icon: Brain, color: 'text-purple-600' },
            { label: 'Avg Rating Given', value: '4.8', icon: Star, color: 'text-yellow-600' },
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

        {/* AI Recommendation Card */}
        <Card className="border-primary/20 bg-accent/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl gradient-primary flex items-center justify-center shrink-0">
                <Brain className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-1">AI Recommendation</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Based on your visit history, we recommend scheduling a follow-up appointment with your primary care provider in the next 2 weeks.
                </p>
                <Button size="sm" onClick={() => navigate('/patient/book')} className="gradient-primary text-primary-foreground">
                  Book Now <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
              <Badge className="bg-primary/10 text-primary shrink-0">92% confidence</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Appointments</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/patient/appointments')}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No appointments yet</p>
                <Button size="sm" className="mt-3" onClick={() => navigate('/patient/book')}>Book Your First Appointment</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appt) => (
                  <div key={appt.id} className="flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                    <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {appt.providers?.specialization || 'Consultation'}
                      </p>
                      <p className="text-xs text-muted-foreground">{appt.appointment_date} · {appt.start_time}</p>
                    </div>
                    <Badge className={statusColor(appt.status)}>{appt.status}</Badge>
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

export default PatientDashboard;
