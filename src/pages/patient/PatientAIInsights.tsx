import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, AlertTriangle, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const mockInsights = [
  {
    type: 'follow_up',
    title: 'Follow-up Recommended',
    description: 'Based on your last visit for hypertension management, a follow-up is recommended within 2 weeks.',
    confidence: 0.92,
    urgency: 'high',
    icon: Calendar,
  },
  {
    type: 'no_show_risk',
    title: 'Low No-Show Risk',
    description: 'Your attendance record is excellent. Keep up your great scheduling habits!',
    confidence: 0.88,
    urgency: 'low',
    icon: TrendingUp,
  },
  {
    type: 'optimal_time',
    title: 'Best Time to Visit',
    description: 'Based on your history, Tuesday mornings (9-11 AM) are your preferred and most consistent slots.',
    confidence: 0.85,
    urgency: 'medium',
    icon: Sparkles,
  },
];

const urgencyColor = (u: string) => {
  if (u === 'high') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
  if (u === 'medium') return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
  return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
};

const PatientAIInsights = () => (
  <DashboardLayout>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">AI Health Insights</h1>
        <p className="text-muted-foreground">Personalized recommendations powered by AI</p>
      </div>

      <div className="space-y-4">
        {mockInsights.map((insight, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-border/50 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center shrink-0">
                    <insight.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{insight.title}</h3>
                      <Badge className={urgencyColor(insight.urgency)}>{insight.urgency}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-muted-foreground">
                        Confidence: <strong className="text-foreground">{Math.round(insight.confidence * 100)}%</strong>
                      </span>
                      {insight.type === 'follow_up' && (
                        <Button size="sm" variant="outline">
                          Schedule <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </DashboardLayout>
);

export default PatientAIInsights;
