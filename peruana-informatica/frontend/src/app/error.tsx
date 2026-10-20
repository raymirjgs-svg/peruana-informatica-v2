"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <h1 className="text-2xl font-semibold text-gray-900">Algo salió mal</h1>
      <p className="mt-2 max-w-md text-gray-600">
        No pudimos cargar esta sección. Intenta nuevamente.
      </p>
      {error.digest && (
        <p className="mt-2 text-xs text-gray-400">Referencia: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Reintentar
      </button>
    </div>
  );
}
