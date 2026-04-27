import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import { api, endpoints } from '../api/client';
import StatCard from '../components/StatCard';

const PIE_COLORS = ['#22d3a6', '#f59e0b', '#ff6b6b'];

function DashboardPage() {
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadMetrics() {
      try {
        const { data } = await api.get(endpoints.dashboard);
        if (active) setMetrics(data);
      } catch (error) {
        console.error('Dashboard metrics load failed:', error.message);
      }
    }

    loadMetrics();
    const id = setInterval(loadMetrics, 8000);

    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  if (!metrics) {
    return <div className="card-surface p-6 text-sm text-slate-600">Loading dashboard metrics...</div>;
  }

  const { counters, messageSeverity, imageSeverity, sentimentTrend } = metrics;

  return (
    <section className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Toxic Messages" value={counters.toxicMessages} tone="coral" />
        <StatCard label="Blocked Messages" value={counters.blockedMessages} tone="amber" />
        <StatCard label="Image Abuse Detections" value={counters.imageAbuseDetections} tone="coral" />
        <StatCard label="Blurred Posts" value={counters.blurredPosts} tone="amber" />
        <StatCard label="Avg Bully Score" value={counters.bullyScoreAverage} tone="mint" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="card-surface p-5">
          <p className="font-display text-lg font-bold">Message Severity Trend</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={messageSeverity}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#ff6b6b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="card-surface p-5">
          <p className="font-display text-lg font-bold">Image Abuse Severity</p>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={imageSeverity}
                  dataKey="value"
                  nameKey="label"
                  outerRadius={105}
                  innerRadius={52}
                  paddingAngle={4}
                  label
                >
                  {imageSeverity.map((entry, index) => (
                    <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <article className="card-surface p-5">
        <p className="font-display text-lg font-bold">Sentiment Trend Graph (Bonus)</p>
        <div className="mt-4 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sentimentTrend}>
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                {sentimentTrend.map((entry, index) => (
                  <Cell key={entry.label} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </article>
    </section>
  );
}

export default DashboardPage;
