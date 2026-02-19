import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Clock } from 'lucide-react';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const times = Array.from({ length: 20 }, (_, i) => {
  const h = Math.floor(i / 2) + 8;
  const m = i % 2 === 0 ? '00' : '30';
  return `${h.toString().padStart(2, '0')}:${m}`;
});

const DoctorAvailability = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [provider, setProvider] = useState<any>(null);
  const [slots, setSlots] = useState<any[]>([]);
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: prov } = await supabase.from('providers').select('*').eq('user_id', user.id).single();
      setProvider(prov);
      if (prov) {
        const { data } = await supabase.from('availability_slots').select('*').eq('provider_id', prov.id).eq('is_active', true).order('day_of_week');
        setSlots(data || []);
      }
    };
    fetch();
  }, [user]);

  const addSlot = async () => {
    if (!provider) return;
    const { data, error } = await supabase.from('availability_slots').insert({
      provider_id: provider.id,
      day_of_week: parseInt(dayOfWeek),
      start_time: startTime + ':00',
      end_time: endTime + ':00',
    }).select().single();
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setSlots(prev => [...prev, data]);
      toast({ title: 'Slot added' });
    }
  };

  const removeSlot = async (id: string) => {
    await supabase.from('availability_slots').update({ is_active: false }).eq('id', id);
    setSlots(prev => prev.filter(s => s.id !== id));
    toast({ title: 'Slot removed' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Manage Availability</h1>

        <Card>
          <CardHeader><CardTitle className="text-base">Add Time Slot</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Day</label>
                <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>{days.map((d, i) => <SelectItem key={i} value={String(i)}>{d}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">Start</label>
                <Select value={startTime} onValueChange={setStartTime}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{times.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm text-muted-foreground">End</label>
                <Select value={endTime} onValueChange={setEndTime}>
                  <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
                  <SelectContent>{times.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={addSlot} className="gradient-primary text-primary-foreground"><Plus className="h-4 w-4 mr-1" /> Add</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Current Slots</CardTitle></CardHeader>
          <CardContent>
            {slots.length === 0 ? (
              <p className="text-center py-6 text-muted-foreground">No availability slots set</p>
            ) : (
              <div className="space-y-2">
                {slots.map(slot => (
                  <div key={slot.id} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">{days[slot.day_of_week]}</span>
                    <span className="text-sm text-muted-foreground">{slot.start_time?.slice(0, 5)} – {slot.end_time?.slice(0, 5)}</span>
                    <div className="flex-1" />
                    <Button variant="ghost" size="icon" onClick={() => removeSlot(slot.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

export default DoctorAvailability;
