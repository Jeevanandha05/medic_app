import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['hsl(173,58%,39%)', 'hsl(198,66%,48%)', 'hsl(38,92%,50%)', 'hsl(0,84%,60%)'];

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
      const counts: Record<string, number> = {};
      (apptRes.data || []).forEach((a: any) => { counts[a.status] = (counts[a.status] || 0) + 1; });
      setStatusData(Object.entries(counts).map(([name, value]) => ({ name, value })));
    };
    fetch();
  }, []);

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Patients', value: stats.patients },
            { label: 'Doctors', value: stats.providers },
            { label: 'Appointments', value: stats.appointments },
            { label: 'Reviews', value: stats.reviews },
          ].map((s, i) => (
            <Card key={i}><CardContent className="p-4"><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-bold text-foreground">{s.value}</p></CardContent></Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-sm">Appointment Status</CardTitle></CardHeader>
            <CardContent>
              {statusData.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">No data</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
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
    </SimpleLayout>
  );
};

export default AdminDashboard;
