import { TrendingUp, Swords, DollarSign, Loader2 } from 'lucide-react';
import { StatCard } from './StatCard';
import { usePlatformStats } from '@/hooks/api/useMemedApi';

// Helper function to format numbers with K, M notation
const formatNumber = (num: number): string => {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`;
  }
  return num.toString();
};

// Helper function to format currency values
const formatCurrency = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return '$0';

  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`;
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`;
  }
  return `$${num.toFixed(2)}`;
};

export function StatsSection() {
  // Fetch real platform statistics
  const { data: platformStats, isLoading, error } = usePlatformStats();

  // Show loading state
  if (isLoading) {
    return (
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-green-500" />
          </div>
        </div>
      </section>
    );
  }

  // Fallback to default stats if no data or error
  const stats = [
    {
      icon: <TrendingUp size={20} />,
      label: 'Total Tokens',
      value: platformStats ? formatNumber(platformStats.totalTokens) : '0',
      change: platformStats ? `${platformStats.totalUsers} holders` : 'Getting started',
    },
    {
      icon: <Swords size={20} />,
      label: 'Active Battles',
      value: platformStats ? platformStats.activeBattles.toString() : '0',
      change: 'Live now',
    },
    {
      icon: <DollarSign size={20} />,
      label: 'Total Volume',
      value: platformStats ? formatCurrency(platformStats.totalVolume) : '$0',
      change: 'All time',
    },
  ];

  return (
    <section className="py-20 px-4 ">
      <div className="container mx-auto ">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto  ">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              label={stat.label}
              value={stat.value}
              change={stat.change}
            />
          ))}
        </div>
      </div>
    </section>
  );
}