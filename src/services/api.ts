// API Service for connecting to the new Node.js backend

interface User {
  _id: string;
  email: string;
  username: string;
  isAdmin: boolean;
  deductions: number;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DailyEntry {
  _id: string;
  userId: string;
  date: string;
  cashAmount?: number;
  networkAmount?: number;
  purchasesAmount?: number;
  advanceAmount?: number;
  notes?: string;
  total: number;
  remaining: number;
  attachments?: Array<{
    filename: string;
    originalName: string;
    path: string;
    mimetype: string;
    size: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface MonthlyAdvance {
  _id: string;
  userId: string;
  yearMonth: string;
  totalAdvances: number;
  createdAt: string;
  updatedAt: string;
}

interface ApiResponse<T> {
  message?: string;
  user?: User;
  users?: User[];
  entries?: DailyEntry[];
  advances?: MonthlyAdvance[];
  entry?: DailyEntry;
  count?: number;
  token?: string;
  totalUsers?: number;
  totalEntries?: number;
  totalAdvances?: number;
  recentEntries?: DailyEntry[];
  monthlyStats?: {
    totalCash: number;
    totalNetwork: number;
    totalPurchases: number;
    totalAdvances: number;
  };
}

// قراءة عنوان API من المتغيرات البيئية
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || process.env.VITE_API_URL || 'http://localhost:5000/api';

// Debug: Log the API URL being used
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('📦 Vite Env:', import.meta.env);
console.log('🔧 Process Env:', process.env);

// التحقق من صحة العنوان
if (!API_BASE_URL || API_BASE_URL === 'http://localhost:5000/api') {
  console.warn('⚠️ Warning: Using default API URL. Check VITE_API_URL in .env file');
  console.warn('📁 Current directory:', process.cwd());
}

class ApiService {
  private baseURL: string;
  private token: string | null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('token');
  }

  // Set authentication token
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Get authentication headers
  private getHeaders(contentType?: string): Record<string, string> {
    const headers: Record<string, string> = {};

    // لا نضع Content-Type إذا كان contentType فارغاً أو FormData
    if (contentType && contentType !== 'multipart/form-data') {
      headers['Content-Type'] = contentType;
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    // إذا كان body هو FormData، لا تضع أي headers (حتى Authorization)
    if (options.body instanceof FormData) {
      options.headers = undefined;
    } else {
      const contentType = (options.headers as any)?.['Content-Type'] || 'application/json';
      const defaultHeaders = this.getHeaders(contentType);
      options.headers = { ...defaultHeaders, ...(options.headers || {}) };
    }

    try {
      console.log(`Making API request to: ${url}`);
      console.log('Request config:', {
        method: options.method,
        headers: options.headers,
        body: options.body
      });
      console.log('🔗 Full URL:', url);
      console.log('🌐 Base URL:', this.baseURL);

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API Error ${response.status}:`, errorData);

        // إضافة تفاصيل أكثر للأخطاء
        if (errorData.details && Array.isArray(errorData.details)) {
          const errorMessages = errorData.details.map((d: any) => d.msg).join(', ');
          throw new Error(errorMessages || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: ApiResponse<T> = await response.json();
      return data;
    } catch (error) {
      console.error('API Error:', error);
      console.error('🔗 Request URL:', url);
      console.error('🌐 Base URL:', this.baseURL);

      if (error instanceof Error) {
        // تحسين رسائل الخطأ لـ CORS
        if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
          throw new Error(`خطأ في الاتصال بالخادم: ${this.baseURL}. تأكد من أن الخادم يعمل وأن إعدادات CORS صحيحة.`);
        }
        throw error;
      } else {
        throw new Error('حدث خطأ في الاتصال بالخادم');
      }
    }
  }

  // Authentication endpoints
  async register(userData: { email: string; password: string; username: string }): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async login(credentials: { email: string; password: string }): Promise<ApiResponse<User>> {
    const data = await this.request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    if (data.token) {
      this.setToken(data.token);
    }

    return data;
  }

  logout(): void {
    this.setToken(null);
  }

  async getProfile(): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile');
  }

  async updateProfile(profileData: { username?: string; email?: string }): Promise<ApiResponse<User>> {
    return this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse<null>> {
    return this.request<null>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData)
    });
  }

  async getDailyEntries(params: Record<string, any> = {}): Promise<ApiResponse<DailyEntry[]>> {
    if (!this.token) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/daily-entries${queryString ? `?${queryString}` : ''}`;
    return this.request<DailyEntry[]>(endpoint);
  }

  async createDailyEntry(entryData: Record<string, any>, files: File[] = []): Promise<ApiResponse<DailyEntry>> {
    const formData = new FormData();

    formData.append('date', String(entryData.date));

    for (const key in entryData) {
      if (key !== 'date' && entryData[key] !== undefined && entryData[key] !== null) {
        formData.append(key, String(entryData[key]));
      }
    }

    if (files?.length > 0) {
      files.forEach(file => {
        formData.append('files', file);
      });
    }

    for (let [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    // إرسال التوكن في query string
    const endpoint = this.token ? `/daily-entries/create?token=${this.token}` : '/daily-entries/create';

    // لا تضع أي headers هنا إطلاقاً
    return this.request<DailyEntry>(endpoint, {
      method: 'POST',
      body: formData
    });
  }

  async updateDailyEntry(entryId: string, entryData: Record<string, any>, files: File[] = []): Promise<ApiResponse<DailyEntry>> {
    if (files.length > 0) {
      const formData = new FormData();
      Object.keys(entryData).forEach(key => {
        if (entryData[key] !== undefined && entryData[key] !== null) {
          formData.append(key, entryData[key]);
        }
      });
      files.forEach(file => {
        formData.append('files', file);
      });

      // إرسال التوكن في query string
      const endpoint = this.token ? `/daily-entries/${entryId}?token=${this.token}` : `/daily-entries/${entryId}`;

      // لا تضع أي headers هنا إطلاقاً
      return this.request<DailyEntry>(endpoint, {
        method: 'PUT',
        body: formData
      });
    }
    return this.request<DailyEntry>(`/daily-entries/${entryId}`, {
      method: 'PUT',
      body: JSON.stringify(entryData)
    });
  }

  async deleteDailyEntry(entryId: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/daily-entries/${entryId}`, {
      method: 'DELETE'
    });
  }

  async getMonthlyAdvances(params: Record<string, any> = {}): Promise<ApiResponse<MonthlyAdvance[]>> {
    if (!this.token) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/daily-entries/monthly-advances${queryString ? `?${queryString}` : ''}`;
    return this.request<MonthlyAdvance[]>(endpoint);
  }

  async getDeductions(params: Record<string, any> = {}): Promise<ApiResponse<any[]>> {
    if (!this.token) throw new Error('يجب تسجيل الدخول أولاً');
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/daily-entries/deductions${queryString ? `?${queryString}` : ''}`;
    return this.request<any[]>(endpoint);
  }

  async addDeduction(userId: string, amount: number, reason: string): Promise<ApiResponse<any>> {
    if (!this.token) throw new Error('يجب تسجيل الدخول أولاً');

    const data = {
      userId: String(userId),
      amount: Number(amount),
      reason: String(reason)
    };
    console.log('Sending deduction data:', data);
    return this.request<any>('/admin/users/deduction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async getEntryStats(params: Record<string, any> = {}): Promise<ApiResponse<{
    totalEntries: number;
    totalCash: number;
    totalNetwork: number;
    totalPurchases: number;
    totalAdvances: number;
    totalIncome: number;
    totalRemaining: number;
  }>> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/daily-entries/stats${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async getAllUsers(): Promise<ApiResponse<User[]>> {
    if (!this.token) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }
    return this.request<User[]>('/admin/users');
  }

  async updateUserDeductions(userId: string, deductions: number): Promise<ApiResponse<User>> {
    return this.request<User>('/admin/users/deductions', {
      method: 'PUT',
      body: JSON.stringify({ userId, deductions })
    });
  }

  async updateUsername(userId: string, newUsername: string): Promise<ApiResponse<User>> {
    return this.request<User>('/admin/users/username', {
      method: 'PUT',
      body: JSON.stringify({ userId, newUsername })
    });
  }
  async updateUserEmail(userId: string, newEmail: string): Promise<ApiResponse<User>> {
    return this.request<User>('/admin/users/email', {
      method: 'PUT',
      body: JSON.stringify({ userId, newEmail })
    });
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<ApiResponse<User>> {
    return this.request<User>('/admin/users/password', {
      method: 'PUT',
      body: JSON.stringify({ userId, newPassword })
    });
  }

  async deleteUser(userId: string): Promise<ApiResponse<null>> {
    return this.request<null>(`/admin/users/${userId}`, {
      method: 'DELETE'
    });
  }

  async completeSystemReset(confirmationText: string): Promise<ApiResponse<null>> {
    return this.request<null>('/admin/system-reset', {
      method: 'POST',
      body: JSON.stringify({ confirmationText })
    });
  }

  async resetDataOnly(confirmationText: string) {
    return this.request('/admin/reset-data', {
      method: 'POST',
      body: JSON.stringify({ confirmationText })
    });
  }

  async getSystemStats(): Promise<ApiResponse<{
    totalUsers: number;
    totalEntries: number;
    totalAdvances: number;
    recentEntries: DailyEntry[];
    monthlyStats: {
      totalCash: number;
      totalNetwork: number;
      totalPurchases: number;
      totalAdvances: number;
    };
  }>> {
    return this.request('/admin/stats');
  }

  async toggleAdminStatus(userId: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/admin/users/${userId}/admin-status`, {
      method: 'PUT'
    });
  }

  // User endpoints
  async getUser(userId: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/users/${userId}`);
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<User>('/users/profile/me');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  getToken(): string | null {
    return this.token;
  }

  getFileUrl(filename: string): string {
    // استخدام عنوان API بدلاً من عنوان الفرونت إند
    try {
      const apiBase = this.baseURL.replace('/api', '');
      return `${apiBase}/uploads/${filename}`;
    } catch (error) {
      console.error('Error generating file URL:', error);
      // fallback إلى localhost في حالة الخطأ
      return `http://localhost:5000/uploads/${filename}`;
    }
  }

  async deleteAttachment(entryId: string, attachmentId: string) {
    return this.request(`/daily-entries/${entryId}/attachments/${attachmentId}`, {
      method: "DELETE",
    });
  }

  async deleteUserImage(userId: string, imageUrl: string) {
    return this.request(`/users/${userId}/images`, {
      method: 'DELETE',
      body: JSON.stringify({ imageUrl })
    });
  }

  async getAdminSummary(params: Record<string, any> = {}): Promise<any> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/admin/summary${queryString ? `?${queryString}` : ''}`;
    return this.request(endpoint);
  }

  async deleteAllEntriesForUser(userId: string) {
    return this.request(`/daily-entries/user/${userId}/all-entries`, {
      method: 'DELETE',
    });
  }

  async updateUserAdvances(userId: string, advances: number): Promise<ApiResponse<User>> {
    return this.request<User>('/admin/users/advances', {
      method: 'PUT',
      body: JSON.stringify({ userId, advances })
    });
  }
}

const apiService = new ApiService();

export default apiService;
export type { User, DailyEntry, MonthlyAdvance, ApiResponse };