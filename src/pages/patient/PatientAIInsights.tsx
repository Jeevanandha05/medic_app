import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Calendar, TrendingUp, Clock, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const PatientAIInsights = () => {
  const { toast } = useToast();
  const [insights, setInsights] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-insights', {
        body: { action: 'analyze' },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setInsights(data.insights);
      setSummary(data.appointments_summary);
    } catch (e: any) {
      toast({ title: 'AI Error', description: e.message, variant: 'destructive' });
    }
    setLoading(false);
  };

  return (
    <SimpleLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">AI Health Insights</h1>
          <Button onClick={fetchInsights} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyzing...</> : <><Brain className="h-4 w-4 mr-2" /> Generate Insights</>}
          </Button>
        </div>

        {!insights && !loading && (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Click "Generate Insights" to get AI-powered analysis of your appointment history.</p>
            </CardContent>
          </Card>
        )}

        {insights && (
          <div className="space-y-4">
            {summary && (
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Total', value: summary.total },
                  { label: 'Completed', value: summary.completed },
                  { label: 'Cancelled', value: summary.cancelled },
                  { label: 'No-shows', value: summary.no_shows },
                ].map((s, i) => (
                  <Card key={i}>
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="text-xl font-bold text-foreground">{s.value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {insights.health_summary && (
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-foreground">{insights.health_summary}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid md:grid-cols-3 gap-4">
              {insights.follow_up && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" /> Follow-up
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="mb-2">{insights.follow_up.urgency} urgency</Badge>
                    <p className="text-sm text-muted-foreground">{insights.follow_up.reason}</p>
                    {insights.follow_up.suggested_days && (
                      <p className="text-xs text-primary mt-2">Suggested in {insights.follow_up.suggested_days} days</p>
                    )}
                  </CardContent>
                </Card>
              )}

              {insights.no_show_risk && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" /> No-Show Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="outline" className="mb-2">{insights.no_show_risk.level} risk</Badge>
                    <p className="text-sm text-muted-foreground">{insights.no_show_risk.tips}</p>
                    <p className="text-xs text-primary mt-2">Score: {insights.no_show_risk.score}/100</p>
                  </CardContent>
                </Card>
              )}

              {insights.optimal_times && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" /> Best Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-medium text-foreground text-sm">{insights.optimal_times.best_day} at {insights.optimal_times.best_time}</p>
                    <p className="text-sm text-muted-foreground mt-1">{insights.optimal_times.reason}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </SimpleLayout>
  );
};

export default PatientAIInsights;
