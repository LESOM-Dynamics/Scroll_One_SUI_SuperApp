"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/admin/AdminLayout";
import DashboardOverview from "@/components/admin/DashboardOverview";
import UsersManagement from "@/components/admin/UsersManagement";
import TransactionsManagement from "@/components/admin/TransactionsManagement";
import MiniAppsManagement from "@/components/admin/MiniAppsManagement";
import SecurityMonitoring from "@/components/admin/SecurityMonitoring";
import SystemHealth from "@/components/admin/SystemHealth";
import AdminActionsLog from "@/components/admin/AdminActionsLog";
import { adminApi } from "@/lib/adminApi";

type TabType = "overview" | "users" | "transactions" | "miniapps" | "security" | "health" | "actions";

export default function AdminSuperDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check authentication
    const checkAuth = async () => {
      try {
        // Get token from localStorage (in production, use secure storage)
        const token = localStorage.getItem("admin_token");
        
        if (!token) {
          // Redirect to login or show login form
          setError("Authentication required. Please log in with your Super Admin wallet.");
          setIsLoading(false);
          return;
        }

        // Verify token by trying to fetch dashboard stats
        try {
          await adminApi.getDashboardStats(token);
          setIsAuthenticated(true);
          setError(null);
        } catch (err: any) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            setError("Unauthorized. Super Admin access required.");
            localStorage.removeItem("admin_token");
          } else {
            setError("Failed to verify authentication.");
          }
        }
      } catch (err) {
        setError("Authentication check failed.");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogin = async (walletAddress: string, message: string, signature: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // First, get auth message
      const authRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/auth/wallet/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress, message, signature }),
      });

      if (!authRes.ok) {
        throw new Error("Authentication failed");
      }

      const authData = await authRes.json();
      const token = authData.data?.token;

      if (!token) {
        throw new Error("No token received");
      }

      // Store token
      localStorage.setItem("admin_token", token);

      // Verify admin access
      await adminApi.getDashboardStats(token);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Login failed");
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
    return (
      <AdminLoginForm onLogin={handleLogin} error={error} />
    );
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

function AdminLoginForm({ onLogin, error }: { onLogin: (wallet: string, message: string, signature: string) => void; error: string | null }) {
  const [walletAddress, setWalletAddress] = useState("");
  const [message, setMessage] = useState("");
  const [signature, setSignature] = useState("");

  const handleWalletConnect = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("Please install MetaMask or another Web3 wallet");
      return;
    }

    try {
      const accounts = await (window as any).ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length === 0) {
        throw new Error("No accounts found");
      }

      const address = accounts[0];
      setWalletAddress(address);

      // Get auth message
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api/v1/auth/wallet/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await res.json();
      const authMessage = data.data?.message;
      setMessage(authMessage);

      // Sign message
      const sig = await (window as any).ethereum.request({
        method: "personal_sign",
        params: [authMessage, address],
      });

      setSignature(sig);
      onLogin(address, authMessage, sig);
    } catch (err: any) {
      alert(err.message || "Failed to connect wallet");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-white mb-2">Super Admin Dashboard</h1>
        <p className="text-gray-400 mb-6">Sign in with your Super Admin wallet</p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleWalletConnect}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          Connect Wallet
        </button>

        <p className="text-gray-500 text-sm mt-4 text-center">
          Only wallets with Super Admin role can access this dashboard
        </p>
      </div>
    </div>
  );
}

