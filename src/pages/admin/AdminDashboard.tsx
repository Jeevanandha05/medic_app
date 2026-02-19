import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Users, Calendar, Star, TrendingUp, Brain, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(173,58%,39%)', 'hsl(198,66%,48%)', 'hsl(38,92%,50%)', 'hsl(0,84%,60%)', 'hsl(215,16%,47%)'];

const AdminDashboard = () => {
  const [stats, setStats] = useState({ providers: 0, appointments: 0, patients: 0, reviews: 0 });
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [provRes, apptRes, profRes, revRes] = await Promise.all([
        supabase.from('providers').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id, status'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('reviews').select('id', { count: 'exact', head: true }),
      ]);
      setStats({
        providers: provRes.count || 0,
        appointments: apptRes.data?.length || 0,
        patients: (profRes.count || 0) - (provRes.count || 0),
        reviews: revRes.count || 0,
      });

      // Status distribution
      const statusCounts: Record<string, number> = {};
      (apptRes.data || []).forEach(a => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });
      setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));
    };
    fetch();
  }, []);

  const weeklyData = [
    { name: 'Mon', appointments: 12 }, { name: 'Tue', appointments: 19 },
    { name: 'Wed', appointments: 15 }, { name: 'Thu', appointments: 22 },
    { name: 'Fri', appointments: 18 }, { name: 'Sat', appointments: 8 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and analytics</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Patients', value: stats.patients, icon: Users, color: 'text-primary' },
            { label: 'Total Doctors', value: stats.providers, icon: Users, color: 'text-blue-600' },
            { label: 'Appointments', value: stats.appointments, icon: Calendar, color: 'text-green-600' },
            { label: 'Reviews', value: stats.reviews, icon: Star, color: 'text-yellow-600' },
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

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Weekly Appointments</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(214,32%,91%)" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="appointments" fill="hsl(173,58%,39%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Appointment Status</CardTitle></CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <p className="text-center py-16 text-muted-foreground">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
