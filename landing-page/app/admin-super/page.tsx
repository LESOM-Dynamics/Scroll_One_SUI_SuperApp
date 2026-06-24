"use client";

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardOverview from "@/components/admin/DashboardOverview";
import UsersManagement from "@/components/admin/UsersManagement";
import TransactionsManagement from "@/components/admin/TransactionsManagement";
import MiniAppsManagement from "@/components/admin/MiniAppsManagement";
import SecurityMonitoring from "@/components/admin/SecurityMonitoring";
import SystemHealth from "@/components/admin/SystemHealth";
import AdminActionsLog from "@/components/admin/AdminActionsLog";
import { adminApi } from "@/lib/adminApi";
import { signInWithSuiWallet } from "@/lib/suiWalletAuth";

type TabType = "overview" | "users" | "transactions" | "miniapps" | "security" | "health" | "actions";

export default function AdminSuperDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("admin_token");

        if (!token) {
          setError("Authentication required. Sign in with your Super Admin Sui wallet.");
          setIsLoading(false);
          return;
        }

        try {
          await adminApi.getDashboardStats(token);
          setIsAuthenticated(true);
          setError(null);
        } catch (err: unknown) {
          const status = (err as { response?: { status?: number } })?.response?.status;
          if (status === 401 || status === 403) {
            setError("Unauthorized. Super Admin access required.");
            localStorage.removeItem("admin_token");
          } else {
            setError("Failed to verify authentication.");
          }
        }
      } catch {
        setError("Authentication check failed.");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (walletAddress: string, message: string, signature: string, token: string) => {
    try {
      setIsLoading(true);
      setError(null);

      localStorage.setItem("admin_token", token);
      await adminApi.getDashboardStats(token);
      setIsAuthenticated(true);
      setError(null);
      console.log("[Admin] Authenticated as", walletAddress, message.length, signature.length);
    } catch (err: unknown) {
      const messageText = err instanceof Error ? err.message : "Login failed";
      setError(messageText);
      localStorage.removeItem("admin_token");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLoginForm onLogin={handleLogin} error={error} />;
  }

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "overview" && <DashboardOverview />}
      {activeTab === "users" && <UsersManagement />}
      {activeTab === "transactions" && <TransactionsManagement />}
      {activeTab === "miniapps" && <MiniAppsManagement />}
      {activeTab === "security" && <SecurityMonitoring />}
      {activeTab === "health" && <SystemHealth />}
      {activeTab === "actions" && <AdminActionsLog />}
    </AdminLayout>
  );
}

function AdminLoginForm({
  onLogin,
  error,
}: {
  onLogin: (wallet: string, message: string, signature: string, token: string) => void;
  error: string | null;
}) {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleWalletConnect = async () => {
    setIsConnecting(true);
    try {
      const session = await signInWithSuiWallet();
      onLogin(session.walletAddress, session.message, session.signature, session.token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect Sui wallet";
      alert(message);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-2">Super Admin Dashboard</h1>
        <p className="text-gray-400 mb-6">Sign in with your Super Admin Sui wallet</p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleWalletConnect}
          disabled={isConnecting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {isConnecting ? "Connecting..." : "Connect Sui Wallet"}
        </button>

        <p className="text-gray-500 text-sm mt-4 text-center">
          Requires the Sui Wallet browser extension and a wallet with Super Admin role
        </p>
      </div>
    </div>
  );
}
