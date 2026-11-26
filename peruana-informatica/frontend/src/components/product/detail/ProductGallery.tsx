'use client';

import { CheckCircle2, ShieldCheck, Truck, XCircle } from 'lucide-react';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  selectedImage: number;
  onSelectImage: (index: number) => void;
  stock?: number;
}

const FALLBACK_IMAGE = 'https://placehold.co/600x600?text=Imagen+no+disponible';

export function ProductGallery({
  images,
  productName,
  selectedImage,
  onSelectImage,
  stock,
}: ProductGalleryProps) {
  const inStock = (stock ?? 0) > 0;

  return (
    <div className="lg:sticky lg:top-24 self-start">
      <div className="bg-white rounded-xl h-[380px] lg:h-[520px] flex items-center justify-center mb-4 border border-gray-200 overflow-hidden">
        {images[selectedImage] ? (
          <img
            src={images[selectedImage]}
            alt={productName}
            width={800}
            height={600}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-contain p-4"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = FALLBACK_IMAGE;
            }}
          />
        ) : null}
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 justify-center">
          {images.map((img, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Ver imagen ${index + 1} de ${images.length} de ${productName}`}
              aria-pressed={selectedImage === index}
              onClick={() => onSelectImage(index)}
              className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center transition ${
                selectedImage === index
                  ? 'border-brand-red-500 bg-brand-red-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              {img ? (
                <img
                  src={img}
                  alt={`Imagen ${index + 1}`}
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-contain p-1 rounded-lg"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = FALLBACK_IMAGE;
                  }}
                />
              ) : null}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-4">
        {inStock ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 text-green-700 border border-green-200 px-3 py-1 text-sm font-medium">
            <CheckCircle2 className="w-4 h-4" />
            En stock
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 border border-red-200 px-3 py-1 text-sm font-medium">
            <XCircle className="w-4 h-4" />
            Agotado
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1 text-sm font-medium">
          <Truck className="w-4 h-4" />
          Envío a todo el Perú
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 px-3 py-1 text-sm font-medium">
          <ShieldCheck className="w-4 h-4" />
          Garantía
        </span>
      </div>
    </div>
  );
}
