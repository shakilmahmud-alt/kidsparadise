// KidsParadise Frontend API Client for Express + MySQL Backend

export function getToken(): string | null {
  return localStorage.getItem('auth_token');
}

export function setToken(token: string) {
  localStorage.setItem('auth_token', token);
}

export function removeToken() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export function getStoredUser(): any | null {
  const u = localStorage.getItem('auth_user');
  if (!u) return null;
  try {
    return JSON.parse(u);
  } catch (e) {
    return null;
  }
}

export function setStoredUser(user: any) {
  localStorage.setItem('auth_user', JSON.stringify(user));
}

async function request(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }
  return data;
}

export const api = {
  // Auth
  auth: {
    async login(email: string, password: string) {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      if (data.token) setToken(data.token);
      if (data.user) setStoredUser(data.user);
      return data;
    },
    async register(email: string, password: string, fullName?: string) {
      const data = await request('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, fullName })
      });
      if (data.token) setToken(data.token);
      if (data.user) setStoredUser(data.user);
      return data;
    },
    async getMe() {
      return await request('/api/auth/me');
    },
    logout() {
      removeToken();
    }
  },

  // Store Unified Data
  async getStoreData() {
    return await request('/api/store-data');
  },

  // Products
  async addProduct(product: any) {
    return await request('/api/products', { method: 'POST', body: JSON.stringify(product) });
  },
  async updateProduct(id: string, product: any) {
    return await request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(product) });
  },
  async deleteProduct(id: string) {
    return await request(`/api/products/${id}`, { method: 'DELETE' });
  },
  async updateBulkStock(payload: { productIds?: string[]; stock: number; category?: string }) {
    return await request('/api/products-bulk-stock', { method: 'PUT', body: JSON.stringify(payload) });
  },

  // Categories
  async addCategory(category: any) {
    return await request('/api/categories', { method: 'POST', body: JSON.stringify(category) });
  },
  async updateCategory(id: string, category: any) {
    return await request(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(category) });
  },
  async deleteCategory(id: string) {
    return await request(`/api/categories/${id}`, { method: 'DELETE' });
  },

  // Brands
  async addBrand(brand: any) {
    return await request('/api/brands', { method: 'POST', body: JSON.stringify(brand) });
  },
  async deleteBrand(id: string) {
    return await request(`/api/brands/${id}`, { method: 'DELETE' });
  },

  // Orders
  async getOrders() {
    return await request('/api/orders');
  },
  async placeOrder(orderData: any) {
    return await request('/api/orders', { method: 'POST', body: JSON.stringify(orderData) });
  },
  async updateOrder(id: string, updateData: any) {
    return await request(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(updateData) });
  },
  async deleteOrder(id: string) {
    return await request(`/api/orders/${id}`, { method: 'DELETE' });
  },

  // Coupons
  async addCoupon(coupon: any) {
    return await request('/api/coupons', { method: 'POST', body: JSON.stringify(coupon) });
  },
  async updateCoupon(id: string, coupon: any) {
    return await request(`/api/coupons/${id}`, { method: 'PUT', body: JSON.stringify(coupon) });
  },
  async deleteCoupon(id: string) {
    return await request(`/api/coupons/${id}`, { method: 'DELETE' });
  },

  // Settings
  async updateSetting(key: string, value: any) {
    return await request('/api/settings', { method: 'POST', body: JSON.stringify({ key, value }) });
  },

  // Reviews
  async addReview(review: any) {
    return await request('/api/reviews', { method: 'POST', body: JSON.stringify(review) });
  },
  async replyReview(id: string, reply: string) {
    return await request(`/api/reviews/${id}`, { method: 'PUT', body: JSON.stringify({ reply }) });
  },

  // Addresses
  async getAddresses() {
    return await request('/api/addresses');
  },
  async addAddress(address: any) {
    return await request('/api/addresses', { method: 'POST', body: JSON.stringify(address) });
  },
  async deleteAddress(id: string) {
    return await request(`/api/addresses/${id}`, { method: 'DELETE' });
  },

  // Wishlist
  async getWishlist() {
    return await request('/api/wishlist');
  },
  async addToWishlist(productId: string) {
    return await request('/api/wishlist', { method: 'POST', body: JSON.stringify({ productId }) });
  },
  async removeFromWishlist(productId: string) {
    return await request(`/api/wishlist/${productId}`, { method: 'DELETE' });
  },

  // Pages
  async addPage(page: any) {
    return await request('/api/pages', { method: 'POST', body: JSON.stringify(page) });
  },
  async updatePage(id: string, page: any) {
    return await request(`/api/pages/${id}`, { method: 'PUT', body: JSON.stringify(page) });
  },
  async deletePage(id: string) {
    return await request(`/api/pages/${id}`, { method: 'DELETE' });
  }
};

export default api;
