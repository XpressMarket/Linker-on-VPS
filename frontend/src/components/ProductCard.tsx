// frontend/src/components/ProductCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/products';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, MapPin } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const whatsappLink = `https://wa.me/${product.whatsapp_number.replace(/[^0-9]/g, '')}`;
  const primaryImage = product.images[0]?.image_url || '/placeholder.jpg';

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden">
          <Image
            src={primaryImage}
            alt={product.product_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          {product.is_pinned && (
            <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
              Featured
            </Badge>
          )}
          
          {product.is_updated && (
            <Badge className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600">
              Updated
            </Badge>
          )}
        </div>
      </Link>

      <CardContent className="p-4">
        <div className="space-y-2">
          {product.brand_name && (
            <p className="text-sm text-muted-foreground font-medium">
              {product.brand_name}
            </p>
          )}
          
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
              {product.product_name}
            </h3>
          </Link>

          <p className="text-2xl font-bold text-primary">
            ₦{product.price.toLocaleString()}
          </p>

          {product.address && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="line-clamp-1">{product.address}</span>
            </div>
          )}

          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageCircle className="h-4 w-4" />
            Contact on WhatsApp
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
