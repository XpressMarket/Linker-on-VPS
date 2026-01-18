
// frontend/src/lib/products.ts
import { api } from './api';

export interface Product {
  id: string;
  user_id: string;
  product_name: string;
  brand_name?: string;
  price: number;
  address?: string;
  whatsapp_number: string;
  is_pinned: boolean;
  view_count: number;
  images: ProductImage[];
  created_at: string;
  updated_at: string;
  is_updated: boolean;
}

export interface ProductImage {
  id: string;
  image_url: string;
  display_order: number;
}

export interface ProductFormData {
  product_name: string;
  brand_name?: string;
  price: number;
  address?: string;
  whatsapp_number: string;
  images: File[];
}

export const productService = {
  async getProducts(params: {
    page?: number;
    page_size?: number;
    search?: string;
    brand?: string;
    min_price?: number;
    max_price?: number;
  } = {}) {
    const response = await api.get('/products', { params });
    return response.data;
  },

  async getFeaturedProducts() {
    const response = await api.get('/products/featured');
    return response.data;
  },

  async getProduct(id: string) {
    const response = await api.get(`/products/${id}`);
    return response.data;
  },

  async createProduct(data: ProductFormData) {
    const formData = new FormData();
    formData.append('product_name', data.product_name);
    formData.append('price', data.price.toString());
    formData.append('whatsapp_number', data.whatsapp_number);
    
    if (data.brand_name) {
      formData.append('brand_name', data.brand_name);
    }
    if (data.address) {
      formData.append('address', data.address);
    }
    
    data.images.forEach((image) => {
      formData.append('images', image);
    });
    
    const response = await api.post('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },

  async updateProduct(id: string, data: Partial<ProductFormData>) {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  },

  async deleteProduct(id: string) {
    await api.delete(`/products/${id}`);
  },
};

