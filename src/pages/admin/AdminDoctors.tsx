import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Stethoscope } from 'lucide-react';

const AdminDoctors = () => {
  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('providers')
        .select('*, profiles:user_id(first_name, last_name, email)')
        .order('created_at', { ascending: false });
      setDoctors(data || []);
    };
    fetch();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Doctors</h1>
        {doctors.length === 0 ? (
          <Card><CardContent className="p-8 text-center text-muted-foreground">No doctors registered</CardContent></Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {doctors.map(doc => (
              <Card key={doc.id}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-primary font-bold">
                      {doc.profiles?.first_name?.[0]}{doc.profiles?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Dr. {doc.profiles?.first_name} {doc.profiles?.last_name}</p>
                      <p className="text-xs text-muted-foreground">{doc.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1"><Stethoscope className="h-3.5 w-3.5" />{doc.specialization}</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 text-yellow-500" />{doc.rating_avg || '—'}</span>
                  </div>
                  <div className="mt-3">
                    <Badge variant={doc.is_active ? 'default' : 'secondary'}>
                      {doc.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDoctors;
