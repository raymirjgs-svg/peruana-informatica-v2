'use client';

const PHONE = '51988552455';
const MESSAGE = encodeURIComponent('Hola, me gustaría obtener más información sobre sus productos.');
const WA_URL = `https://wa.me/${PHONE}?text=${MESSAGE}`;

export function WhatsAppButton() {
  return (
    <a
      href={WA_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contáctanos por WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform duration-200"
      style={{ backgroundColor: '#25D366' }}
    >
      {/* WhatsApp SVG oficial */}
      <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 fill-white">
        <path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.472.648 4.792 1.776 6.812L2 30l7.408-1.748A13.94 13.94 0 0 0 16.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm0 25.52a11.52 11.52 0 0 1-5.876-1.604l-.42-.252-4.396 1.036 1.056-4.284-.276-.44A11.493 11.493 0 0 1 4.48 16.004C4.48 9.648 9.648 4.48 16.004 4.48c6.352 0 11.516 5.168 11.516 11.524 0 6.352-5.164 11.516-11.516 11.516zm6.32-8.624c-.348-.176-2.06-1.016-2.38-1.132-.32-.116-.552-.176-.784.176s-.9 1.132-1.104 1.364c-.2.232-.404.26-.752.084-.348-.176-1.468-.54-2.796-1.724-1.032-.92-1.728-2.056-1.932-2.404-.204-.348-.02-.536.152-.708.156-.156.348-.404.52-.608.176-.2.232-.348.348-.58.116-.232.06-.436-.028-.612-.088-.176-.784-1.892-1.076-2.592-.284-.68-.572-.588-.784-.596l-.668-.012c-.232 0-.608.088-.928.436-.32.348-1.22 1.192-1.22 2.908s1.248 3.372 1.424 3.604c.176.232 2.456 3.748 5.952 5.256.832.36 1.48.576 1.988.736.836.268 1.596.228 2.196.14.672-.1 2.06-.844 2.352-1.66.292-.816.292-1.516.204-1.66-.084-.148-.316-.232-.664-.408z" />
      </svg>

      {/* Pulso animado */}
      <span
        className="absolute inset-0 rounded-full animate-ping opacity-30"
        style={{ backgroundColor: '#25D366' }}
      />
    </a>
  );
}
