"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { Activity, CheckCircle, AlertCircle, XCircle } from "lucide-react";

interface HealthMetric {
  metric_type: string;
  avg_value: number;
  max_value: number;
  min_value: number;
  last_updated: string;
}

export default function SystemHealth() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const data = await adminApi.getSystemHealth(token);
      setMetrics(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load system health");
    } finally {
      setLoading(false);
    }
  };

  const getHealthStatus = (metric: HealthMetric) => {
    // Simple health check logic - can be customized
    if (metric.avg_value > 0.9) return { status: "healthy", color: "green", icon: CheckCircle };
    if (metric.avg_value > 0.7) return { status: "warning", color: "yellow", icon: AlertCircle };
    return { status: "critical", color: "red", icon: XCircle };
  };

  if (loading && metrics.length === 0) {
    return <div className="text-center py-12">Loading system health...</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">System Health</h2>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {metrics.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <p className="text-gray-400">No health metrics available. System health monitoring will appear here once metrics are collected.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric) => {
            const health = getHealthStatus(metric);
            const Icon = health.icon;
            return (
              <div
                key={metric.metric_type}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white capitalize">
                    {metric.metric_type.replace(/_/g, " ")}
                  </h3>
                  <Icon className={`w-6 h-6 text-${health.color}-400`} />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Average</span>
                    <span className="text-white font-semibold">{metric.avg_value.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Max</span>
                    <span className="text-white">{metric.max_value.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Min</span>
                    <span className="text-white">{metric.min_value.toFixed(4)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <span className="text-xs text-gray-500">
                      Last updated: {new Date(metric.last_updated).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

