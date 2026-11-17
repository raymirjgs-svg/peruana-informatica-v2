  export const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-PE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  export const getStatusColor = (status: string) => {
    const colors = {
      draft: "bg-gray-100 text-gray-700",
      published: "bg-green-100 text-green-700",
      scheduled: "bg-blue-100 text-blue-700",
      archived: "bg-red-100 text-red-700",
    };
    return colors[status as keyof typeof colors] || colors.draft;
  };
