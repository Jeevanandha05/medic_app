import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Stethoscope, Brain, Calendar, Shield, ArrowRight, Star, Clock, Users, CheckCircle2, Sparkles, TrendingUp, Activity
} from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI Predictions', desc: 'Predict no-shows, suggest follow-ups, and optimize scheduling with ML-driven insights.' },
  { icon: Calendar, title: 'Smart Scheduling', desc: 'One-click booking with AI-recommended time slots based on patient behavior patterns.' },
  { icon: Shield, title: 'Secure & Compliant', desc: 'Enterprise-grade security with role-based access and end-to-end data protection.' },
  { icon: TrendingUp, title: 'Analytics Dashboard', desc: 'Real-time appointment trends, sentiment analysis, and doctor utilization metrics.' },
  { icon: Activity, title: 'Realtime Updates', desc: 'Instant notifications for appointments, cancellations, and AI-driven reminders.' },
  { icon: Users, title: 'Multi-Role Platform', desc: 'Dedicated dashboards for patients, doctors, and administrators with scoped access.' },
];

const stats = [
  { value: '40%', label: 'Fewer No-Shows' },
  { value: '3x', label: 'Faster Booking' },
  { value: '95%', label: 'Patient Satisfaction' },
  { value: '24/7', label: 'AI Availability' },
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <header className="sticky top-0 z-50 glass">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg gradient-primary flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">MediSchedule</span>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/auth')}>Sign In</Button>
            <Button onClick={() => navigate('/auth')} className="gradient-primary text-primary-foreground">
              Get Started <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="absolute top-20 right-20 h-64 w-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-20 left-20 h-48 w-48 rounded-full bg-primary/8 blur-3xl" />
        <div className="container mx-auto px-4 py-24 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-sm font-medium mb-6">
                <Sparkles className="h-3.5 w-3.5" />
                AI-Powered Healthcare Scheduling
              </div>
              <h1 className="text-4xl md:text-6xl font-extrabold text-foreground leading-tight mb-6">
                Scheduling That<br />
                <span className="bg-gradient-to-r from-primary to-[hsl(198,66%,48%)] bg-clip-text text-transparent">
                  Thinks Ahead
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-8">
                Reduce no-shows by 40%, predict follow-ups, and optimize doctor calendars with our AI-driven healthcare scheduling platform.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" onClick={() => navigate('/auth')} className="gradient-primary text-primary-foreground px-8">
                  Start Free Trial <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
                <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
                  View Demo
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-card">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="text-center">
                <p className="text-3xl md:text-4xl font-extrabold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Everything You Need</h2>
            <p className="text-muted-foreground text-lg">A complete platform for intelligent healthcare appointment management.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <Card className="h-full hover:shadow-lg transition-shadow border-border/50">
                  <CardContent className="p-6">
                    <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="rounded-2xl gradient-primary p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.1),transparent_60%)]" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to Transform Your Practice?</h2>
              <p className="text-primary-foreground/80 text-lg max-w-lg mx-auto mb-8">Join thousands of healthcare providers using AI to deliver better patient outcomes.</p>
              <Button size="lg" variant="secondary" onClick={() => navigate('/auth')} className="px-8">
                Get Started Today <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">MediSchedule</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 MediSchedule. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
