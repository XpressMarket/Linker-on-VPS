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

  // ============================================
  // 🆕 RBAC ENDPOINTS
  // ============================================

  // Get current admin's pin quota
  async getMyPinQuota() {
    const response = await api.get('/admin/my-pin-quota');
    return response.data;
  },

  // Get all pin quotas (executive_admin and platform_owner only)
  async getAllPinQuotas() {
    const response = await api.get('/admin/pin-quotas');
    return response.data;
  },

  // Get manageable users (returns users you can assign roles to)
  async getManageableUsers() {
    const response = await api.get('/admin/manageable-users');
    return response.data;
  },

  // Get role change history
  async getRoleChanges(limit: number = 50) {
    const response = await api.get('/admin/role-changes', {
      params: { limit },
    });
    return response.data;
  },

  // ✅ FIXED: Assign role (executive_admin or platform_owner only)
  async assignRole(userId: string, role: string, reason?: string) {
    const response = await api.post('/admin/assign-role', {
      target_user_id: userId,  // ✅ Fixed: was "user_id" - must match backend Pydantic schema
      new_role: role,           // ✅ Fixed: was "role" - must match backend Pydantic schema
      reason: reason,
    });
    return response.data;
  },

  // Legacy admin assignment (kept for backwards compatibility)
  async assignAdmin(userId: string) {
    const response = await api.post('/admin/assign-admin', {
      user_id: userId,
    });
    return response.data;
  },

  // Legacy admin removal (kept for backwards compatibility)
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




// // frontend/src/lib/admin.ts
// import { api } from './api';

// export const adminService = {
//   async getStats() {
//     const response = await api.get('/admin/stats');
//     return response.data;
//   },

//   async pinProduct(productId: string) {
//     const response = await api.post('/admin/pin-product', {
//       product_id: productId,
//     });
//     return response.data;
//   },

//   async unpinProduct(productId: string) {
//     const response = await api.post('/admin/unpin-product', {
//       product_id: productId,
//     });
//     return response.data;
//   },

//   async deleteProduct(productId: string) {
//     await api.delete(`/admin/products/${productId}`);
//   },

//   async getActivityLogs(limit: number = 50) {
//     const response = await api.get('/admin/activity-logs', {
//       params: { limit },
//     });
//     return response.data;
//   },

//   // ============================================
//   // 🆕 RBAC ENDPOINTS
//   // ============================================

//   // Get current admin's pin quota
//   async getMyPinQuota() {
//     const response = await api.get('/admin/my-pin-quota');
//     return response.data;
//   },

//   // Get all pin quotas (executive_admin and platform_owner only)
//   async getAllPinQuotas() {
//     const response = await api.get('/admin/pin-quotas');
//     return response.data;
//   },

//   // Get manageable users (returns users you can assign roles to)
//   async getManageableUsers() {
//     const response = await api.get('/admin/manageable-users');
//     return response.data;
//   },

//   // Get role change history
//   async getRoleChanges(limit: number = 50) {
//     const response = await api.get('/admin/role-changes', {
//       params: { limit },
//     });
//     return response.data;
//   },

//   // Assign role (executive_admin or platform_owner only)
//   async assignRole(userId: string, role: string, reason?: string) {
//     const response = await api.post('/admin/assign-role', {
//       user_id: userId,
//       role: role,
//       reason: reason,
//     });
//     return response.data;
//   },

//   // Legacy admin assignment (kept for backwards compatibility)
//   async assignAdmin(userId: string) {
//     const response = await api.post('/admin/assign-admin', {
//       user_id: userId,
//     });
//     return response.data;
//   },

//   // Legacy admin removal (kept for backwards compatibility)
//   async removeAdmin(userId: string) {
//     const response = await api.post('/admin/remove-admin', {
//       user_id: userId,
//     });
//     return response.data;
//   },

//   async getAllUsers(page: number = 1, pageSize: number = 50) {
//     const response = await api.get('/admin/users', {
//       params: { page, page_size: pageSize },
//     });
//     return response.data;
//   },
// };




// // frontend/src/lib/admin.ts
// import { api } from './api';

// export const adminService = {
//   async getStats() {
//     const response = await api.get('/admin/stats');
//     return response.data;
//   },

//   async pinProduct(productId: string) {
//     const response = await api.post('/admin/pin-product', {
//       product_id: productId,
//     });
//     return response.data;
//   },

//   async unpinProduct(productId: string) {
//     const response = await api.post('/admin/unpin-product', {
//       product_id: productId,
//     });
//     return response.data;
//   },

//   async deleteProduct(productId: string) {
//     await api.delete(`/admin/products/${productId}`);
//   },

//   async getActivityLogs(limit: number = 50) {
//     const response = await api.get('/admin/activity-logs', {
//       params: { limit },
//     });
//     return response.data;
//   },

//   async assignAdmin(userId: string) {
//     const response = await api.post('/admin/assign-admin', {
//       user_id: userId,
//     });
//     return response.data;
//   },

//   async removeAdmin(userId: string) {
//     const response = await api.post('/admin/remove-admin', {
//       user_id: userId,
//     });
//     return response.data;
//   },

//   async getAllUsers(page: number = 1, pageSize: number = 50) {
//     const response = await api.get('/admin/users', {
//       params: { page, page_size: pageSize },
//     });
//     return response.data;
//   },
// };
