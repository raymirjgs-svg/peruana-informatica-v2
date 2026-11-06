// src/app/cotizador/laptop/components/QuotationSuccess.tsx
'use client';

import Link from 'next/link';

interface QuotationSuccessProps {
  quotationCode: string;
  clientName: string;
  quotationDate: string;
  totalAmount: number;
  selectedLaptop?: any;
}

export default function QuotationSuccess({
  quotationCode,
  clientName,
  quotationDate,
  totalAmount,
  selectedLaptop
}: QuotationSuccessProps) {
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">¡Cotización Generada Exitosamente!</h1>
        <p className="text-gray-600">Gracias por confiar en nosotros, {clientName}</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600">Código de Cotización</p>
            <p className="text-lg font-semibold text-blue-600">{quotationCode}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha</p>
            <p className="text-lg font-semibold text-gray-800">{quotationDate}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="text-lg font-semibold text-green-600">S/. {totalAmount.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Resumen de tu Cotización</h2>
        <div className="border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{selectedLaptop?.name || 'Laptop seleccionada'}</div>
                  <div className="text-sm text-gray-500">
                    {selectedLaptop?.specifications?.processor && `Procesador: ${selectedLaptop.specifications.processor}`}
                    {selectedLaptop?.specifications?.ram && `, RAM: ${selectedLaptop.specifications.ram}`}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
                  S/. {(selectedLaptop?.price || 0).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">1</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                  S/. {(selectedLaptop?.price || 0).toFixed(2)}
                </td>
              </tr>
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">Subtotal</td>
                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                  S/. {(totalAmount / 1.18).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">IGV (18%)</td>
                <td className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                  S/. {(totalAmount - (totalAmount / 1.18)).toFixed(2)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="px-6 py-3 text-right text-sm font-bold text-gray-900">Total</td>
                <td className="px-6 py-3 text-right text-base font-bold text-green-600">
                  S/. {totalAmount.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-blue-800 mb-2">Instrucciones siguientes</h3>
        <ul className="text-blue-700 text-sm list-disc pl-5 space-y-1">
          <li>Revisa detalladamente los componentes de tu equipo</li>
          <li>Nuestro equipo se pondrá en contacto contigo en máximo 24 horas hábiles</li>
          <li>Puedes imprimir esta cotización o presentar el código {quotationCode} en cualquiera de nuestras sedes</li>
          <li>La cotización tiene una vigencia de 7 días calendario</li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <button className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium">
          Descargar PDF
        </button>
        <button className="flex-1 bg-white border border-blue-600 text-blue-600 py-3 rounded-lg hover:bg-blue-50 transition font-medium">
          Enviar por Email
        </button>
        <Link href="/cotizador/laptop" className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium text-center">
          Hacer Otra Cotización
        </Link>
      </div>
    </div>
  );
}