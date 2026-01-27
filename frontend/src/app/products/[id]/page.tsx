// frontend/src/app/products/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { productService, Product } from '@/lib/products';
import { adminService } from '@/lib/admin';
import { useAuthContext } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Loader2, 
  MessageCircle, 
  MapPin, 
  Eye, 
  Calendar,
  Edit,
  Trash2,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
  Pin,
  Check
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAdmin } = useAuthContext();
  const { toast } = useToast();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pinning, setPinning] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  async function loadProduct() {
    try {
      const data = await productService.getProduct(productId);
      setProduct(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await productService.deleteProduct(productId);
      toast({
        title: "Product deleted",
        description: "Your product has been removed successfully.",
      });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete product');
      setDeleting(false);
    }
  }

  async function handlePinToggle() {
    if (!product) return;
    
    setPinning(true);
    try {
      if (product.is_pinned) {
        await adminService.unpinProduct(product.id);
        toast({
          title: "Product unpinned",
          description: "This product is no longer featured.",
        });
      } else {
        await adminService.pinProduct(product.id);
        toast({
          title: "Product pinned!",
          description: "This product is now featured on the homepage.",
        });
      }
      await loadProduct(); // Reload to get updated pin status
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: err.response?.data?.detail || 'Failed to update pin status',
      });
    } finally {
      setPinning(false);
    }
  }

  function handleCopyLink() {
    const productUrl = `${window.location.origin}/products/${productId}`;
    
    navigator.clipboard.writeText(productUrl).then(() => {
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Product link has been copied to clipboard.",
      });
      
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      toast({
        variant: "destructive",
        title: "Failed to copy",
        description: "Please try again or copy the URL manually.",
      });
    });
  }

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Product not found'}</AlertDescription>
        </Alert>
        <Link href="/">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
    );
  }

  const isOwner = user?.id === product.user_id;
  const whatsappLink = `https://wa.me/${product.whatsapp_number.replace(/[^0-9]/g, '')}`;
  const currentImage = product.images[currentImageIndex]?.image_url || '/placeholder.jpg';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back Button */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Products
            </Button>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="relative aspect-square bg-gray-100">
                <Image
                  src={currentImage}
                  alt={product.product_name}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />

                {/* Navigation Arrows */}
                {product.images.length > 1 && (
                  <>
                    <Button
                      onClick={prevImage}
                      variant="ghost"
                      size="icon"
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      onClick={nextImage}
                      variant="ghost"
                      size="icon"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </Button>

                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
                      {currentImageIndex + 1} / {product.images.length}
                    </div>
                  </>
                )}

                {/* Badges */}
                <div className="absolute top-4 left-4 flex gap-2">
                  {product.is_pinned && (
                    <Badge className="bg-yellow-500 shadow-lg">Featured</Badge>
                  )}
                  {product.is_updated && (
                    <Badge className="bg-blue-500 shadow-lg">Updated</Badge>
                  )}
                </div>
              </div>
            </Card>

            {/* Thumbnail Gallery */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-5 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setCurrentImageIndex(index)}
                    aria-label={`View image ${index + 1}`}
                    title={`View image ${index + 1}`}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      index === currentImageIndex
                        ? 'border-primary shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image.image_url}
                      alt={`${product.product_name} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="100px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Brand */}
                {product.brand_name && (
                  <div>
                    <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
                      {product.brand_name}
                    </p>
                  </div>
                )}

                {/* Product Name */}
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">
                    {product.product_name}
                  </h1>
                </div>

                {/* Price */}
                <div>
                  <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    ₦{product.price.toLocaleString()}
                  </p>
                </div>

                {/* Meta Info */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  {product.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{product.address}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    <span>{product.view_count} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Listed {new Date(product.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <hr />

                {/* Copy Link Button - Visible to Everyone */}
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-600" />
                      Link Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4 mr-2" />
                      Copy Product Link
                    </>
                  )}
                </Button>

                {/* Admin Pin Button */}
                {isAdmin && !isOwner && (
                  <Button
                    onClick={handlePinToggle}
                    variant={product.is_pinned ? "outline" : "default"}
                    className="w-full"
                    disabled={pinning}
                  >
                    {pinning ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Pin className="h-4 w-4 mr-2" />
                    )}
                    {product.is_pinned ? 'Unpin from Featured' : 'Pin to Featured'}
                  </Button>
                )}

                {/* Contact Button */}
                {!isOwner && (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                      <MessageCircle className="h-5 w-5 mr-2" />
                      Contact Seller on WhatsApp
                    </Button>
                  </a>
                )}

                {/* Owner Actions */}
                {isOwner && (
                  <div className="space-y-3">
                    <Alert>
                      <AlertDescription>
                        This is your product. You can edit or delete it.
                      </AlertDescription>
                    </Alert>

                    <div className="flex gap-3">
                      <Link href={`/products/${product.id}/edit`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Product
                        </Button>
                      </Link>

                      <Button
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="flex-1"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-4">Product Information</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Product ID:</span>
                    <span className="font-mono text-xs">{product.id.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant="outline" className="bg-green-50">Active</Badge>
                  </div>
                  {product.is_updated && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span>{new Date(product.updated_at!).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{product.product_name}"? This action cannot be undone and all images will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Product'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}





// // Afia Abia\frontend\src\app\products\[id]\page.tsx

// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { productService, Product } from '@/lib/products';
// import { useAuthContext } from '@/components/AuthProvider';
// import { Button } from '@/components/ui/button';
// import { Badge } from '@/components/ui/badge';
// import { Card, CardContent } from '@/components/ui/card';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import { 
//   Loader2, 
//   MessageCircle, 
//   MapPin, 
//   Eye, 
//   Calendar,
//   Edit,
//   Trash2,
//   ArrowLeft,
//   ChevronLeft,
//   ChevronRight
// } from 'lucide-react';
// import Image from 'next/image';
// import Link from 'next/link';

// export default function ProductDetailPage() {
//   const params = useParams();
//   const router = useRouter();
//   const { user } = useAuthContext();
//   const productId = params.id as string;

//   const [product, setProduct] = useState<Product | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [currentImageIndex, setCurrentImageIndex] = useState(0);
//   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
//   const [deleting, setDeleting] = useState(false);

//   useEffect(() => {
//     loadProduct();
//   }, [productId]);

//   async function loadProduct() {
//     try {
//       const data = await productService.getProduct(productId);
//       setProduct(data);
//     } catch (err: any) {
//       setError(err.response?.data?.detail || 'Failed to load product');
//     } finally {
//       setLoading(false);
//     }
//   }

//   async function handleDelete() {
//     setDeleting(true);
//     try {
//       await productService.deleteProduct(productId);
//       router.push('/');
//     } catch (err: any) {
//       setError(err.response?.data?.detail || 'Failed to delete product');
//       setDeleting(false);
//     }
//   }

//   const nextImage = () => {
//     if (product) {
//       setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
//     }
//   };

//   const prevImage = () => {
//     if (product) {
//       setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin" />
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="container mx-auto px-4 py-8">
//         <Alert variant="destructive">
//           <AlertDescription>{error || 'Product not found'}</AlertDescription>
//         </Alert>
//         <Link href="/">
//           <Button variant="outline" className="mt-4">
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Back to Home
//           </Button>
//         </Link>
//       </div>
//     );
//   }

//   const isOwner = user?.id === product.user_id;
//   const whatsappLink = `https://wa.me/${product.whatsapp_number.replace(/[^0-9]/g, '')}`;
//   const currentImage = product.images[currentImageIndex]?.image_url || '/placeholder.jpg';

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Back Button */}
//       <div className="bg-white border-b">
//         <div className="container mx-auto px-4 py-4">
//           <Link href="/">
//             <Button variant="ghost" size="sm">
//               <ArrowLeft className="h-4 w-4 mr-2" />
//               Back to Products
//             </Button>
//           </Link>
//         </div>
//       </div>

