import Link from "next/link";

export function PostCallToAction() {
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white text-center mb-8">
      <h3 className="text-2xl font-bold mb-3">¿Te gustó este artículo?</h3>
      <p className="text-blue-100 mb-6">Descubre más contenido tecnológico en nuestro blog</p>
      <Link
        href="/blog"
        className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition shadow-md hover:shadow-lg"
      >
        Ver más posts →
      </Link>
    </div>
  );
}
