// ============================================
// src/components/common/Carousel.tsx
// ============================================
'use client';

import { useState, useEffect, useCallback } from 'react';
import { CarouselService, CarouselSlide as ApiSlide } from '@/services/CarouselService';
import { getBackendImageUrl } from '@/utils/images';

interface CarouselSlide extends ApiSlide {}

const defaultSlides: CarouselSlide[] = [
  {
    id: 1,
    title: 'Tecnología de Punta para Ti',
    description: 'Laptops, procesadores, monitores y más. Todo con garantía oficial y envío rápido a todo el Perú.',
    buttonText: 'Explorar Catálogo',
    buttonUrl: '/products',
    imageUrl: '/images/banners/banner1.jpg',
    backgroundColor: 'from-[#0a0a0a] to-[#1a1a2e]',
    order: 0,
  },
  {
    id: 2,
    title: 'Ofertas que No Puedes Perder',
    description: 'Descuentos exclusivos en equipos seleccionados. Precios directos del distribuidor oficial.',
    buttonText: 'Ver Ofertas',
    buttonUrl: '/products?clearance=true',
    backgroundColor: 'from-[#1a0000] to-[#3d0000]',
    order: 1,
  },
  {
    id: 3,
    title: 'Envío Gratis a Todo el Perú',
    description: 'En compras mayores a S/. 100. Llegamos en 2-3 días hábiles con seguimiento en tiempo real.',
    buttonText: 'Comprar Ahora',
    buttonUrl: '/products',
    backgroundColor: 'from-[#0d1b2a] to-[#1b263b]',
    order: 2,
  },
];

// Accent colors per slide index
const slideAccents = ['#dc2626', '#ef4444', '#3b82f6'];
const slideLabels = ['CATÁLOGO 2026', 'OFERTA ESPECIAL', 'ENVÍO GRATIS'];

