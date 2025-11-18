import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string;
  change: string;
}

export function StatCard({ icon, label, value, change }: StatCardProps) {
  return (
    <div className="bg-gradient-to-tr from-black via-black/50 to-primary-900 border border-green-500/20 p-6 backdrop-blur-sm rounded-lg">
      <div className="flex items-center mb-4 text-gray-300">
        {icon}
        <span className="ml-2 text-sm text-gray-300">{label}</span>
      </div>

      <div className="space-y-1">
        <div className="text-2xl md:text-3xl font-bold text-white">
          {value}
        </div>
        <div className="text-sm text-green-400">
          {change}
        </div>
      </div>
    </div>
  );
}