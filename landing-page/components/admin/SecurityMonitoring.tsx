"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { AlertTriangle, Shield, Lock } from "lucide-react";

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id?: string;
  wallet_address?: string;
  ip_address?: string;
  user_agent?: string;
  metadata: any;
  created_at: string;
}

export default function SecurityMonitoring() {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEvents();
  }, [page, eventTypeFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const data = await adminApi.getSecurityEvents(token, {
        eventType: eventTypeFilter || undefined,
        page,
        limit: 50,
      });

      setEvents(data.events || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load security events");
    } finally {
      setLoading(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    if (eventType.includes("failed") || eventType.includes("suspicious")) {
      return <AlertTriangle className="w-5 h-5 text-red-400" />;
    }
    return <Shield className="w-5 h-5 text-blue-400" />;
  };

  const getEventColor = (eventType: string) => {
    if (eventType.includes("failed") || eventType.includes("suspicious") || eventType.includes("fraud")) {
      return "bg-red-900/50 border-red-500";
    }
    if (eventType.includes("login") || eventType.includes("auth")) {
      return "bg-blue-900/50 border-blue-500";
    }
    return "bg-gray-700/50 border-gray-600";
  };

  if (loading && events.length === 0) {
    return <div className="text-center py-12">Loading security events...</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Security Monitoring</h2>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <select
          value={eventTypeFilter}
          onChange={(e) => {
            setEventTypeFilter(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
        >
          <option value="">All Event Types</option>
          <option value="login_failed">Failed Logins</option>
          <option value="suspicious_activity">Suspicious Activity</option>
          <option value="fraud_detected">Fraud Detected</option>
          <option value="login">Login Events</option>
        </select>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className={`${getEventColor(event.event_type)} border rounded-lg p-4`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                {getEventIcon(event.event_type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{event.event_type}</h3>
                    <span className="text-xs text-gray-400">
                      {new Date(event.created_at).toLocaleString()}
                    </span>
                  </div>
                  {event.wallet_address && (
                    <p className="text-sm text-gray-300 font-mono mb-1">
                      Wallet: {event.wallet_address.slice(0, 6)}...{event.wallet_address.slice(-4)}
                    </p>
                  )}
                  {event.ip_address && (
                    <p className="text-sm text-gray-400">IP: {event.ip_address}</p>
                  )}
                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-400 cursor-pointer">Details</summary>
                      <pre className="mt-2 text-xs text-gray-500 bg-black/20 p-2 rounded overflow-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Page {page} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

