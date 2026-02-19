import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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
    <SimpleLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Doctors</h1>
        {doctors.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground">No doctors registered</p>
        ) : (
          <div className="space-y-2">
            {doctors.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded border border-border">
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-foreground">
                  {d.profiles?.first_name?.[0]}{d.profiles?.last_name?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Dr. {d.profiles?.first_name} {d.profiles?.last_name}</p>
                  <p className="text-xs text-muted-foreground">{d.specialization} · {d.profiles?.email}</p>
                </div>
                <Badge variant={d.is_active ? 'default' : 'secondary'}>{d.is_active ? 'Active' : 'Inactive'}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default AdminDoctors;
