import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const AdminDoctors = () => {
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    specialization: '',
    consultation_fee: '',
    years_experience: '',
    bio: '',
  });

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const { data: provs } = await supabase
        .from('providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (provs && provs.length > 0) {
        const userIds = provs.map(p => p.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, email')
          .in('user_id', userIds);

        const profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p]));
        setDoctors(provs.map(p => ({ ...p, profile: profileMap[p.user_id] })));
      } else {
        setDoctors([]);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to fetch doctors', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const resetForm = () => {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      specialization: '',
      consultation_fee: '',
      years_experience: '',
      bio: '',
    });
    setShowAddForm(false);
  };

  const handleAddDoctor = async () => {
    if (!formData.first_name || !formData.last_name || !formData.email || !formData.specialization) {
      toast({ title: 'Error', description: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      // Create a new user for the doctor
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: Math.random().toString(36).slice(-12),
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
            role: 'doctor',
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user?.id) throw new Error('Failed to create user');

      // Create provider profile
      const { error: providerError } = await supabase.from('providers').insert({
        user_id: authData.user.id,
        specialization: formData.specialization,
        consultation_fee: parseFloat(formData.consultation_fee) || 0,
        years_experience: parseInt(formData.years_experience) || 0,
        bio: formData.bio,
        is_active: true,
      });

      if (providerError) throw providerError;

      toast({
        title: 'Success!',
        description: `Dr. ${formData.first_name} ${formData.last_name} has been added`,
      });
      resetForm();
      fetchDoctors();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  const handleToggleActive = async (doctorId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('providers')
        .update({ is_active: !currentStatus })
        .eq('id', doctorId);

      if (error) throw error;
      toast({ title: 'Updated', description: 'Doctor status updated' });
      fetchDoctors();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteDoctor = async () => {
    if (!doctorToDelete) return;

    try {
      const { error: provError } = await supabase
        .from('providers')
        .delete()
        .eq('id', doctorToDelete);

      if (provError) throw provError;
      toast({ title: 'Success', description: 'Doctor removed' });
      fetchDoctors();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setDeleteDialogOpen(false);
    setDoctorToDelete(null);
  };

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">Manage Doctors</h1>
          <Button onClick={() => setShowAddForm(true)} disabled={showAddForm}>
            <Plus className="h-4 w-4 mr-2" />
            Add Doctor
          </Button>
        </div>

        {showAddForm && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="text-lg">Add New Doctor</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  placeholder="First Name *"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                />
                <Input
                  placeholder="Last Name *"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                />
              </div>
              <Input
                type="email"
                placeholder="Email Address *"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <Input
                placeholder="Specialization (e.g., Cardiology) *"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  placeholder="Consultation Fee"
                  value={formData.consultation_fee}
                  onChange={(e) => setFormData({ ...formData, consultation_fee: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Years Experience"
                  value={formData.years_experience}
                  onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                />
              </div>
              <Input
                placeholder="Bio (Optional)"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleAddDoctor}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add Doctor'
                  )}
                </Button>
                <Button variant="outline" className="flex-1" onClick={resetForm} disabled={submitting}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {doctors.length === 0 && !loading ? (
          <p className="text-center py-8 text-muted-foreground">No doctors registered</p>
        ) : (
          <div className="space-y-2">
            {doctors.map(d => (
              <div key={d.id} className="flex items-center gap-3 p-4 rounded border border-border hover:bg-muted/50 transition">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center font-bold text-sm text-foreground">
                  {d.profile?.first_name?.[0]}{d.profile?.last_name?.[0]}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Dr. {d.profile?.first_name} {d.profile?.last_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.specialization} · ${d.consultation_fee || 0} · {d.years_experience || 0} years
                  </p>
                  <p className="text-xs text-muted-foreground">{d.profile?.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={d.is_active ? 'default' : 'outline'}
                    onClick={() => handleToggleActive(d.id, d.is_active)}
                  >
                    {d.is_active ? 'Active' : 'Inactive'}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setDoctorToDelete(d.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Doctor?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove this doctor. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel>Keep</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteDoctor} className="bg-destructive hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SimpleLayout>
  );
};

export default AdminDoctors;
