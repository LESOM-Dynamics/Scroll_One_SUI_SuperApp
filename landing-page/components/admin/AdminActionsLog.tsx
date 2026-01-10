"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { FileText, User, Package, Shield } from "lucide-react";

interface AdminAction {
  id: string;
  admin_id: string;
  admin_wallet_address?: string;
  admin_username?: string;
  action_type: string;
  resource_type: string;
  resource_id?: string;
  details: any;
  ip_address?: string;
  created_at: string;
}

export default function AdminActionsLog() {
  const [actions, setActions] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionTypeFilter, setActionTypeFilter] = useState("");
  const [resourceTypeFilter, setResourceTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchActions();
  }, [page, actionTypeFilter, resourceTypeFilter]);

  const fetchActions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("admin_token");
      if (!token) {
        setError("Not authenticated");
        return;
      }

      const data = await adminApi.getAdminActions(token, {
        actionType: actionTypeFilter || undefined,
        resourceType: resourceTypeFilter || undefined,
        page,
        limit: 50,
      });

      setActions(data.actions || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch (err: any) {
      setError(err.message || "Failed to load admin actions");
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case "user":
        return <User className="w-4 h-4" />;
      case "miniapp":
        return <Package className="w-4 h-4" />;
      case "security":
        return <Shield className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  if (loading && actions.length === 0) {
    return <div className="text-center py-12">Loading audit log...</div>;
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Admin Actions Audit Log</h2>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={actionTypeFilter}
            onChange={(e) => {
              setActionTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
          >
            <option value="">All Action Types</option>
            <option value="user_update">User Update</option>
            <option value="miniapp_update">Mini-App Update</option>
            <option value="token_update">Token Update</option>
          </select>
          <select
            value={resourceTypeFilter}
            onChange={(e) => {
              setResourceTypeFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-purple-500 focus:outline-none"
          >
            <option value="">All Resource Types</option>
            <option value="user">User</option>
            <option value="miniapp">Mini-App</option>
            <option value="token">Token</option>
          </select>
          <button
            onClick={() => {
              setActionTypeFilter("");
              setResourceTypeFilter("");
              setPage(1);
            }}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Actions List */}
      <div className="space-y-4">
        {actions.map((action) => (
          <div
            key={action.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="mt-1">
                  {getResourceIcon(action.resource_type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-white">{action.action_type}</h3>
                    <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded">
                      {action.resource_type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400 mb-2">
                    Admin: {action.admin_wallet_address || action.admin_username || action.admin_id.slice(0, 8)}
                  </div>
                  {action.resource_id && (
                    <div className="text-sm text-gray-500 font-mono mb-2">
                      Resource ID: {action.resource_id}
                    </div>
                  )}
                  {action.ip_address && (
                    <div className="text-sm text-gray-500 mb-2">
                      IP: {action.ip_address}
                    </div>
                  )}
                  {action.details && Object.keys(action.details).length > 0 && (
                    <details className="mt-2">
                      <summary className="text-sm text-gray-400 cursor-pointer">View Details</summary>
                      <pre className="mt-2 text-xs text-gray-500 bg-black/20 p-2 rounded overflow-auto">
                        {JSON.stringify(action.details, null, 2)}
                      </pre>
                    </details>
                  )}
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(action.created_at).toLocaleString()}
                  </div>
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

