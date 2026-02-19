import { SimpleLayout } from '@/components/layout/SimpleLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const monthlyData = [
  { month: 'Jan', bookings: 120, cancellations: 15, noShows: 8 },
  { month: 'Feb', bookings: 145, cancellations: 12, noShows: 6 },
  { month: 'Mar', bookings: 160, cancellations: 18, noShows: 10 },
  { month: 'Apr', bookings: 180, cancellations: 10, noShows: 5 },
  { month: 'May', bookings: 200, cancellations: 14, noShows: 7 },
  { month: 'Jun', bookings: 220, cancellations: 8, noShows: 4 },
];

const sentimentData = [
  { month: 'Jan', positive: 78, neutral: 15, negative: 7 },
  { month: 'Feb', positive: 82, neutral: 12, negative: 6 },
  { month: 'Mar', positive: 75, neutral: 18, negative: 7 },
  { month: 'Apr', positive: 88, neutral: 8, negative: 4 },
  { month: 'May', positive: 90, neutral: 7, negative: 3 },
  { month: 'Jun', positive: 92, neutral: 5, negative: 3 },
];

const AdminAnalytics = () => (
  <SimpleLayout>
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Platform Analytics</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Booking Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="bookings" stroke="hsl(173,58%,39%)" fill="hsl(173,58%,39%)" fillOpacity={0.1} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">Cancellations & No-Shows</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="cancellations" fill="hsl(38,92%,50%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="noShows" fill="hsl(0,84%,60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader><CardTitle className="text-sm">Sentiment Trends</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="positive" stroke="hsl(142,72%,29%)" strokeWidth={2} />
                <Line type="monotone" dataKey="neutral" stroke="hsl(38,92%,50%)" strokeWidth={2} />
                <Line type="monotone" dataKey="negative" stroke="hsl(0,84%,60%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  </SimpleLayout>
);

export default AdminAnalytics;
