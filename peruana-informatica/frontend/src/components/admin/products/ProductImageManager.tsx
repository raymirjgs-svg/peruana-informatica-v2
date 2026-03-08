"use client";

import React, { useState, useEffect } from "react";
import { ProductImage } from "@/models/Product";
import { ImageService } from "@/services/ImageService";
import { Button } from "@/components/admin/Button";

interface ProductImageManagerProps {
  productId: number;
  onImagesUpdate?: (images: ProductImage[]) => void;
}

export function ProductImageManager({ productId, onImagesUpdate }: ProductImageManagerProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [addingImage, setAddingImage] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const imageService = new ImageService();

  const loadImages = async () => {
    setLoading(true);
    try {
      const productImages = await imageService.getImagesByProduct(productId);
      setImages(productImages);
      if (onImagesUpdate) {
        onImagesUpdate(productImages);
      }
    } catch (err: any) {
      setError(err?.message || "Error al cargar imágenes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      loadImages();
    }
  }, [productId]);

  const handleAddImage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newImageUrl.trim()) {
      setError("La URL de la imagen es requerida");
      return;
    }

    try {
      setAddingImage(true);
      setError(null);
      
      // Validate URL
      try {
        const url = new URL(newImageUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new Error('URL inválida');
        }
      } catch {
        throw new Error('La URL de imagen no es válida');
      }

      const newImage = await imageService.createImage(productId, newImageUrl);
      if (newImage) {
        setImages([...images, newImage]);
        setNewImageUrl("");
        if (onImagesUpdate) {
          onImagesUpdate([...images, newImage]);
        }
      } else {
        throw new Error("No se pudo crear la imagen");
      }
    } catch (err: any) {
      setError(err?.message || "Error al agregar imagen");
    } finally {
      setAddingImage(false);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm("¿Eliminar esta imagen?")) return;

    try {
      setDeletingImageId(imageId);
      setError(null);
      
      const success = await imageService.deleteImage(imageId);
      if (success) {
        const updatedImages = images.filter(img => img.cod_galeria !== imageId);
        setImages(updatedImages);
        if (onImagesUpdate) {
          onImagesUpdate(updatedImages);
        }
      } else {
        throw new Error("No se pudo eliminar la imagen");
      }
    } catch (err: any) {
      setError(err?.message || "Error al eliminar imagen");
    } finally {
      setDeletingImageId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Cargando imágenes...</div>;
  }

  return (
    <div className="border rounded-lg p-4">
      <h3 className="text-lg font-semibold mb-4">Galería de Imágenes</h3>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Add new image form */}
      <div className="mb-6 flex gap-2">
        <input
          type="url"
          placeholder="https://ejemplo.com/imagen.jpg"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          value={newImageUrl}
          onChange={(e) => setNewImageUrl(e.target.value)}
          disabled={addingImage}
        />
        <Button type="button" onClick={() => handleAddImage()} isLoading={addingImage} disabled={addingImage}>
          Agregar
        </Button>
      </div>

      {/* Images grid */}
      {images.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No hay imágenes para este producto
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div key={image.cod_galeria} className="border rounded-lg overflow-hidden">
              <div className="aspect-square bg-gray-100 flex items-center justify-center">
                {image.imagen ? (
                  <img
                    src={image.imagen.startsWith('http') ? image.imagen : `/uploads/${image.imagen}`}
                    alt={`Imagen ${image.cod_galeria}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/no-image.svg";
                    }}
                  />
                ) : (
                  <div className="text-gray-400">Sin imagen</div>
                )}
              </div>
              <div className="p-2 flex justify-between items-center">
                <span className="text-xs text-gray-500">ID: {image.cod_galeria}</span>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDeleteImage(image.cod_galeria)}
                  isLoading={deletingImageId === image.cod_galeria}
                  disabled={deletingImageId === image.cod_galeria}
                >
                  🗑️
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}