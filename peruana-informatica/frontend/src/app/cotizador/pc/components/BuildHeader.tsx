'use client';

import Link from 'next/link';
import type { BuildStep } from './types';

interface BuildHeaderProps {
  steps: BuildStep[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
}

export default function BuildHeader({ steps, currentStep, onStepClick }: BuildHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Arma tu PC</h1>
        <Link href="/cotizador" className="text-blue-600 hover:underline">Volver al inicio</Link>
      </div>

      {/* Barra de progreso */}
      <div className="mb-8 overflow-x-auto pb-4">
        <div className="flex min-w-max">
          {steps.map((comp, index) => (
            <div
              key={comp.type}
              className={`flex items-center ${index < steps.length - 1 ? 'mr-4' : ''}`}
              onClick={() => onStepClick(index)}
            >
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors
                ${index < currentStep - 1 ? 'bg-green-500 text-white' : index === currentStep - 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
              `}>
                {index < currentStep - 1 ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-sm font-medium ${index === currentStep - 1 ? 'text-blue-600' : 'text-gray-600'}`}>
                {comp.name}
              </span>
              {index < steps.length - 1 && (
                <div className="w-12 h-1 bg-gray-200 ml-4 hidden md:block">
                  <div className={`h-full ${index < currentStep - 1 ? 'bg-green-500' : ''}`} style={{ width: index < currentStep - 1 ? '100%' : '0%' }}></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
