import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <p className="text-6xl font-bold text-blue-600">404</p>
      <h1 className="mt-4 text-2xl font-semibold text-gray-900">Página no encontrada</h1>
      <p className="mt-2 max-w-md text-gray-600">
        La página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Volver al inicio
      </Link>
    </div>
  );
}
