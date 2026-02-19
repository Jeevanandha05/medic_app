import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { LogOut, Stethoscope } from 'lucide-react';

const patientLinks = [
  { label: 'Dashboard', path: '/patient' },
  { label: 'Book', path: '/patient/book' },
  { label: 'Appointments', path: '/patient/appointments' },

];

const doctorLinks = [
  { label: 'Dashboard', path: '/doctor' },
  { label: 'Appointments', path: '/doctor/appointments' },
  { label: 'Availability', path: '/doctor/availability' },
];

const adminLinks = [
  { label: 'Dashboard', path: '/admin' },
  { label: 'Doctors', path: '/admin/doctors' },
  { label: 'Analytics', path: '/admin/analytics' },
];

export const SimpleLayout = ({ children }: { children: ReactNode }) => {
  const { profile, role, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const links = role === 'doctor' ? doctorLinks : role === 'admin' ? adminLinks : patientLinks;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <div className="flex items-center gap-2 mr-4">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span className="font-bold text-foreground">MediSchedule</span>
          </div>
          <nav className="flex gap-1 flex-1">
            {links.map(link => (
              <button
                key={link.path}
                onClick={() => navigate(link.path)}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                  location.pathname === link.path
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>
          <span className="text-sm text-muted-foreground hidden sm:block">
            {profile?.first_name} ({role})
          </span>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate('/auth'); }}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};
