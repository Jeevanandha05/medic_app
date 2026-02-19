import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Stethoscope, Brain, Calendar, Shield } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">MediSchedule</span>
          </div>
          <Button onClick={() => navigate('/auth')}>Sign In</Button>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-2xl text-center space-y-6">
          <h1 className="text-4xl font-bold text-foreground">
            AI-Powered Healthcare Scheduling
          </h1>
          <p className="text-lg text-muted-foreground">
            Reduce no-shows, predict follow-ups, and optimize doctor calendars with intelligent scheduling.
          </p>
          <div className="flex justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/auth')}>Get Started</Button>
          </div>
          <div className="grid grid-cols-3 gap-4 pt-8">
            {[
              { icon: Brain, label: 'AI Predictions' },
              { icon: Calendar, label: 'Smart Scheduling' },
              { icon: Shield, label: 'Role-Based Access' },
            ].map((f, i) => (
              <div key={i} className="p-4 rounded-lg border border-border text-center">
                <f.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">{f.label}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Landing;
