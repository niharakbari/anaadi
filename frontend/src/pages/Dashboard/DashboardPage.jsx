import { useState, useEffect, useMemo } from 'react';
import { LayoutDashboard, Database, Search, Clock, Loader2 } from 'lucide-react';
import { H2, Body } from '../../design-system/components/Typography';
import { StatCard, ActionCard } from '../../design-system/components/Cards';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiBaseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3200').replace(/\/$/, ''), []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`${apiBaseUrl}/api/dashboard/stats`, {
          credentials: 'include'
        });
        
        if (res.status === 401) {
          window.dispatchEvent(new Event('unauthorized'));
          return;
        }
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, [apiBaseUrl]);

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <H2 className="text-stone-800">Welcome Back, Rahul</H2>
        <Body className="text-stone-500">Here is the current overview of the jewellery search index.</Body>
      </div>

      {/* KPI Stats */}
      {loading ? (
        <div className="py-8 flex justify-center text-stone-400">
          <Loader2 size={24} className="animate-spin text-accent" />
        </div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Designs" value={stats.totalDesigns.toLocaleString()} icon={Database} change="Live" changeLabel="from DB" trend="neutral" />
          <StatCard label="Searches Today" value={stats.searchesToday.toLocaleString()} icon={Search} change="+12%" changeLabel="vs yesterday" trend="up" />
          <StatCard label="Pending Reviews" value={stats.pendingReviews.toLocaleString()} icon={Clock} change="+3" changeLabel="new" trend="down" />
          <StatCard label="AI Model Health" value={stats.aiModelHealth} unit="%" icon={LayoutDashboard} change="Optimal" trend="neutral" />
        </div>
      ) : (
        <div className="py-8 flex justify-center text-stone-400">
          <Body>Failed to load dashboard statistics.</Body>
        </div>
      )}

      {/* Action shortcuts */}
      <div>
        <H2 className="text-stone-800 mb-4 text-base font-semibold">Quick Actions</H2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ActionCard
            title="AI Image Search"
            description="Upload a photo or sketch to find matching designs in the catalogue."
            icon={Search}
            onClick={() => navigate('/search')}
          />
          <ActionCard
            title="Upload New Designs"
            description="Batch upload new products to the AI feature indexing index."
            icon={Database}
            onClick={() => navigate('/upload')}
          />
          <ActionCard
            title="View Search History"
            description="Review recent image queries and similarity statistics."
            icon={Clock}
            onClick={() => navigate('/history')}
          />
        </div>
      </div>
    </div>
  );
}