export function Carousel() {
  const [slides, setSlides] = useState<CarouselSlide[]>(defaultSlides);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const loadSlides = async () => {
      const carouselService = new CarouselService();
      const activeSlides = await carouselService.getActiveSlides();
      if (activeSlides && activeSlides.length > 0) {
        setSlides(activeSlides);
      }
    };
    loadSlides();
  }, []);

  const goToSlide = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  useEffect(() => {
    if (!isAutoPlay || slides.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [isAutoPlay, slides.length]);

  const nextSlide = () => {
    goToSlide((currentSlide + 1) % slides.length);
    setIsAutoPlay(false);
  };

  const prevSlide = () => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
    setIsAutoPlay(false);
  };

  const accentColor = slideAccents[currentSlide % slideAccents.length];

  return (
    <div className="relative w-full mb-10 overflow-hidden rounded-2xl shadow-2xl" style={{ height: '480px' }}>

      {/* Tech grid SVG pattern */}
      <svg
        className="absolute inset-0 w-full h-full z-0 opacity-[0.04] pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="techgrid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
          <pattern id="techdots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <circle cx="20" cy="20" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#techgrid)" />
        <rect width="100%" height="100%" fill="url(#techdots)" />
      </svg>

      {/* Slides */}
      {slides.map((s, index) => (
        <div
          key={s.id}
          className="absolute inset-0"
          style={{
            opacity: index === currentSlide ? 1 : 0,
            transform: index === currentSlide
              ? 'translateX(0) scale(1)'
              : index < currentSlide
                ? 'translateX(-3%) scale(0.98)'
                : 'translateX(3%) scale(0.98)',
            transition: 'opacity 0.7s ease, transform 0.7s ease',
            zIndex: index === currentSlide ? 1 : 0,
          }}
        >
          {s.imageUrl ? (
            <>
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `url(${s.imageUrl.startsWith('/images/banners/') ? s.imageUrl : getBackendImageUrl(s.imageUrl)})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
            </>
          ) : (
            <div className={`absolute inset-0 bg-gradient-to-br ${s.backgroundColor || 'from-[#0a0a0a] to-[#1a1a2e]'}`} />
          )}

          {/* Slide content */}
          {(() => {
            const showTitle = s.showTitle !== false;
            const showDesc = s.showDescription !== false;
            const showBtn = s.showButton !== false;
            const pos = s.textPosition || 'left';
            const titleSizeMap = { sm: 'text-2xl md:text-3xl', md: 'text-3xl md:text-4xl', lg: 'text-4xl md:text-5xl', xl: 'text-5xl md:text-6xl' };
            const titleClass = titleSizeMap[s.titleSize || 'lg'];
            const alignClass = pos === 'center' ? 'items-center text-center' : pos === 'right' ? 'items-end text-right' : 'items-start text-left';
            const accentOrigin = pos === 'center' ? 'center' : pos === 'right' ? 'right' : 'left';
            return (
              <div className="absolute inset-0 flex items-center z-10">
                <div className={`w-full px-10 md:px-20 flex flex-col ${alignClass}`} style={{ maxWidth: pos === 'center' ? '100%' : '768px' }}>
                  {/* Label badge */}
                  <div
                    className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase"
                    style={{
                      backgroundColor: `${accentColor}20`,
                      border: `1px solid ${accentColor}60`,
                      color: accentColor,
                      opacity: index === currentSlide ? 1 : 0,
                      transform: index === currentSlide ? 'translateY(0)' : 'translateY(10px)',
                      transition: 'opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: accentColor }} />
                    {slideLabels[index % slideLabels.length]}
                  </div>

                  {showTitle && (
                    <h2
                      className={`${titleClass} font-black text-white mb-4 leading-tight`}
                      style={{
                        opacity: index === currentSlide ? 1 : 0,
                        transform: index === currentSlide ? 'translateY(0)' : 'translateY(15px)',
                        transition: 'opacity 0.6s ease 0.35s, transform 0.6s ease 0.35s',
                        textShadow: '0 2px 20px rgba(0,0,0,0.5)',
                      }}
                    >
                      {s.title}
                    </h2>
                  )}

                  <div
                    className="h-1 w-16 rounded-full mb-4"
                    style={{
                      backgroundColor: accentColor,
                      opacity: index === currentSlide ? 1 : 0,
                      transform: index === currentSlide ? 'scaleX(1)' : 'scaleX(0)',
                      transformOrigin: accentOrigin,
                      transition: 'opacity 0.4s ease 0.5s, transform 0.4s ease 0.5s',
                    }}
                  />

                  {showDesc && (
                    <p
                      className="text-base md:text-lg text-white/75 mb-8 leading-relaxed max-w-xl"
                      style={{
                        opacity: index === currentSlide ? 1 : 0,
                        transform: index === currentSlide ? 'translateY(0)' : 'translateY(10px)',
                        transition: 'opacity 0.6s ease 0.55s, transform 0.6s ease 0.55s',
                      }}
                    >
                      {s.description}
                    </p>
                  )}

                  {showBtn && (
                    <div
                      style={{
                        opacity: index === currentSlide ? 1 : 0,
                        transform: index === currentSlide ? 'translateY(0)' : 'translateY(10px)',
                        transition: 'opacity 0.6s ease 0.7s, transform 0.6s ease 0.7s',
                      }}
                    >
                      <a
                        href={s.buttonUrl}
                        className="inline-flex items-center gap-3 px-7 py-3.5 rounded-lg font-bold text-sm tracking-wide text-white transition-all duration-200 hover:gap-4 hover:shadow-lg active:scale-95"
                        style={{ backgroundColor: accentColor, boxShadow: `0 4px 20px ${accentColor}50` }}
                      >
                        {s.buttonText}
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </a>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ))}

      {/* Left navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 flex items-center justify-center"
        aria-label="Anterior"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Right navigation */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full border border-white/20 bg-black/30 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/40 transition-all duration-200 flex items-center justify-center"
        aria-label="Siguiente"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex gap-2 items-center">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => { goToSlide(index); setIsAutoPlay(false); }}
            className="transition-all duration-400 rounded-full"
            style={{
              width: index === currentSlide ? '28px' : '8px',
              height: '8px',
              backgroundColor: index === currentSlide ? accentColor : 'rgba(255,255,255,0.4)',
            }}
            aria-label={`Ir a slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 z-20">
        <div
          className="h-full transition-all duration-300"
          style={{
            width: `${((currentSlide + 1) / slides.length) * 100}%`,
            backgroundColor: accentColor,
          }}
        />
      </div>
    </div>
  );
}
