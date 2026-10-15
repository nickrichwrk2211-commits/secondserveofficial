import type {
  User,
  FoodListing,
  MenuItem,
  FoodRequest,
  AppNotification,
  AuditLog,
  PlatformStats,
} from './types';

const TOKEN_KEY = 'secondserve_auth_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // ignore
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(endpoint, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data as T;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        throw new Error('Server response timed out. Please check connection and try again.');
      }
      throw err;
    }
    throw new Error('An unknown error occurred.');
  }
}

export const api = {
  // Auth
  async getMe(): Promise<{ user: User }> {
    return request<{ user: User }>('/api/auth/me');
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await request<{ user: User; token: string; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(res.token);
    return res;
  },

  async register(payload: {
    name: string;
    email: string;
    password: string;
    role: string;
    organizationName?: string;
    contactPerson?: string;
    phone?: string;
    address?: string;
    operatingArea?: string;
  }): Promise<{ user: User; token: string; message: string }> {
    const res = await request<{ user: User; token: string; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(res.token);
    return res;
  },

  async resetPassword(email: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  logout() {
    setStoredToken(null);
  },

  // Stats
  async getStats(): Promise<{ stats: PlatformStats }> {
    return request<{ stats: PlatformStats }>('/api/stats');
  },

  // Listings
  async getListings(params?: {
    category?: string;
    status?: string;
    restaurantId?: string;
    search?: string;
  }): Promise<{ listings: FoodListing[] }> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'All') query.set('category', params.category);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.restaurantId) query.set('restaurantId', params.restaurantId);
    if (params?.search) query.set('search', params.search);

    const qs = query.toString() ? `?${query.toString()}` : '';
    return request<{ listings: FoodListing[] }>(`/api/listings${qs}`);
  },

  async getListing(id: string): Promise<{ listing: FoodListing }> {
    return request<{ listing: FoodListing }>(`/api/listings/${id}`);
  },

  async createListing(data: Partial<FoodListing>): Promise<{ listing: FoodListing; message: string }> {
    return request<{ listing: FoodListing; message: string }>('/api/listings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateListing(
    id: string,
    data: Partial<FoodListing>
  ): Promise<{ listing: FoodListing; message: string }> {
    return request<{ listing: FoodListing; message: string }>(`/api/listings/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Menu items
  async getMenuItems(restaurantId?: string): Promise<{ menuItems: MenuItem[] }> {
    const qs = restaurantId ? `?restaurantId=${restaurantId}` : '';
    return request<{ menuItems: MenuItem[] }>(`/api/menu${qs}`);
  },

  async createMenuItem(data: Partial<MenuItem>): Promise<{ menuItem: MenuItem; message: string }> {
    return request<{ menuItem: MenuItem; message: string }>('/api/menu', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteMenuItem(id: string): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>(`/api/menu/${id}`, {
      method: 'DELETE',
    });
  },

  // Requests
  async getRequests(): Promise<{ requests: FoodRequest[] }> {
    return request<{ requests: FoodRequest[] }>('/api/requests');
  },

  async createRequest(
    listingId: string,
    requestedQuantity: number
  ): Promise<{ request: FoodRequest; message: string }> {
    return request<{ request: FoodRequest; message: string }>('/api/requests', {
      method: 'POST',
      body: JSON.stringify({ listingId, requestedQuantity }),
    });
  },

  async updateRequestStatus(
    id: string,
    status: string,
    reason?: string
  ): Promise<{ request: FoodRequest; message: string }> {
    return request<{ request: FoodRequest; message: string }>(`/api/requests/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: AppNotification[] }> {
    return request<{ notifications: AppNotification[] }>('/api/notifications');
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    return request<{ success: boolean }>(`/api/notifications/${id}/read`, {
      method: 'PATCH',
    });
  },

  async markAllNotificationsRead(): Promise<{ count: number }> {
    return request<{ count: number }>('/api/notifications/read-all', {
      method: 'POST',
    });
  },

  // Admin
  async getAdminUsers(): Promise<{ users: User[] }> {
    return request<{ users: User[] }>('/api/admin/users');
  },

  async updateUserVerification(
    id: string,
    status: 'verified' | 'rejected' | 'pending'
  ): Promise<{ user: User; message: string }> {
    return request<{ user: User; message: string }>(`/api/admin/users/${id}/verification`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async updateUserStatus(
    id: string,
    status: 'active' | 'suspended'
  ): Promise<{ user: User; message: string }> {
    return request<{ user: User; message: string }>(`/api/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async moderateListing(
    id: string,
    action: 'cancel',
    reason?: string
  ): Promise<{ listing: FoodListing; message: string }> {
    return request<{ listing: FoodListing; message: string }>(`/api/admin/listings/${id}/moderate`, {
      method: 'PATCH',
      body: JSON.stringify({ action, reason }),
    });
  },

  async getAuditLogs(): Promise<{ auditLogs: AuditLog[] }> {
    return request<{ auditLogs: AuditLog[] }>('/api/admin/audit-logs');
  },

  async resetData(): Promise<{ success: boolean; message: string }> {
    return request<{ success: boolean; message: string }>('/api/admin/reset', {
      method: 'POST',
    });
  },
};
