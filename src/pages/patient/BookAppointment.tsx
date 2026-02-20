import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Search, Star } from 'lucide-react';
import { format } from 'date-fns';

const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30'];

const BookAppointment = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [providers, setProviders] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState('');
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    const fetchProviders = async () => {
      const { data: provs } = await supabase
        .from('providers')
        .select('*')
        .eq('is_active', true);

      if (provs && provs.length > 0) {
        const userIds = provs.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name')
          .in('user_id', userIds);

        const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
        setProviders(provs.map(p => ({
          ...p,
          profile: profileMap[p.user_id] || { first_name: 'Unknown', last_name: '' },
        })));
      } else {
        setProviders([]);
      }
    };
    fetchProviders();
  }, []);

  const filtered = providers.filter(p => {
    const name = `${p.profile?.first_name} ${p.profile?.last_name} ${p.specialization}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleBook = async () => {
    if (!user || !selectedProvider || !selectedDate || !selectedTime) {
      toast({ title: 'Error', description: 'Please select provider, date, and time', variant: 'destructive' });
      return;
    }

    // Validate date is not in the past
    if (selectedDate < new Date()) {
      toast({ title: 'Error', description: 'Cannot book appointments in the past', variant: 'destructive' });
      return;
    }

    // Validate it's not a weekend
    if (selectedDate.getDay() === 0 || selectedDate.getDay() === 6) {
      toast({ title: 'Error', description: 'Appointments cannot be booked on weekends', variant: 'destructive' });
      return;
    }

    setBooking(true);
    try {
      const [h, m] = selectedTime.split(':').map(Number);
      const endMin = m + 30;
      const endTime = `${(h + Math.floor(endMin / 60)).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}:00`;

      // Check if appointment slot is already booked
      const { data: existingAppt } = await supabase
        .from('appointments')
        .select('id')
        .eq('provider_id', selectedProvider.id)
        .eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'))
        .eq('start_time', selectedTime + ':00')
        .single();

      if (existingAppt) {
        toast({ title: 'Error', description: 'This time slot is already booked', variant: 'destructive' });
        setBooking(false);
        return;
      }

      const { error } = await supabase.from('appointments').insert({
        patient_id: user.id,
        provider_id: selectedProvider.id,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: selectedTime + ':00',
        end_time: endTime,
        status: 'pending',
        type: 'consultation',
      });

      if (error) {
        toast({ title: 'Booking failed', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: 'Success!', description: 'Appointment booked successfully' });
        setSelectedProvider(null);
        setSelectedDate(undefined);
        setSelectedTime('');
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setBooking(false);
  };

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search doctors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            {filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No providers found</p>
            ) : filtered.map(p => (
              <Card
                key={p.id}
                className={`cursor-pointer ${selectedProvider?.id === p.id ? 'ring-2 ring-primary' : ''}`}
                onClick={() => setSelectedProvider(p)}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-foreground">
                    {p.profile?.first_name?.[0]}{p.profile?.last_name?.[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Dr. {p.profile?.first_name} {p.profile?.last_name}</p>
                    <p className="text-sm text-muted-foreground">{p.specialization} · ${p.consultation_fee || 0}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Star className="h-3 w-3 text-yellow-500" /> {p.rating_avg || '—'}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Select Date</CardTitle></CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                />
              </CardContent>
            </Card>

            {selectedDate && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Select Time</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <Button key={slot} variant={selectedTime === slot ? 'default' : 'outline'} size="sm" onClick={() => setSelectedTime(slot)}>
                        {slot}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedProvider && selectedDate && selectedTime && (
              <Button className="w-full" onClick={handleBook} disabled={booking}>
                {booking ? 'Booking...' : 'Confirm Booking'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </SimpleLayout>
  );
};

export default BookAppointment;