//       <div className="container mx-auto px-4 py-8">
//         <div className="grid lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
//           {/* Image Gallery */}
//           <div className="space-y-4">
//             <Card className="overflow-hidden">
//               <div className="relative aspect-square bg-gray-100">
//                 <Image
//                   src={currentImage}
//                   alt={product.product_name}
//                   fill
//                   className="object-cover"
//                   priority
//                   sizes="(max-width: 1024px) 100vw, 50vw"
//                 />

//                 {/* Navigation Arrows */}
//                 {product.images.length > 1 && (
//                   <>
//                     <Button
//                       onClick={prevImage}
//                       variant="ghost"
//                       size="icon"
//                       className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
//                     >
//                       <ChevronLeft className="h-5 w-5" />
//                     </Button>
//                     <Button
//                       onClick={nextImage}
//                       variant="ghost"
//                       size="icon"
//                       className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 hover:bg-white shadow-lg"
//                     >
//                       <ChevronRight className="h-5 w-5" />
//                     </Button>

//                     {/* Image Counter */}
//                     <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm">
//                       {currentImageIndex + 1} / {product.images.length}
//                     </div>
//                   </>
//                 )}

//                 {/* Badges */}
//                 <div className="absolute top-4 left-4 flex gap-2">
//                   {product.is_pinned && (
//                     <Badge className="bg-yellow-500 shadow-lg">Featured</Badge>
//                   )}
//                   {product.is_updated && (
//                     <Badge className="bg-blue-500 shadow-lg">Updated</Badge>
//                   )}
//                 </div>
//               </div>
//             </Card>

