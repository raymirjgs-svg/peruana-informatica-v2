  export const getStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-amber-500 text-white',
      processed: 'bg-emerald-600 text-white',
      cancelled: 'bg-red-600 text-white'
    };
    const labels = {
      pending: 'Pendiente',
      processed: 'Procesado',
      cancelled: 'Cancelado'
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  export const getPaymentStatusBadge = (status: string) => {
    const colors = {
      pending: 'bg-orange-500 text-white',
      verified: 'bg-blue-600 text-white',
      rejected: 'bg-red-600 text-white'
    };
    const labels = {
      pending: 'Pago Pendiente',
      verified: 'Pago Verificado',
      rejected: 'Pago Rechazado'
    };
    return (
      <span className={`px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm ${colors[status as keyof typeof colors]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };
