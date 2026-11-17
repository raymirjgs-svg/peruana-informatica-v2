interface BlogEmptyStateProps {
  hasFilters: boolean;
}

export function BlogEmptyState({ hasFilters }: BlogEmptyStateProps) {
  return (
    <div className="text-center py-20">
      <div className="text-6xl mb-4">📝</div>
      <h3 className="text-xl font-semibold text-gray-700 mb-2">
        No hay artículos disponibles
      </h3>
      <p className="text-gray-500">
        {hasFilters
          ? "No se encontraron artículos con los filtros seleccionados."
          : "Aún no hay artículos publicados. ¡Vuelve pronto!"}
      </p>
    </div>
  );
}
