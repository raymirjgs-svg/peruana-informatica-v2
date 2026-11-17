import Link from "next/link";

interface PostNotFoundProps {
  error: string;
}

export function PostNotFound({ error }: PostNotFoundProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">😕 Post no encontrado</h1>
        <p className="text-gray-600 mb-8">
          {error || "El post que buscas no existe o ha sido eliminado."}
        </p>
        <Link
          href="/blog"
          className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
        >
          ← Volver al blog
        </Link>
      </div>
    </div>
  );
}
