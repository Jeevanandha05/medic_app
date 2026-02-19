import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const TEST_CREDENTIALS = {
  patient: { email: 'patient@test.com', password: 'test123456' },
  doctor: { email: 'doctor@test.com', password: 'test123456' },
  admin: { email: 'admin@test.com', password: 'test123456' },
};

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<string>('patient');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
    setLoading(false);
    if (error) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Welcome back!' });
      navigate('/redirect');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: signupEmail,
      password: signupPassword,
      options: {
        data: { first_name: firstName, last_name: lastName, role },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: 'Sign up failed', description: error.message, variant: 'destructive' });
    } else if (data.session) {
      toast({ title: 'Account created!' });
      navigate('/redirect');
    } else {
      toast({ title: 'Account created!', description: 'You can now sign in.' });
    }
  };

  const quickLogin = async (roleKey: keyof typeof TEST_CREDENTIALS) => {
    const creds = TEST_CREDENTIALS[roleKey];
    setLoading(true);
    // Try login first
    const { error } = await supabase.auth.signInWithPassword(creds);
    if (error) {
      // Create account if doesn't exist
      const name = roleKey.charAt(0).toUpperCase() + roleKey.slice(1);
      const { data, error: signupErr } = await supabase.auth.signUp({
        email: creds.email,
        password: creds.password,
        options: { data: { first_name: name, last_name: 'User', role: roleKey } },
      });
      if (signupErr) {
        toast({ title: 'Error', description: signupErr.message, variant: 'destructive' });
        setLoading(false);
        return;
      }
      if (data.session) {
        // If role is doctor, also create provider record
        if (roleKey === 'doctor') {
          await supabase.from('providers').insert({
            user_id: data.user!.id,
            specialization: 'General Practice',
            bio: 'Test doctor account',
            years_experience: 5,
            consultation_fee: 100,
          });
        }
        toast({ title: `Created & logged in as ${roleKey}` });
        navigate('/redirect');
        setLoading(false);
        return;
      }
    }
    setLoading(false);
    toast({ title: `Logged in as ${roleKey}` });
    navigate('/redirect');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">MediSchedule</h1>
          <p className="text-muted-foreground text-sm">AI-Powered Healthcare Scheduling</p>
        </div>

        {/* Quick Login */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Test Login</CardTitle>
            <CardDescription>Click to auto-create & login with test accounts</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => quickLogin('patient')} disabled={loading}>
              Patient
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => quickLogin('doctor')} disabled={loading}>
              Doctor
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => quickLogin('admin')} disabled={loading}>
              Admin
            </Button>
          </CardContent>
        </Card>

        <Tabs defaultValue="login">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>First Name</Label>
                      <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Last Name</Label>
                      <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Patient</SelectItem>
                        <SelectItem value="doctor">Doctor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating...' : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Auth;
