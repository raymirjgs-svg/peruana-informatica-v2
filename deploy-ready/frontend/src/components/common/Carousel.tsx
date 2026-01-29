// ============================================
// src/components/common/Carousel.tsx
// ============================================
'use client';

import { useState, useEffect } from 'react';
import { CarouselService, CarouselSlide as ApiSlide } from '@/services/CarouselService';

interface CarouselSlide extends ApiSlide {}

// Slides por defecto si no se pueden cargar desde el backend
const defaultSlides: CarouselSlide[] = [
  {
    id: 1,
    title: '¡Bienvenido a Peruana de Informática!',
    description: 'Descubre nuestra amplia selección de equipos tecnológicos de calidad. Garantía oficial y envío rápido a todo el Perú.',
    buttonText: 'Ver Productos',
    buttonUrl: '/products',
    backgroundColor: 'from-blue-600 to-blue-800',
    order: 0,
  },
  {
    id: 2,
    title: 'Ofertas Especiales',
    description: 'Grandes descuentos en productos seleccionados. No te pierdas nuestras promociones exclusivas.',
    buttonText: 'Ver Ofertas',
    buttonUrl: '/products',
    backgroundColor: 'from-purple-600 to-purple-800',
    order: 1,
  },
  {
    id: 3,
    title: 'Envío Gratis',
    description: 'En compras mayores a S/. 100. Llegamos a todo el Perú en 2-3 días hábiles.',
    buttonText: 'Comprar Ahora',
    buttonUrl: '/products',
    backgroundColor: 'from-green-600 to-green-800',
    order: 2,
  },
];

export function Carousel() {
  const [slides, setSlides] = useState<CarouselSlide[]>(defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  
  // Helper para obtener la URL completa de la imagen
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return '';
    // Si es una URL relativa (empieza con /), prependemos el baseUrl del backend
    if (imageUrl.startsWith('/')) {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      return `${baseUrl}${imageUrl}`;
    }
    return imageUrl;
  };

  // Cargar slides desde el backend
  useEffect(() => {
    const loadSlides = async () => {
      const carouselService = new CarouselService();
      const activeSlides = await carouselService.getActiveSlides();
      
      if (activeSlides && activeSlides.length > 0) {
        setSlides(activeSlides);
      }
      // Si no hay slides del backend, se mantienen los slides por defecto
    };

    loadSlides();
  }, []);

  // Auto-play del carousel
  useEffect(() => {
    if (!isAutoPlay || slides.length === 0) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Cambiar cada 5 segundos

    return () => clearInterval(timer);
  }, [isAutoPlay, slides.length]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlay(false);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlay(false);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlay(false);
  };

  // const currentSlideData = slides[currentSlide]; // Variable no utilizada

  return (
    <div className="relative w-full mb-16 rounded-xl overflow-hidden shadow-2xl">
      {/* Contenedor del carrusel */}
      <div className="relative h-96 md:h-[500px] bg-gray-900">
        {/* Slides */}
        {slides.map((s, index) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Si hay imagen URL, usarla como fondo */}
            {s.imageUrl ? (
              <>
                {/* Fondo con imagen */}
                <div 
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${getImageUrl(s.imageUrl)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                  }}
                >
                  {/* Overlay oscuro para mejorar legibilidad */}
                  <div className="absolute inset-0 bg-black/20" />
                </div>

                {/* Contenido superpuesto */}
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4">
                    <div className="max-w-2xl">
                      {/* Texto */}
                      <div className="text-white z-10">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight drop-shadow-lg">
                          {s.title}
                        </h2>
                        <p className="text-lg md:text-xl text-white/90 mb-8 drop-shadow">
                          {s.description}
                        </p>
                        <a
                          href={s.buttonUrl}
                          className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition transform hover:scale-105 shadow-xl"
                        >
                          {s.buttonText} →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Fondo con gradiente (sin imagen) */}
                <div className={`absolute inset-0 bg-gradient-to-r ${s.backgroundColor}`} />

                {/* Contenido */}
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-4">
                    <div className="max-w-2xl">
                      {/* Texto */}
                      <div className="text-white z-10">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                          {s.title}
                        </h2>
                        <p className="text-lg md:text-xl text-white/90 mb-8">
                          {s.description}
                        </p>
                        <a
                          href={s.buttonUrl}
                          className="inline-block bg-white text-gray-900 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition transform hover:scale-105"
                        >
                          {s.buttonText} →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}

        {/* Botones de navegación */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition"
          aria-label="Anterior"
        >
          ←
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/30 hover:bg-white/50 text-white p-3 rounded-full transition"
          aria-label="Siguiente"
        >
          →
        </button>

        {/* Indicadores */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-3 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 w-3 hover:bg-white/70'
              }`}
              aria-label={`Ir a slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Indicador de auto-play */}
        <button
          onClick={() => setIsAutoPlay(!isAutoPlay)}
          className="absolute top-4 right-4 z-20 bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-full text-sm transition"
        >
          {isAutoPlay ? '⏸ Pausar' : '▶ Reanudar'}
        </button>
      </div>

      {/* Información adicional debajo del carrusel */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-6">
        <div className="container mx-auto">
          <div className="text-center md:text-left">
            <p className="text-gray-700 font-semibold">
              Slide {currentSlide + 1} de {slides.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}