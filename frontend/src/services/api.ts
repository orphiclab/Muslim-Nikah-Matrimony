const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3002/api';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('mn_token');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? 'Request failed');
  }
  return data;
}

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: { email: string; password: string; phone?: string; whatsappNumber?: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  checkAvailability: (body: { email?: string; phone?: string; whatsappNumber?: string }) =>
    request<{ success: boolean; taken: Record<string, string> }>('/auth/check-availability', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  forgotPassword: (email: string) =>
    request<{ success: boolean; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    }),

  validateResetToken: (token: string) =>
    request<{ valid: boolean }>(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`),
};

// ─── User ──────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => request<any>('/user/me'),
  updateMe: (body: { phone?: string; whatsappNumber?: string; phoneVisible?: boolean; whatsappVisible?: boolean }) =>
    request<any>('/user/me', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/user/change-password', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ─── Profiles ──────────────────────────────────────────────────────────────
export const profileApi = {
  create: (body: any) =>
    request<any>('/profile/create', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: any) =>
    request<any>(`/profile/update/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  getMyProfiles: () => request<any>('/profile/my'),
  getOne: (id: string) => request<any>(`/profile/${id}`),
  getVisibleProfiles: (viewerProfileId: string) =>
    request<any>(`/profile/list/${viewerProfileId}`),
  delete: (id: string) => request<any>(`/profile/${id}`, { method: 'DELETE' }),
};

// ─── Subscription ──────────────────────────────────────────────────────────
export const subscriptionApi = {
  status: (childProfileId: string) => request<any>(`/subscription/status/${childProfileId}`),
  mySubscriptions: () => request<any>('/subscription/my'),
};

// ─── Payment ───────────────────────────────────────────────────────────────
export const paymentApi = {
  initiate: (body: {
    childProfileId: string;
    amount: number;
    method: string;
    bankRef?: string;
    bankSlipUrl?: string;
    purpose?: string;
    days?: number;
    currency?: string;
    packageId?: string;
    packageDurationDays?: number;
  }) =>
    request<any>('/payment/initiate', { method: 'POST', body: JSON.stringify(body) }),
  verify: (body: { paymentId: string; gatewayRef: string }) =>
    request<any>('/payment/verify', { method: 'POST', body: JSON.stringify(body) }),
  myPayments: () => request<any>('/payment/my'),
};


// ─── Visibility ────────────────────────────────────────────────────────────
export const visibilityApi = {
  check: (viewerProfileId: string, targetProfileId: string) =>
    request<any>(`/visibility/contact/${viewerProfileId}/${targetProfileId}`),
  toggle: (profileId: string, visible: boolean) =>
    request<any>('/visibility/toggle', { method: 'POST', body: JSON.stringify({ profileId, visible }) }),
};

// ─── Chat ──────────────────────────────────────────────────────────────────
export const chatApi = {
  send: (body: { senderProfileId: string; receiverProfileId: string; content: string; imageUrl?: string }) =>
    request<any>('/chat/send', { method: 'POST', body: JSON.stringify(body) }),
  history: (myProfileId: string, otherProfileId: string) =>
    request<any>(`/chat/history/${myProfileId}/${otherProfileId}`),
  conversations: (profileId: string) =>
    request<any>(`/chat/conversations/${profileId}`),
  markRead: (myProfileId: string, otherProfileId: string) =>
    request<any>('/chat/mark-read', { method: 'POST', body: JSON.stringify({ myProfileId, otherProfileId }) }),
  unreadCounts: (profileId: string) =>
    request<any>(`/chat/unread/${profileId}`),
};

// ─── Admin ─────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => request<any>('/admin/dashboard'),

  // Accept either a plain paymentId string or a full object
  approvePayment: (paymentIdOrBody: string | { paymentId: string; adminNote?: string }) => {
    const body = typeof paymentIdOrBody === 'string'
      ? { paymentId: paymentIdOrBody }
      : paymentIdOrBody;
    return request<any>('/admin/payment/approve', { method: 'POST', body: JSON.stringify(body) });
  },

  rejectPayment: (body: { paymentId: string; reason: string }) =>
    request<any>('/admin/payment/reject', { method: 'POST', body: JSON.stringify(body) }),

  payments: (status?: string) => request<any>(`/admin/payments${status ? `?status=${status}` : ''}`),
  users: () => request<any>('/admin/users'),
  createUser: (body: { email: string; password: string; phone?: string; whatsappNumber?: string; role: string }) =>
    request<any>('/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  getUser: (id: string) => request<any>(`/admin/users/${id}`),
  updateUser: (id: string, body: { phone?: string; whatsappNumber?: string; role?: string }) =>
    request<any>(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  profiles: (status?: string) => request<any>(`/admin/profiles${status ? `?status=${status}` : ''}`),
  getProfile: (id: string) => request<any>(`/admin/profiles/${id}`),

  // Analytics (both names for compatibility)
  analytics: () => request<any>('/admin/analytics'),
  getAnalytics: () => request<any>('/admin/analytics'),

  // Chat Monitor
  getMessages: (limit?: number) => request<any>(`/admin/messages${limit ? `?limit=${limit}` : ''}`),

  // Boosts
  getBoosts: () => request<any>('/admin/boosts'),
  removeBoost: (id: string) => request<any>(`/admin/boosts/${id}`, { method: 'DELETE' }),
  extendBoost: (id: string, days: number) =>
    request<any>(`/admin/boosts/${id}/extend`, { method: 'PUT', body: JSON.stringify({ days }) }),

  // Packages
  getPackages: () => request<any>('/admin/packages'),
  createPackage: (body: {
    name: string; description?: string; price: number; currency?: string;
    durationDays: number; features?: string[]; isActive?: boolean; sortOrder?: number;
    discountPct?: number; originalPrice?: number;
  }) => request<any>('/admin/packages', { method: 'POST', body: JSON.stringify(body) }),
  updatePackage: (id: string, body: {
    name?: string; description?: string; price?: number; currency?: string;
    durationDays?: number; features?: string[]; isActive?: boolean; sortOrder?: number;
    type?: string; discountPct?: number | null; originalPrice?: number | null;
  }) => request<any>(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePackage: (id: string) => request<any>(`/admin/packages/${id}`, { method: 'DELETE' }),

  // Site settings
  getSiteSettings: () => request<any>('/admin/settings'),
  updateSiteSettings: (body: {
    siteDiscountPct?: number;
    siteDiscountLabel?: string;
    siteDiscountActive?: boolean;
    platformCurrency?: string;
    whatsappContact?: string;
    bank1AccName?: string;
    bank1AccNo?: string;
    bank1BankName?: string;
    bank1Branch?: string;
    bank2AccName?: string;
    bank2AccNo?: string;
    bank2BankName?: string;
    bank2Branch?: string;
  }) =>
    request<any>('/admin/settings', { method: 'PUT', body: JSON.stringify(body) }),
};

// ─── Public Packages (no auth) ────────────────────────────────────────────
export const packagesApi = {
  getActive: (type?: string) => request<any>(`/packages${type ? `?type=${type}` : ''}`),
  getSettings: () => request<any>('/settings'),
};


// ─── Public Profiles (no auth) ────────────────────────────────────────────
export const publicProfilesApi = {
  list: (filters?: {
    gender?: string;
    city?: string; ethnicity?: string; civilStatus?: string;
    education?: string; occupation?: string; memberId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.gender) params.set('gender', filters.gender);
    if (filters?.city) params.set('city', filters.city);
    if (filters?.ethnicity) params.set('ethnicity', filters.ethnicity);
    if (filters?.civilStatus) params.set('civilStatus', filters.civilStatus);
    if (filters?.education) params.set('education', filters.education);
    if (filters?.occupation) params.set('occupation', filters.occupation);
    if (filters?.memberId) params.set('memberId', filters.memberId);
    const qs = params.toString();
    return request<any>(`/profiles/public${qs ? `?${qs}` : ''}`);
  },

  getById: (id: string) => request<any>(`/profile/public/${id}`),
};

// ─── Public Site Settings ──────────────────────────────────────────────────
export const settingsApi = {
  get: () => request<any>('/settings'),
};
