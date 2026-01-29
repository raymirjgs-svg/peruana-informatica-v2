// src/app/cotizador/page.tsx
'use client';

import Link from 'next/link';

export default function QuotationHome() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Sistema de Cotizaciones</h1>
      <p className="text-gray-600 text-center mb-12">
        Personaliza tu equipo tecnológico ideal y obtén una cotización instantánea
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Opción de laptop */}
        <Link href="/cotizador/laptop">
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
            <div className="text-center">
              <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Laptop Personalizada</h2>
              <p className="text-gray-600 mb-4">
                Selecciona una laptop según tus necesidades y presupuesto
              </p>
              <div className="text-center">
                <span className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                  Crear Cotización
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Opción de PC de escritorio */}
        <Link href="/cotizador/pc">
          <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-green-300 hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1">
            <div className="text-center">
              <div className="mx-auto bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">PC Armada</h2>
              <p className="text-gray-600 mb-4">
                Arma tu computadora desde cero, eligiendo cada componente
              </p>
              <div className="text-center">
                <span className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition">
                  Armar PC
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="mt-12 bg-gray-50 rounded-xl p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-800">¿Cómo funciona?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">1</div>
            <div>
              <h4 className="font-medium text-gray-800">Selecciona</h4>
              <p className="text-gray-600 text-sm">Elige tus componentes preferidos</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">2</div>
            <div>
              <h4 className="font-medium text-gray-800">Personaliza</h4>
              <p className="text-gray-600 text-sm">Ajusta las especificaciones según necesites</p>
            </div>
          </div>
          <div className="flex items-start">
            <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-3 flex-shrink-0">3</div>
            <div>
              <h4 className="font-medium text-gray-800">Cotiza</h4>
              <p className="text-gray-600 text-sm">Obtén tu cotización con detalles</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}