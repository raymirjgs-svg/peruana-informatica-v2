'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renderiza un overlay fuera del arbol de la pagina, directamente en document.body.
 *
 * Por que: el <main> del panel de administracion era un contexto de apilado
 * propio (position: relative + z-index), asi que cualquier overlay `fixed`
 * dentro de el compitia solo dentro de ese contexto. El sidebar (z-40) es
 * hermano del <main>, por lo que se dibujaba ENCIMA del modal (z-50) y le
 * tapaba la parte izquierda. Con el portal, el z-index compite en la raiz del
 * documento y el modal queda por encima del sidebar y del header movil.
 */
export function Portal({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
}
