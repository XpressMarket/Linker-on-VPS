// frontend/src/lib/admin.ts
import { api } from './api';

export const adminService = {
  async getStats() {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  async pinProduct(productId: string) {
    const response = await api.post('/admin/pin-product', {
      product_id: productId,
    });
    return response.data;
  },

  async unpinProduct(productId: string) {
    const response = await api.post('/admin/unpin-product', {
      product_id: productId,
    });
    return response.data;
  },

  async deleteProduct(productId: string) {
    await api.delete(`/admin/products/${productId}`);
  },

  async getActivityLogs(limit: number = 50) {
    const response = await api.get('/admin/activity-logs', {
      params: { limit },
    });
    return response.data;
  },

  async assignAdmin(userId: string) {
    const response = await api.post('/admin/assign-admin', {
      user_id: userId,
    });
    return response.data;
  },

  async removeAdmin(userId: string) {
    const response = await api.post('/admin/remove-admin', {
      user_id: userId,
    });
    return response.data;
  },

  async getAllUsers(page: number = 1, pageSize: number = 50) {
    const response = await api.get('/admin/users', {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },
};
