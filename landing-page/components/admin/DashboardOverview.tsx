"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { 
  Users, 
  CreditCard, 
  Package, 
  TrendingUp, 
  Shield, 
  Activity,
  AlertTriangle
} from "lucide-react";

interface DashboardStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
    newThisMonth: number;
    suspended: number;
    banned: number;
  };
  transactions: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    pending: number;
    failed: number;
    totalVolume: string;
  };
  miniapps: {
    total: number;
    verified: number;
    featured: number;
    pendingVerification: number;
    totalUsers: number;
  };
  tokens: {
    total: number;
    verified: number;
    withPrices: number;
  };
  analytics: {
    activeUsers24h: number;
    activeUsers7d: number;
    activeUsers30d: number;
    totalSessions: number;
    avgSessionDuration: number;
  };
  security: {
    securityEvents24h: number;
    failedLogins24h: number;
    suspiciousActivities: number;
  };
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("admin_token");
        if (!token) {
          setError("Not authenticated");
          return;
        }

        const data = await adminApi.getDashboardStats(token);
        setStats(data);
      } catch (err: any) {
        setError(err.message || "Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading dashboard...</div>;
  }

  if (error || !stats) {
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
        {error || "Failed to load dashboard"}
      </div>
    );
  }

  const StatCard = ({ 
    title, 
    value, icon: Icon, 
    subtitle, 
    trend,
    color = "purple" 
  }: { 
    title: string; 
    value: string | number; 
    icon: any; 
    subtitle?: string;
    trend?: string;
    color?: string;
  }) => {
    const colorClasses = {
      purple: "bg-purple-600",
      blue: "bg-blue-600",
      green: "bg-green-600",
      orange: "bg-orange-600",
      red: "bg-red-600",
    };

    return (
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className={`${colorClasses[color as keyof typeof colorClasses]} p-3 rounded-lg`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          {trend && (
            <span className="text-green-400 text-sm font-medium">{trend}</span>
          )}
        </div>
        <h3 className="text-gray-400 text-sm mb-1">{title}</h3>
        <p className="text-3xl font-bold text-white">{value}</p>
        {subtitle && <p className="text-gray-500 text-sm mt-2">{subtitle}</p>}
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Dashboard Overview</h2>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.users.total.toLocaleString()}
          icon={Users}
          subtitle={`${stats.users.active} active`}
          color="blue"
        />
        <StatCard
          title="Transactions Today"
          value={stats.transactions.today.toLocaleString()}
          icon={CreditCard}
          subtitle={`${stats.transactions.total.toLocaleString()} total`}
          color="green"
        />
        <StatCard
          title="Mini-Apps"
          value={stats.miniapps.total}
          icon={Package}
          subtitle={`${stats.miniapps.verified} verified`}
          color="purple"
        />
        <StatCard
          title="Active Users (24h)"
          value={stats.analytics.activeUsers24h.toLocaleString()}
          icon={TrendingUp}
          subtitle={`${stats.analytics.activeUsers7d.toLocaleString()} (7d)`}
          color="orange"
        />
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* User Growth */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Growth
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">New Today</span>
              <span className="text-white font-semibold">{stats.users.newToday}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">New This Week</span>
              <span className="text-white font-semibold">{stats.users.newThisWeek}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">New This Month</span>
              <span className="text-white font-semibold">{stats.users.newThisMonth}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-700">
              <span className="text-gray-400">Suspended</span>
              <span className="text-orange-400 font-semibold">{stats.users.suspended}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Banned</span>
              <span className="text-red-400 font-semibold">{stats.users.banned}</span>
            </div>
          </div>
        </div>

        {/* Transaction Stats */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Transaction Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-400">This Week</span>
              <span className="text-white font-semibold">{stats.transactions.thisWeek.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">This Month</span>
              <span className="text-white font-semibold">{stats.transactions.thisMonth.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-3 border-t border-gray-700">
              <span className="text-gray-400">Pending</span>
              <span className="text-yellow-400 font-semibold">{stats.transactions.pending}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Failed</span>
              <span className="text-red-400 font-semibold">{stats.transactions.failed}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Alerts */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Security Monitoring
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Security Events (24h)</div>
            <div className="text-2xl font-bold text-white">{stats.security.securityEvents24h}</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Failed Logins (24h)</div>
            <div className="text-2xl font-bold text-orange-400">{stats.security.failedLogins24h}</div>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Suspicious Activities</div>
            <div className="text-2xl font-bold text-red-400">{stats.security.suspiciousActivities}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

