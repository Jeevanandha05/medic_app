import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Search, Star, Clock, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const timeSlots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'];

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
      const { data } = await supabase
        .from('providers')
        .select('*, profiles:user_id(first_name, last_name, avatar_url)')
        .eq('is_active', true);
      setProviders(data || []);
    };
    fetchProviders();
  }, []);

  const filtered = providers.filter(p => {
    const name = `${p.profiles?.first_name} ${p.profiles?.last_name} ${p.specialization}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleBook = async () => {
    if (!user || !selectedProvider || !selectedDate || !selectedTime) return;
    setBooking(true);
    const { error } = await supabase.from('appointments').insert({
      patient_id: user.id,
      provider_id: selectedProvider.id,
      appointment_date: format(selectedDate, 'yyyy-MM-dd'),
      start_time: selectedTime + ':00',
      end_time: (parseInt(selectedTime.split(':')[0]) + ':' + (parseInt(selectedTime.split(':')[1]) + 30).toString().padStart(2, '0')) + ':00',
      status: 'pending',
      type: 'consultation',
    });
    setBooking(false);
    if (error) {
      toast({ title: 'Booking failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Appointment booked!', description: 'Your appointment is pending confirmation.' });
      setSelectedProvider(null);
      setSelectedDate(undefined);
      setSelectedTime('');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Book Appointment</h1>
          <p className="text-muted-foreground">Find a doctor and schedule your visit</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Provider List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search by name or specialty..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
            {filtered.length === 0 ? (
              <Card><CardContent className="p-8 text-center text-muted-foreground">No providers found</CardContent></Card>
            ) : (
              <div className="space-y-3">
                {filtered.map(provider => (
                  <Card
                    key={provider.id}
                    className={`cursor-pointer transition-all hover:shadow-md ${selectedProvider?.id === provider.id ? 'ring-2 ring-primary border-primary' : ''}`}
                    onClick={() => setSelectedProvider(provider)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-accent flex items-center justify-center text-primary font-bold text-lg">
                          {provider.profiles?.first_name?.[0]}{provider.profiles?.last_name?.[0]}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            Dr. {provider.profiles?.first_name} {provider.profiles?.last_name}
                          </p>
                          <p className="text-sm text-muted-foreground">{provider.specialization}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Star className="h-3 w-3 text-yellow-500" /> {provider.rating_avg || '—'}
                            </span>
                            <span className="text-xs text-muted-foreground">{provider.years_experience || 0} yrs exp</span>
                            <span className="text-xs font-medium text-primary">${provider.consultation_fee || 0}</span>
                          </div>
                        </div>
                        {selectedProvider?.id === provider.id && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Booking Panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Select Date</CardTitle></CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
                  className="rounded-md"
                />
              </CardContent>
            </Card>

            {selectedDate && (
              <Card>
                <CardHeader><CardTitle className="text-base">Select Time</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2">
                    {timeSlots.map(slot => (
                      <Button
                        key={slot}
                        variant={selectedTime === slot ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTime(slot)}
                        className={selectedTime === slot ? 'gradient-primary text-primary-foreground' : ''}
                      >
                        {slot}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {selectedProvider && selectedDate && selectedTime && (
              <Button className="w-full gradient-primary text-primary-foreground" onClick={handleBook} disabled={booking}>
                {booking ? 'Booking...' : 'Confirm Booking'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BookAppointment;
