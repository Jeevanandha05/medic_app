import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Clock, X, Check, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const PatientAppointments = () => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogData, setDialogData] = useState<{ id: string; action: 'confirm' | 'cancel'; doctor: string } | null>(null);

  const fetchAppointments = async () => {
    if (!user) return;
    const { data: appts } = await supabase
      .from('appointments')
      .select('*, providers(id, specialization, user_id)')
      .eq('patient_id', user.id)
      .order('appointment_date', { ascending: false });

    if (appts && appts.length > 0) {
      const providerUserIds = [...new Set(appts.map(a => a.providers?.user_id).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, first_name, last_name')
        .in('user_id', providerUserIds);

      const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
      setAppointments(appts.map(a => ({
        ...a,
        doctor_name: a.providers?.user_id && profileMap[a.providers.user_id]
          ? `Dr. ${profileMap[a.providers.user_id].first_name} ${profileMap[a.providers.user_id].last_name}`
          : 'Doctor',
      })));
    } else {
      setAppointments([]);
    }
    setLoading(false);
  };

  const handleConfirmAppointment = async (id: string, doctor_name: string) => {
    setDialogData({ id, action: 'confirm', doctor: doctor_name });
    setDialogOpen(true);
  };

  const handleCancelAppointment = async (id: string, doctor_name: string) => {
    setDialogData({ id, action: 'cancel', doctor: doctor_name });
    setDialogOpen(true);
  };

  const executeAction = async () => {
    if (!dialogData) return;

    setActionInProgress(dialogData.id);
    const newStatus = dialogData.action === 'confirm' ? 'confirmed' : 'cancelled';

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: newStatus })
        .eq('id', dialogData.id);

      if (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        const actionText = dialogData.action === 'confirm' ? 'Confirmed' : 'Cancelled';
        toast({
          title: `Appointment ${actionText}`,
          description: `Your appointment with ${dialogData.doctor} has been ${actionText.toLowerCase()}.`,
        });
        fetchAppointments();
      }
    } catch (e: any) {
      toast({
        title: 'Error',
        description: e.message,
        variant: 'destructive',
      });
    } finally {
      setActionInProgress(null);
      setDialogOpen(false);
      setDialogData(null);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [user]);

  const upcoming = appointments.filter(a => ['pending', 'confirmed'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled', 'no_show'].includes(a.status));

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
        <Tabs defaultValue="upcoming">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({past.length})</TabsTrigger>
          </TabsList>
          {['upcoming', 'past'].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-4 space-y-2">
              {(tab === 'upcoming' ? upcoming : past).length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No {tab} appointments</p>
              ) : (tab === 'upcoming' ? upcoming : past).map(a => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded border border-border">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{a.doctor_name}</p>
                    <p className="text-xs text-muted-foreground">{a.providers?.specialization} · {a.appointment_date} · {a.start_time?.slice(0, 5)}</p>
                  </div>
                  <Badge variant="outline">{a.status}</Badge>
                  {tab === 'upcoming' && a.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleConfirmAppointment(a.id, a.doctor_name)}
                        disabled={actionInProgress === a.id}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Confirm
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelAppointment(a.id, a.doctor_name)}
                        disabled={actionInProgress === a.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  )}
                  {tab === 'upcoming' && a.status === 'confirmed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCancelAppointment(a.id, a.doctor_name)}
                      disabled={actionInProgress === a.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>

        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {dialogData?.action === 'confirm' ? 'Confirm Appointment?' : 'Cancel Appointment?'}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {dialogData?.action === 'confirm'
                  ? `You are about to confirm your appointment with ${dialogData?.doctor}. This action cannot be undone.`
                  : `You are about to cancel your appointment with ${dialogData?.doctor}. You can book another appointment later.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex items-start gap-2 p-3 bg-muted rounded-md">
              <AlertCircle className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" />
              <text className="text-sm text-muted-foreground">
                {dialogData?.action === 'confirm'
                  ? 'Please make sure you can attend this appointment.'
                  : 'Cancellations should be made as soon as possible.'}
              </text>
            </div>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>No, keep it</AlertDialogCancel>
              <AlertDialogAction
                onClick={executeAction}
                disabled={actionInProgress !== null}
                className={dialogData?.action === 'cancel' ? 'bg-destructive hover:bg-destructive/90' : ''}
              >
                {actionInProgress ? 'Processing...' : 'Yes, proceed'}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SimpleLayout>
  );
};

export default PatientAppointments;
