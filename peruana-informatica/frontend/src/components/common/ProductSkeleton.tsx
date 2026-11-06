interface ProductSkeletonProps {
    count?: number;
}

export function ProductSkeleton({ count = 1 }: ProductSkeletonProps) {
    return (
        <>
            {[...Array(count)].map((_, index) => (
                <div
                    key={index}
                    className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse"
                >
                    {/* Image Skeleton */}
                    <div className="bg-gray-200 h-48 w-full" />

                    {/* Content Skeleton */}
                    <div className="p-4 space-y-3">
                        {/* Title */}
                        <div className="h-4 bg-gray-200 rounded w-3/4" />

                        {/* Description */}
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-200 rounded w-full" />
                            <div className="h-3 bg-gray-200 rounded w-5/6" />
                        </div>

                        {/* Price */}
                        <div className="h-6 bg-gray-200 rounded w-1/4" />

                        {/* Button */}
                        <div className="h-10 bg-gray-200 rounded w-full" />
                    </div>
                </div>
            ))}
        </>
    );
}

export function ProductListSkeleton({ count = 8 }: { count?: number }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ProductSkeleton count={count} />
        </div>
    );
}
