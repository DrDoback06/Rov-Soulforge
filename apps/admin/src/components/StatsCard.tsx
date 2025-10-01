/**
 * Stats Card Component
 * Displays a metric with icon and optional trend
 */
export function StatsCard({
  title,
  value,
  icon,
  loading,
  trend
}: {
  title: string;
  value: number | string;
  icon: string;
  loading?: boolean;
  trend?: 'up' | 'down' | 'live';
}) {
  return (
    <div className="bg-accent rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        {trend === 'live' && (
          <span className="flex items-center gap-1 text-xs text-green-400">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            LIVE
          </span>
        )}
      </div>

      <h3 className="text-sm text-gray-400 mb-2">{title}</h3>

      {loading ? (
        <div className="h-8 bg-darker rounded animate-pulse"></div>
      ) : (
        <p className="text-3xl font-bold text-white">{value.toLocaleString()}</p>
      )}
    </div>
  );
}