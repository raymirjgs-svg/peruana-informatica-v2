// ============================================
// 4. src/app/products/[slug]/page.tsx (DETALLE)
// ============================================
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProductService } from '@/services/ProductService';
import { Product } from '@/models/Product';
import { Navigation } from '@/components/common/Navigation';
import { useWishlist } from '@/hooks/useWishlist';
import { useCart } from '@/hooks/useCart';
import { SettingsService, CompanySettings } from '@/services/SettingsService';
import { RelatedProducts } from '@/components/product/RelatedProducts';
import { ProductGallery } from '@/components/product/detail/ProductGallery';
import { ProductPurchasePanel } from '@/components/product/detail/ProductPurchasePanel';
import { ProductTabs } from '@/components/product/detail/ProductTabs';
import { getApiBase } from '@/lib/apiBase';
import { isProductAvailable } from '@/lib/product';

interface ProductDetailProps {
  slug: string;
  initialProduct?: Product | null;
  initialRelated?: Product[];
  initialSettings?: CompanySettings | null;
}

export default function ProductDetailClient({
  slug,
  initialProduct = null,
  initialRelated = [],
  initialSettings = null,
}: ProductDetailProps) {
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(initialRelated);
  const [settings, setSettings] = useState<CompanySettings | null>(initialSettings);

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const { addItem } = useCart();

  // Usar las imágenes reales del producto si están disponibles
  const apiUrl = getApiBase();

  const productImages = product?.images && product.images.length > 0
    ? product.images.map(img => img.imagen.startsWith('http') ? img.imagen : `${apiUrl}/images/products/${img.imagen}`)
    : product?.image
      ? [product.image.startsWith('http') ? product.image : `${apiUrl}/images/products/${product.image}`]
      : ['https://placehold.co/600x600?text=Imagen+no+disponible'];

  useEffect(() => {
    if (initialProduct) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // Cargar configuración
      try {
        const settingsData = await SettingsService.getPublicSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error('Error loading settings:', error);
      }

      if (!slug) return;
      const productService = new ProductService();
      // Decodificar el slug para manejar caracteres especiales
      const decodedSlug = decodeURIComponent(slug);
      const prod = await productService.getProductBySlug(decodedSlug);
      setProduct(prod);

      // Cargar productos relacionados (misma categoría)
      if (prod && prod.category) {
        // Buscar productos de la misma categoría
        const queryParams = new URLSearchParams({
          page: '1',
          limit: '4',
          category: prod.category
        });

        try {
          const result = await productService.getProductsWithFilters(queryParams.toString());
          // Filtrar el producto actual y tomar solo 3
          setRelatedProducts(result.products.filter((p: Product) => p.id !== prod.id).slice(0, 3));
        } catch (error) {
          console.error('Error loading related products:', error);
          // Fallback a productos generales si falla el filtro
          const { products } = await productService.getProducts(1, 4);
          setRelatedProducts(products.filter((p: Product) => p.id !== prod.id).slice(0, 3));
        }
      } else if (prod) {
        // Fallback si no tiene categoría
        const { products } = await productService.getProducts(1, 4);
        setRelatedProducts(products.filter((p: Product) => p.id !== prod.id).slice(0, 3));
      }

      setLoading(false);
    };
    loadData();
  }, [slug, initialProduct]);

  const handleAddToCart = () => {
    if (product && isProductAvailable(product)) {
      for (let i = 0; i < quantity; i++) {
        addItem(product);
      }
    }
  };

  const handleBuyNow = () => {
    handleAddToCart();
    window.location.href = '/cart';
  };

  const handleToggleWishlist = () => {
    if (!product) return;

    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando producto...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Producto no encontrado</h2>
          <p className="text-gray-600 mb-4">El producto que buscas no existe o ha sido removido.</p>
          <Link href="/products" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition">
            Ver todos los productos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        items={[
          { name: 'Inicio', href: '/' },
          { name: 'Productos', href: '/products' },
          { name: product.name, href: `/products/${product.slug}` },
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <ProductGallery
              images={productImages}
              productName={product.name}
              selectedImage={selectedImage}
              onSelectImage={setSelectedImage}
            />
            <ProductPurchasePanel
              product={product}
              settings={settings}
              quantity={quantity}
              isInWishlist={isInWishlist(product.id)}
              onQuantityChange={setQuantity}
              onBuyNow={handleBuyNow}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
            />
          </div>
        </div>

        <ProductTabs
          product={product}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        <RelatedProducts products={relatedProducts} />
      </div>
    </div>
  );
}
