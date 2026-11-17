import { CheckCircle, CreditCard, ShoppingBag, User } from 'lucide-react';

export function ProgressBar({ currentStep }: { currentStep: string }) {
    const steps = [
      { id: 'cart', label: 'Carrito', icon: <ShoppingBag className="w-5 h-5" /> },
      { id: 'customer', label: 'Datos', icon: <User className="w-5 h-5" /> },
      { id: 'payment', label: 'Pago', icon: <CreditCard className="w-5 h-5" /> },
      { id: 'success', label: 'Confirmación', icon: <CheckCircle className="w-5 h-5" /> }
    ];

    const currentIndex = steps.findIndex(s => s.id === currentStep);

    return (
      <div className="mb-10 px-4">
        <div className="relative">
          {/* Línea de fondo */}
          <div className="absolute left-0 top-6 w-full h-1 bg-gradient-to-r from-gray-200 via-gray-200 to-gray-200 rounded-full"></div>

          {/* Línea de progreso animada */}
          <div
            className="absolute left-0 top-6 h-1 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
          ></div>

          <div className="relative flex justify-between">
            {steps.map((s, index) => {
              const isCurrent = s.id === currentStep;
              const isCompleted = index < currentIndex;

              return (
                <div key={s.id} className="flex flex-col items-center">
                  <div className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                    transition-all duration-500 transform border-4 shadow-lg
                    ${isCompleted
                      ? 'bg-gradient-to-br from-green-400 to-green-600 border-green-300 text-white scale-100'
                      : isCurrent
                        ? 'bg-gradient-to-br from-blue-500 to-indigo-600 border-blue-300 text-white scale-110 ring-4 ring-blue-200 ring-opacity-50'
                        : 'bg-white border-gray-300 text-gray-400 scale-95'
                    }
                  `}>
                    {isCompleted ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      s.icon
                    )}
                  </div>
                  <span className={`
                    text-sm mt-3 font-semibold transition-colors duration-300
                    ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                  `}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
}