//             {/* Thumbnail Gallery */}
//             {product.images.length > 1 && (
//               <div className="grid grid-cols-5 gap-2">
//                 {product.images.map((image, index) => (
//                   <button
//                   key={image.id}
//                   type="button"
//                   onClick={() => setCurrentImageIndex(index)}
//                   aria-label={`View image ${index + 1}`}
//                   title={`View image ${index + 1}`}
//                   className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
//                     index === currentImageIndex
//                     ? 'border-primary shadow-md scale-105'
//                     : 'border-gray-200 hover:border-gray-300'
//                     }`}
//                     > 

//                     <Image
//                       src={image.image_url}
//                       alt={`${product.product_name} - Image ${index + 1}`}
//                       fill
//                       className="object-cover"
//                       sizes="100px"
//                     />
//                   </button>
//                 ))}
//               </div>
//             )}
//           </div>

//           {/* Product Info */}
//           <div className="space-y-6">
//             <Card>
//               <CardContent className="p-6 space-y-6">
//                 {/* Brand */}
//                 {product.brand_name && (
//                   <div>
//                     <p className="text-sm text-muted-foreground uppercase tracking-wide font-semibold">
//                       {product.brand_name}
//                     </p>
//                   </div>
//                 )}

//                 {/* Product Name */}
//                 <div>
//                   <h1 className="text-3xl md:text-4xl font-bold">
//                     {product.product_name}
//                   </h1>
//                 </div>

//                 {/* Price */}
//                 <div>
//                   <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//                     ₦{product.price.toLocaleString()}
//                   </p>
//                 </div>

//                 {/* Meta Info */}
//                 <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
//                   {product.address && (
//                     <div className="flex items-center gap-2">
//                       <MapPin className="h-4 w-4" />
//                       <span>{product.address}</span>
//                     </div>
//                   )}
//                   <div className="flex items-center gap-2">
//                     <Eye className="h-4 w-4" />
//                     <span>{product.view_count} views</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Calendar className="h-4 w-4" />
//                     <span>
//                       Listed {new Date(product.created_at).toLocaleDateString()}
//                     </span>
//                   </div>
//                 </div>

//                 <hr />

//                 {/* Contact Button */}
//                 {!isOwner && (
//                   <a
//                     href={whatsappLink}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="block"
//                   >
//                     <Button className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
//                       <MessageCircle className="h-5 w-5 mr-2" />
//                       Contact Seller on WhatsApp
//                     </Button>
//                   </a>
//                 )}

//                 {/* Owner Actions */}
//                 {isOwner && (
//                   <div className="space-y-3">
//                     <Alert>
//                       <AlertDescription>
//                         This is your product. You can edit or delete it.
//                       </AlertDescription>
//                     </Alert>

//                     <div className="flex gap-3">
//                       <Link href={`/products/${product.id}/edit`} className="flex-1">
//                         <Button variant="outline" className="w-full">
//                           <Edit className="h-4 w-4 mr-2" />
//                           Edit Product
//                         </Button>
//                       </Link>

//                       <Button
//                         variant="destructive"
//                         onClick={() => setDeleteDialogOpen(true)}
//                         className="flex-1"
//                       >
//                         <Trash2 className="h-4 w-4 mr-2" />
//                         Delete
//                       </Button>
//                     </div>
//                   </div>
//                 )}
//               </CardContent>
//             </Card>

//             {/* Additional Info */}
//             <Card>
//               <CardContent className="p-6">
//                 <h3 className="font-semibold text-lg mb-4">Product Information</h3>
//                 <div className="space-y-3 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Product ID:</span>
//                     <span className="font-mono text-xs">{product.id.slice(0, 8)}...</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Status:</span>
//                     <Badge variant="outline" className="bg-green-50">Active</Badge>
//                   </div>
//                   {product.is_updated && (
//                     <div className="flex justify-between">
//                       <span className="text-muted-foreground">Last Updated:</span>
//                       <span>{new Date(product.updated_at!).toLocaleDateString()}</span>
//                     </div>
//                   )}
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete Product</AlertDialogTitle>
//             <AlertDialogDescription>
//               Are you sure you want to delete "{product.product_name}"? This action cannot be undone and all images will be permanently deleted.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={handleDelete}
//               disabled={deleting}
//               className="bg-red-600 hover:bg-red-700"
//             >
//               {deleting ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                   Deleting...
//                 </>
//               ) : (
//                 'Delete Product'
//               )}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   );
// }