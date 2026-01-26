import { Skeleton } from "@/components/ui/Skeleton";

export function ProductCardSkeleton() {
    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 h-full flex flex-col">
            {/* Imagen */}
            <div className="h-48 w-full bg-gray-100 relative">
                <Skeleton className="w-full h-full" />
            </div>

            {/* Contenido */}
            <div className="p-4 flex-1 flex flex-col">
                {/* Título */}
                <Skeleton className="h-6 w-3/4 mb-2" />

                {/* Descripción corta */}
                <div className="space-y-2 mb-4">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                </div>

                {/* Código */}
                <Skeleton className="h-3 w-1/4 mb-2" />

                {/* Precio y Stock */}
                <div className="mt-auto">
                    <Skeleton className="h-8 w-1/3 mb-2" />
                    <Skeleton className="h-5 w-1/4 mb-2" />
                </div>

                {/* Botón */}
                <Skeleton className="h-10 w-full rounded mt-2" />
            </div>
        </div>
    );
}
