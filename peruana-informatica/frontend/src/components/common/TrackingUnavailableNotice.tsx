'use client';

import Link from 'next/link';
import { useSettings } from '@/context/SettingsContext';

interface TrackingUnavailableNoticeProps {
  orderId?: string;
  compact?: boolean;
}

function buildWhatsAppUrl(phone: string): string {
  const localNumber = phone.replace(/\D/g, '').replace(/^51(?=\d{9}$)/, '');
  return localNumber ? `https://wa.me/51${localNumber}` : 'https://wa.me/';
}

export function TrackingUnavailableNotice({ orderId, compact = false }: TrackingUnavailableNoticeProps) {
  const { settings } = useSettings();

  const phone = settings?.company_phone || '(054) 226796';
  const whatsapp = settings?.company_whatsapp || '988 552 455';
  const email = settings?.company_email || 'info@peruanainformatica.com.pe';

  return (
    <section
      className={`rounded-2xl border border-amber-200 bg-amber-50 text-left ${compact ? 'p-5' : 'p-6 sm:p-8'}`}
      aria-labelledby="tracking-unavailable-title"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div className="min-w-0">
          <h2 id="tracking-unavailable-title" className="text-xl font-bold text-gray-900 sm:text-2xl">
            Seguimiento público temporalmente no disponible
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-700 sm:text-base">
            Por seguridad, los pedidos ya no se consultan únicamente con el número. Estamos habilitando un código de seguimiento único para proteger los datos de cada cliente.
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-amber-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-900">¿Ya realizaste un pedido? Podemos ayudarte ahora.</p>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          {orderId
            ? `Indica el pedido #${orderId} y el correo electrónico que usaste para comprar.`
            : 'Indica el número de pedido y el correo electrónico que usaste para comprar.'}
        </p>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <a
            href={buildWhatsAppUrl(whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center rounded-lg bg-brand-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-red-700"
          >
            WhatsApp {whatsapp}
          </a>
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
          >
            Email {email}
          </a>
          <Link
            href="/contacto"
            className="inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold text-brand-red-700 transition hover:bg-brand-red-50"
          >
            Ver todos los contactos
          </Link>
        </div>
        <p className="mt-4 text-xs text-gray-500">Teléfono: {phone}</p>
      </div>
    </section>
  );
}
