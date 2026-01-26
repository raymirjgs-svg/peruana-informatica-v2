import { HTMLAttributes } from "react";

/**
 * Componente base para estados de carga (Skeleton)
 * Usa Tailwind CSS para la animación de pulso
 */
export function Skeleton({
    className,
    ...props
}: HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={`animate-pulse rounded-md bg-gray-200/80 ${className || ''}`}
            {...props}
        />
    );
}
