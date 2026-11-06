'use client';

import { useEffect, useState } from 'react';
import { API_CONFIG } from '@/config/api';

const BACKEND_URL = API_CONFIG.API_BASE_URL;

const FALLBACK_MESSAGES = [
  { id: 1, icon: '🚚', text: 'Despacho a todo el Perú — Consulta cobertura y tarifas' },
  { id: 2, icon: '✅', text: 'Garantía oficial del fabricante en todos los productos' },
  { id: 3, icon: '📞', text: 'Soporte técnico — Escríbenos al WhatsApp: +51 988 552 455' },
  { id: 4, icon: '🔥', text: 'Remates con hasta 70% de descuento — ¡Stock limitado!' },
  { id: 5, icon: '💳', text: 'Pagos seguros: Visa, Mastercard, Yape y Plin' },
  { id: 6, icon: '⚡', text: 'Más de 1,000 productos en stock disponibles hoy' },
];

interface Message { id: number; icon: string; text: string; }

export function AnnouncementBar() {
  const [messages, setMessages] = useState<Message[]>(FALLBACK_MESSAGES);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/announcements`)
      .then((r) => r.json())
      .then((json) => {
        const list: Message[] = Array.isArray(json) ? json : (json.data ?? []);
        if (list.length > 0) setMessages(list);
      })
      .catch(() => {/* usa fallback */});
  }, []);

  // Duplicamos para el loop continuo
  const items = [...messages, ...messages];

  return (
    <div
      className="w-full overflow-hidden text-white text-[11px] font-semibold tracking-wide select-none"
      style={{
        background: 'linear-gradient(90deg, #991b1b 0%, #dc2626 50%, #991b1b 100%)',
        height: '30px',
      }}
    >
      <div
        className="flex items-center h-full animate-ticker"
        style={{ width: 'max-content' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.animationPlayState = 'paused'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.animationPlayState = 'running'; }}
      >
        {items.map((msg, i) => (
          <span key={`${msg.id}-${i}`} className="flex items-center gap-1.5 px-8 whitespace-nowrap">
            <span>{msg.icon}</span>
            <span>{msg.text}</span>
            <span className="ml-8 text-red-300/50">◆</span>
          </span>
        ))}
      </div>
    </div>
  );
}
