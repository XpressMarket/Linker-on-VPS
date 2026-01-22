
import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/products';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle, MapPin, Eye, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  featured?: boolean;
}

export function ProductCard({ product, featured = false }: ProductCardProps) {
  const whatsappLink = `https://wa.me/${product.whatsapp_number.replace(/[^0-9]/g, '')}`;
  const primaryImage = product.images[0]?.image_url || '/placeholder.jpg';

  if (featured) {
    return (
      <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-500 border-2 border-purple-200 bg-white/80 backdrop-blur-sm">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image Section */}
          <Link href={`/products/${product.id}`}>
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={primaryImage}
                alt={product.product_name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
                {product.is_updated && (
                  <Badge className="bg-blue-500 hover:bg-blue-600 shadow-lg">
                    Updated
                  </Badge>
                )}
              </div>

              {product.view_count > 0 && (
                <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {product.view_count}
                </div>
              )}
            </div>
          </Link>

          {/* Content Section */}
          <CardContent className="p-6 flex flex-col justify-center">
            {product.brand_name && (
              <p className="text-sm text-purple-600 font-semibold mb-2 uppercase tracking-wide">
                {product.brand_name}
              </p>
            )}
            
            <Link href={`/products/${product.id}`}>
              <h3 className="font-bold text-2xl md:text-3xl mb-3 hover:text-purple-600 transition-colors line-clamp-2">
                {product.product_name}
              </h3>
            </Link>

            <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-4">
              ₦{product.price.toLocaleString()}
            </p>

            {product.address && (
              <div className="flex items-center gap-2 text-gray-600 mb-6">
                <MapPin className="h-4 w-4" />
                <span className="text-sm line-clamp-1">{product.address}</span>
              </div>
            )}

            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all transform hover:scale-105 shadow-lg"
              onClick={(e) => e.stopPropagation()}
              >
              <MessageCircle className="h-5 w-5" />
              Contact on WhatsApp
            </a>
          </CardContent>
        </div>
      </Card>
    );
  }

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 h-full flex flex-col">
      <Link href={`/products/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-gray-100">
          <Image
            src={primaryImage}
            alt={product.product_name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          
          <div className="absolute top-2 left-2 flex gap-2 flex-wrap">
            {product.is_pinned && (
              <Badge className="bg-yellow-500 hover:bg-yellow-600 shadow-md">
                Featured
              </Badge>
            )}
            {product.is_updated && (
              <Badge className="bg-blue-500 hover:bg-blue-600 shadow-md">
                Updated
              </Badge>
            )}
          </div>

          {product.view_count > 0 && (
            <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {product.view_count}
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex-1">
          {product.brand_name && (
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">
              {product.brand_name}
            </p>
          )}
          
          <Link href={`/products/${product.id}`}>
            <h3 className="font-semibold text-base line-clamp-2 hover:text-primary transition-colors mb-2">
              {product.product_name}
            </h3>
          </Link>

          <p className="text-2xl font-bold text-primary mb-3">
            ₦{product.price.toLocaleString()}
          </p>

          {product.address && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="line-clamp-1">{product.address}</span>
            </div>
          )}
        </div>

        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium text-sm"
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="h-4 w-4" />
          Contact Seller
        </a>
      </CardContent>
    </Card>
  );
}


// frontend/src/components/ProductCard.tsx


// import Image from 'next/image';
// import Link from 'next/link';
// import { Product } from '@/lib/products';
// import { Badge } from '@/components/ui/badge';
// import { Card, CardContent } from '@/components/ui/card';
// import { MessageCircle, MapPin } from 'lucide-react';

// interface ProductCardProps {
//   product: Product;
// }

// export function ProductCard({ product }: ProductCardProps) {
//   const whatsappLink = `https://wa.me/${product.whatsapp_number.replace(/[^0-9]/g, '')}`;
//   const primaryImage = product.images[0]?.image_url || '/placeholder.jpg';

//   return (
//     <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300">
//       <Link href={`/products/${product.id}`}>
//         <div className="relative aspect-square overflow-hidden">
//           <Image
//             src={primaryImage}
//             alt={product.product_name}
//             fill
//             className="object-cover group-hover:scale-105 transition-transform duration-300"
//             sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//           />
          
//           {product.is_pinned && (
//             <Badge className="absolute top-2 left-2 bg-yellow-500 hover:bg-yellow-600">
//               Featured
//             </Badge>
//           )}
          
//           {product.is_updated && (
//             <Badge className="absolute top-2 right-2 bg-blue-500 hover:bg-blue-600">
//               Updated
//             </Badge>
//           )}
//         </div>
//       </Link>

//       <CardContent className="p-4">
//         <div className="space-y-2">
//           {product.brand_name && (
//             <p className="text-sm text-muted-foreground font-medium">
//               {product.brand_name}
//             </p>
//           )}
          
//           <Link href={`/products/${product.id}`}>
//             <h3 className="font-semibold text-lg line-clamp-2 hover:text-primary transition-colors">
//               {product.product_name}
//             </h3>
//           </Link>

//           <p className="text-2xl font-bold text-primary">
//             ₦{product.price.toLocaleString()}
//           </p>

//           {product.address && (
//             <div className="flex items-center gap-1 text-sm text-muted-foreground">
//               <MapPin className="h-4 w-4" />
//               <span className="line-clamp-1">{product.address}</span>
//             </div>
//           )}

//           <a
//             href={whatsappLink}
//             target="_blank"
//             rel="noopener noreferrer"
//             className="flex items-center justify-center gap-2 w-full mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <MessageCircle className="h-4 w-4" />
//             Contact on WhatsApp
//           </a>
//         </div>
//       </CardContent>
//     </Card>
//   );
// }
