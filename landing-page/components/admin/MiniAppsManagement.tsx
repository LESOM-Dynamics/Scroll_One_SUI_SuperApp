"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/adminApi";
import { CheckCircle, Star, XCircle } from "lucide-react";

interface MiniApp {
  id: string;
  app_id: string;
  name: string;
  description?: string;
  category?: string;
  verified: boolean;
  featured: boolean;
  stats: any;
  created_at: string;
}

export default function MiniAppsManagement() {
  const [apps, setApps] = useState<MiniApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Note: This would need a backend endpoint to list all mini-apps
    // For now, we'll show a placeholder
    setLoading(false);
  }, []);

  const handleUpdateApp = async (appId: string, updates: { verified?: boolean; featured?: boolean }) => {
    try {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      await adminApi.updateMiniApp(token, appId, updates);
      // Refresh list
      // fetchApps();
    } catch (err: any) {
      alert(err.message || "Failed to update mini-app");
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Mini-Apps Management</h2>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <p className="text-gray-400">
          Mini-apps management interface. This would connect to the miniapps API endpoint to list and manage all mini-apps.
        </p>
        <p className="text-gray-500 text-sm mt-2">
          Features: Verify apps, feature apps, view analytics, manage categories
        </p>
      </div>
    </div>
  );
}

