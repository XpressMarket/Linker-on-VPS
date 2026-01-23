'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productService, Product } from '@/lib/products';
import { useAuthContext } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    product_name: '',
    brand_name: '',
    price: '',
    address: '',
    whatsapp_number: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      const data = await productService.getProduct(productId);
      
      // Check if user is the owner
      if (data.user_id !== user?.id) {
        router.push('/');
        return;
      }

      setProduct(data);
      setFormData({
        product_name: data.product_name,
        brand_name: data.brand_name || '',
        price: data.price.toString(),
        address: data.address || '',
        whatsapp_number: data.whatsapp_number,
      });
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await productService.updateProduct(productId, {
        product_name: formData.product_name,
        brand_name: formData.brand_name || undefined,
        price: parseFloat(formData.price),
        address: formData.address || undefined,
        whatsapp_number: formData.whatsapp_number,
      });

      router.push(`/products/${productId}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>Product not found or you don't have permission to edit it.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href={`/products/${productId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Product
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Product</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Alert>
                <AlertDescription>
                  Note: You cannot change product images after uploading. To change images, delete this product and create a new one.
                </AlertDescription>
              </Alert>

              {/* Product Name */}
              <div className="space-y-2">
                <Label htmlFor="product_name">Product Name *</Label>
                <Input
                  id="product_name"
                  name="product_name"
                  value={formData.product_name}
                  onChange={handleInputChange}
                  placeholder="e.g., iPhone 14 Pro Max"
                  required
                  disabled={saving}
                />
              </div>

              {/* Brand Name */}
              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand Name</Label>
                <Input
                  id="brand_name"
                  name="brand_name"
                  value={formData.brand_name}
                  onChange={handleInputChange}
                  placeholder="e.g., Apple"
                  disabled={saving}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label htmlFor="price">Price (₦) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="e.g., 1500000"
                  required
                  disabled={saving}
                />
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-2">
                <Label htmlFor="whatsapp_number">WhatsApp Number *</Label>
                <Input
                  id="whatsapp_number"
                  name="whatsapp_number"
                  type="tel"
                  value={formData.whatsapp_number}
                  onChange={handleInputChange}
                  placeholder="e.g., +2348012345678"
                  required
                  disabled={saving}
                />
                <p className="text-xs text-muted-foreground">
                  Include country code (e.g., +234 for Nigeria)
                </p>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <Label htmlFor="address">Location</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="e.g., Lekki Phase 1, Lagos"
                  rows={3}
                  disabled={saving}
                />
              </div>

              <div className="flex gap-3">
                <Link href={`/products/${productId}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full" disabled={saving}>
                    Cancel
                  </Button>
                </Link>

                <Button type="submit" className="flex-1" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}