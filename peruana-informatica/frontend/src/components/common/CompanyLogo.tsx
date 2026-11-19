'use client';

/* eslint-disable @next/next/no-img-element -- Se requiere <img> para detectar
   fallos de carga (onError) y aplicar el fallback al logo de marca. */

import { useState } from 'react';
import { useSettings } from '@/context/SettingsContext';

interface CompanyLogoProps {
    className?: string;
    alt?: string;
}

/**
 * Logo corporativo de la cabecera/pie.
 *
 * El asset de marca `/images/logo.png` es el diseno horizontal preparado para
 * fondos oscuros (cabecera y pie). El logo configurado desde el panel puede
 * ser un archivo cuadrado con fondo blanco, por lo que se usa solo como
 * respaldo si el asset principal llegara a fallar.
 *
 * Evita el fallo historico: la imagen se renderizaba bien y al cargar
 * `/api/company-settings` cambiaba a una ruta no servida, dejando un recuadro
 * blanco en la cabecera.
 */
export default function CompanyLogo({ className = 'h-16 w-auto object-contain max-w-[280px]', alt }: CompanyLogoProps) {
    const { settings, logoUrl } = useSettings();
    const [primaryFailed, setPrimaryFailed] = useState(false);

    const configuredLogo = settings?.logo_url ? logoUrl : null;
    const src = primaryFailed && configuredLogo ? configuredLogo : '/images/logo.png';

    return (
        <img
            src={src}
            alt={alt || settings?.company_name || 'Peruana Informática'}
            className={className}
            loading="eager"
            width={160}
            height={36}
            onError={() => {
                if (!primaryFailed) setPrimaryFailed(true);
            }}
        />
    );
}
