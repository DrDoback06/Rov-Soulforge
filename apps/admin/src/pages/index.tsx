import Head from 'next/head';
import Link from 'next/link';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatsCard } from '@/components/StatsCard';
import { useQuery } from '@tanstack/react-query';

/**
 * Admin Dashboard - Home
 *
 * Overview of system stats and quick actions
 */
export default function HomePage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      // In full implementation, call Firebase function
      return {
        users: 1250,
        characters: 1430,
        activeBattles: 45,
        activeQuests: 230,
        todaysPurchases: 67
      };
    }
  });

  return (
    <DashboardLayout>
      <Head>
        <title>Admin Dashboard - Realm of Valor</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 mt-2">Welcome to the Realm of Valor Admin Panel</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Users"
            value={analytics?.users || 0}
            icon="👥"
            loading={isLoading}
          />
          <StatsCard
            title="Characters"
            value={analytics?.characters || 0}
            icon="⚔️"
            loading={isLoading}
          />
          <StatsCard
            title="Active Battles"
            value={analytics?.activeBattles || 0}
            icon="🎮"
            loading={isLoading}
            trend="live"
          />
          <StatsCard
            title="Active Quests"
            value={analytics?.activeQuests || 0}
            icon="📍"
            loading={isLoading}
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/quests/spawn"
              className="bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
            >
              🗺️ Spawn Quest
            </Link>
            <Link
              href="/poi/create"
              className="bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
            >
              📍 Create POI
            </Link>
            <Link
              href="/users"
              className="bg-primary hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg text-center transition"
            >
              👤 Manage Users
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <ActivityItem
              icon="🎴"
              text="Premium Pack purchased by user_123"
              time="2 minutes ago"
            />
            <ActivityItem
              icon="⚔️"
              text="New battle started: 3 players"
              time="5 minutes ago"
            />
            <ActivityItem
              icon="🏆"
              text="Quest completed: Shadow Beast Defeated"
              time="12 minutes ago"
            />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ActivityItem({ icon, text, time }: { icon: string; text: string; time: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-darker rounded-lg">
      <span className="text-2xl">{icon}</span>
      <div className="flex-1">
        <p className="text-white text-sm">{text}</p>
        <p className="text-gray-500 text-xs mt-1">{time}</p>
      </div>
    </div>
  );
}