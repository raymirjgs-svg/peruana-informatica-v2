import Image from "next/image";

interface PostFeaturedImageProps {
  image: string;
  title: string;
}

export function PostFeaturedImage({ image, title }: PostFeaturedImageProps) {
  return (
    <div className="container mx-auto px-4 max-w-4xl mt-8 mb-8">
      <div className="relative w-full h-64 md:h-80 lg:h-96 rounded-lg overflow-hidden shadow-xl">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>
    </div>
  );
}
