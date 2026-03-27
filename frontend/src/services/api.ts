const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api';

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
  register: (body: { email: string; password: string; phone?: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { email: string; password: string }) =>
    request<{ success: boolean; token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

// ─── User ──────────────────────────────────────────────────────────────────
export const userApi = {
  getMe: () => request<any>('/user/me'),
  updateMe: (body: { phone?: string }) =>
    request<any>('/user/me', { method: 'PUT', body: JSON.stringify(body) }),
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
  initiate: (body: { childProfileId: string; amount: number; method: string; bankRef?: string; bankSlipUrl?: string }) =>
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
  send: (body: { senderProfileId: string; receiverProfileId: string; content: string }) =>
    request<any>('/chat/send', { method: 'POST', body: JSON.stringify(body) }),
  history: (myProfileId: string, otherProfileId: string) =>
    request<any>(`/chat/history/${myProfileId}/${otherProfileId}`),
  conversations: (profileId: string) =>
    request<any>(`/chat/conversations/${profileId}`),
};

// ─── Admin ─────────────────────────────────────────────────────────────────
export const adminApi = {
  dashboard: () => request<any>('/admin/dashboard'),
  approvePayment: (body: { paymentId: string; adminNote?: string }) =>
    request<any>('/admin/payment/approve', { method: 'POST', body: JSON.stringify(body) }),
  payments: (status?: string) => request<any>(`/admin/payments${status ? `?status=${status}` : ''}`),
  users: () => request<any>('/admin/users'),
  profiles: (status?: string) => request<any>(`/admin/profiles${status ? `?status=${status}` : ''}`),

  // Packages
  getPackages: () => request<any>('/admin/packages'),
  createPackage: (body: {
    name: string; description?: string; price: number; currency?: string;
    durationDays: number; features?: string[]; isActive?: boolean; sortOrder?: number;
  }) => request<any>('/admin/packages', { method: 'POST', body: JSON.stringify(body) }),
  updatePackage: (id: string, body: Partial<{
    name: string; description: string; price: number; currency: string;
    durationDays: number; features: string[]; isActive: boolean; sortOrder: number;
  }>) => request<any>(`/admin/packages/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePackage: (id: string) => request<any>(`/admin/packages/${id}`, { method: 'DELETE' }),
};

// ─── Public Packages (no auth) ────────────────────────────────────────────
export const packagesApi = {
  getActive: () => request<any>('/packages'),
};

// ─── Public Profiles (no auth) ────────────────────────────────────────────
export const publicProfilesApi = {
  list: (filters?: {
    minAge?: number; maxAge?: number; gender?: string;
    city?: string; ethnicity?: string; civilStatus?: string;
    education?: string; occupation?: string; memberId?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.minAge) params.set('minAge', String(filters.minAge));
    if (filters?.maxAge) params.set('maxAge', String(filters.maxAge));
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
};
