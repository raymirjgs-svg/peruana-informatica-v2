'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
    rating: number;
    maxRating?: number;
    size?: 'sm' | 'md' | 'lg';
    showValue?: boolean;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
}

export function StarRating({
    rating,
    maxRating = 5,
    size = 'md',
    showValue = false,
    interactive = false,
    onRatingChange
}: StarRatingProps) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6'
    };

    const handleClick = (value: number) => {
        if (interactive && onRatingChange) {
            onRatingChange(value);
        }
    };

    return (
        <div className="flex items-center gap-1">
            {Array.from({ length: maxRating }, (_, i) => {
                const starValue = i + 1;
                const isFilled = starValue <= Math.round(rating);
                const isPartial = starValue > rating && starValue - 1 < rating;

                return (
                    <button
                        key={i}
                        type="button"
                        onClick={() => handleClick(starValue)}
                        disabled={!interactive}
                        className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
                    >
                        <Star
                            className={`${sizeClasses[size]} ${isFilled
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : isPartial
                                        ? 'fill-yellow-200 text-yellow-400'
                                        : 'fill-none text-gray-300'
                                }`}
                        />
                    </button>
                );
            })}
            {showValue && (
                <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {rating.toFixed(1)}
                </span>
            )}
        </div>
    );
}
