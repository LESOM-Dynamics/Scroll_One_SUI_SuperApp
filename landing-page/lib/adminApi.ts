const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export class AdminApi {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api/v1/admin`;
  }

  private async request(endpoint: string, token: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getDashboardStats(token: string) {
    const response = await this.request("/dashboard/stats", token);
    return response.data;
  }

  async getUsers(token: string, filters?: {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.search) params.append("search", filters.search);
    if (filters?.role) params.append("role", filters.role);
    if (filters?.status) params.append("status", filters.status);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const query = params.toString();
    const response = await this.request(`/users${query ? `?${query}` : ""}`, token);
    return response.data;
  }

  async updateUser(token: string, userId: string, updates: { role?: string; status?: string }) {
    const response = await this.request(`/users/${userId}`, token, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  async getTransactions(token: string, filters?: {
    status?: string;
    type?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.status) params.append("status", filters.status);
    if (filters?.type) params.append("type", filters.type);
    if (filters?.fromDate) params.append("fromDate", filters.fromDate);
    if (filters?.toDate) params.append("toDate", filters.toDate);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const query = params.toString();
    const response = await this.request(`/transactions${query ? `?${query}` : ""}`, token);
    return response.data;
  }

  async updateMiniApp(token: string, appId: string, updates: { verified?: boolean; featured?: boolean }) {
    const response = await this.request(`/miniapps/${appId}`, token, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
    return response.data;
  }

  async getSecurityEvents(token: string, filters?: {
    eventType?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.eventType) params.append("eventType", filters.eventType);
    if (filters?.userId) params.append("userId", filters.userId);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const query = params.toString();
    const response = await this.request(`/security/events${query ? `?${query}` : ""}`, token);
    return response.data;
  }

  async getSystemHealth(token: string) {
    const response = await this.request("/system/health", token);
    return response.data;
  }

  async getAdminActions(token: string, filters?: {
    adminId?: string;
    actionType?: string;
    resourceType?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.adminId) params.append("adminId", filters.adminId);
    if (filters?.actionType) params.append("actionType", filters.actionType);
    if (filters?.resourceType) params.append("resourceType", filters.resourceType);
    if (filters?.page) params.append("page", filters.page.toString());
    if (filters?.limit) params.append("limit", filters.limit.toString());

    const query = params.toString();
    const response = await this.request(`/actions${query ? `?${query}` : ""}`, token);
    return response.data;
  }
}

export const adminApi = new AdminApi();

