import { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import {
  Calendar, Home, Users, Settings, Bell, LogOut, Menu, X,
  Stethoscope, Clock, Star, BarChart3, Shield, FileText, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const patientNav = [
  { label: 'Dashboard', icon: Home, path: '/patient' },
  { label: 'Book Appointment', icon: Calendar, path: '/patient/book' },
  { label: 'My Appointments', icon: Clock, path: '/patient/appointments' },

  { label: 'My Reviews', icon: Star, path: '/patient/reviews' },
  { label: 'Settings', icon: Settings, path: '/patient/settings' },
];

const doctorNav = [
  { label: 'Dashboard', icon: Home, path: '/doctor' },
  { label: 'Appointments', icon: Calendar, path: '/doctor/appointments' },
  { label: 'Availability', icon: Clock, path: '/doctor/availability' },
  { label: 'Reviews', icon: Star, path: '/doctor/reviews' },
  { label: 'Settings', icon: Settings, path: '/doctor/settings' },
];

const adminNav = [
  { label: 'Dashboard', icon: Home, path: '/admin' },
  { label: 'Doctors', icon: Stethoscope, path: '/admin/doctors' },
  { label: 'Appointments', icon: Calendar, path: '/admin/appointments' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Reviews', icon: Star, path: '/admin/reviews' },
  { label: 'System Logs', icon: FileText, path: '/admin/logs' },
];

export const DashboardLayout = ({ children }: { children: ReactNode }) => {
  const { profile, role, signOut } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = role === 'doctor' ? doctorNav : role === 'admin' ? adminNav : patientNav;
  const roleLabel = role === 'doctor' ? 'Doctor' : role === 'admin' ? 'Admin' : 'Patient';
  const roleColor = role === 'doctor' ? 'bg-info text-info-foreground' : role === 'admin' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground';

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card overflow-hidden lg:relative"
          >
            {/* Logo */}
            <div className="flex items-center gap-3 px-5 py-5 border-b border-border">
              <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-base font-bold text-foreground tracking-tight">MediSchedule</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">AI Platform</p>
              </div>
            </div>

            {/* User info */}
            <div className="px-4 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {profile?.first_name || 'User'} {profile?.last_name || ''}
                  </p>
                  <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${roleColor}`}>
                    {roleLabel}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                      ${isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Sign out */}
            <div className="px-3 py-4 border-t border-border">
              <button
                onClick={() => { signOut(); navigate('/auth'); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-border bg-card/50 backdrop-blur-sm flex items-center px-4 gap-4 sticky top-0 z-30">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
};
