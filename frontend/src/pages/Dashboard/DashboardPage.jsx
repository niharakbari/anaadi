import { LayoutDashboard, Database, Search, Clock } from 'lucide-react';
import { H2, Body } from '../../design-system/components/Typography';
import { StatCard, ActionCard } from '../../design-system/components/Cards';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <H2 className="text-stone-800">Welcome Back, Rahul</H2>
        <Body className="text-stone-500">Here is the current overview of the jewellery search index.</Body>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Designs" value="12,480" icon={Database} change="+124" changeLabel="this month" trend="up" />
        <StatCard label="Searches Today" value="348" icon={Search} change="+12%" changeLabel="vs yesterday" trend="up" />
        <StatCard label="Pending Reviews" value="27" icon={Clock} change="+3" changeLabel="new" trend="down" />
        <StatCard label="AI Model Health" value="100" unit="%" icon={LayoutDashboard} change="Optimal" trend="neutral" />
      </div>

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
