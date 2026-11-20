'use client';

interface ProductGalleryProps {
  images: string[];
  productName: string;
  selectedImage: number;
  onSelectImage: (index: number) => void;
}

const FALLBACK_IMAGE = 'https://placehold.co/600x600?text=Imagen+no+disponible';

export function ProductGallery({ images, productName, selectedImage, onSelectImage }: ProductGalleryProps) {
  return (
    <div>
      <div className="bg-gray-100 rounded-xl h-96 flex items-center justify-center mb-4 border-2 border-gray-200 overflow-hidden">
        {images[selectedImage] ? (
          <img
            src={images[selectedImage]}
            alt={productName}
            className="w-full h-full object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = FALLBACK_IMAGE;
            }}
          />
        ) : (
          <div className="text-9xl">🖥️</div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        {images.map((img, index) => (
          <button
            key={index}
            type="button"
            aria-label={`Ver imagen ${index + 1} de ${images.length} de ${productName}`}
            aria-pressed={selectedImage === index}
            onClick={() => onSelectImage(index)}
            className={`w-16 h-16 rounded-lg border-2 flex items-center justify-center text-2xl transition ${selectedImage === index
              ? 'border-brand-red-500 bg-brand-red-50'
              : 'border-gray-200 bg-gray-100 hover:border-gray-300'
              }`}
          >
            {img ? (
              <img
                src={img}
                alt={`Imagen ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = FALLBACK_IMAGE;
                }}
              />
            ) : (
              <div className="text-xl">🖥️</div>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-4">
        <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
          ✅ En Stock
        </span>
        <span className="bg-brand-red-100 text-brand-red-800 px-3 py-1 rounded-full text-sm font-medium">
          🚚 Envío a todo el Perú
        </span>
        <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
          🛡️ Garantía
        </span>
      </div>
    </div>
  );
}
