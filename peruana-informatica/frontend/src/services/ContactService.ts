import apiClient from "@/utils/api";
import { getAdminAuthHeaders } from "@/lib/adminAuth";

interface ContactFormData {
  nombre: string;
  email: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
}

interface Contact {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  asunto: string;
  mensaje: string;
  status: "pending" | "resolved" | "spam";
  createdAt: string;
  updatedAt: string;
}

interface ContactStats {
  totals: {
    total: number;
    pending: number;
    resolved: number;
    spam: number;
  };
  periods: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  recentContacts: Contact[];
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class ContactService {
  private static getAuthHeaders(): Record<string, string> {
    return {
      ...getAdminAuthHeaders(),
      "Content-Type": "application/json",
    };
  }

  /**
   * Enviar formulario de contacto (público)
   */
  static async submitContact(
    data: ContactFormData,
  ): Promise<ApiResponse<Contact>> {
    try {
      return await apiClient.request<ApiResponse<Contact>>("/api/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: data,
      });
    } catch (error) {
      console.error("Error submitting contact:", error);

      // Provide more specific error messages
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "No se puede conectar con el servidor. Verifique que el backend esté funcionando.",
        );
      }

      if (
        (error instanceof Error && error.message.includes("NetworkError")) ||
        (error instanceof Error && error.message.includes("Failed to fetch"))
      ) {
        throw new Error(
          "Error de red. Verifique su conexión a internet y que el servidor esté disponible.",
        );
      }

      throw error;
    }
  }

  /**
   * Obtener todos los contactos (admin)
   */
  static async getAllContacts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    asunto?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Contact>> {
    try {
      const queryParams = new URLSearchParams();

      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            queryParams.append(key, value.toString());
          }
        });
      }

      const url = `/api/contacts/admin${queryParams.toString() ? `?${queryParams.toString()}` : ""}`;

      return await apiClient.request<PaginatedResponse<Contact>>(url, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error("Error fetching contacts:", error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de contactos (admin)
   */
  static async getContactStats(): Promise<ApiResponse<ContactStats>> {
    try {
      return await apiClient.request<ApiResponse<ContactStats>>("/api/contacts/admin/stats", {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error("Error fetching contact stats:", error);
      throw error;
    }
  }

  /**
   * Obtener un contacto específico (admin)
   */
  static async getContactById(id: number): Promise<ApiResponse<Contact>> {
    try {
      return await apiClient.request<ApiResponse<Contact>>(`/api/contacts/admin/${id}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error("Error fetching contact:", error);
      throw error;
    }
  }

  /**
   * Actualizar el estado de un contacto (admin)
   */
  static async updateContactStatus(
    id: number,
    status: "pending" | "resolved" | "spam",
  ): Promise<ApiResponse<Contact>> {
    try {
      return await apiClient.request<ApiResponse<Contact>>(
        `/api/contacts/admin/${id}/status`,
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: { status },
        },
      );
    } catch (error) {
      console.error("Error updating contact status:", error);
      throw error;
    }
  }

  /**
   * Eliminar un contacto (admin)
   */
  static async deleteContact(id: number): Promise<ApiResponse<void>> {
    try {
      return await apiClient.request<ApiResponse<void>>(`/api/contacts/admin/${id}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
    } catch (error) {
      console.error("Error deleting contact:", error);
      throw error;
    }
  }

  /**
   * Marcar múltiples contactos como resueltos (admin)
   */
  static async bulkResolveContacts(
    ids: number[],
  ): Promise<ApiResponse<{ updatedCount: number }>> {
    try {
      return await apiClient.request<ApiResponse<{ updatedCount: number }>>(
        "/api/contacts/admin/bulk/resolve",
        {
          method: "PUT",
          headers: this.getAuthHeaders(),
          body: { ids },
        },
      );
    } catch (error) {
      console.error("Error bulk resolving contacts:", error);
      throw error;
    }
  }

  /**
   * Obtener las opciones de asuntos disponibles
   */
  static getSubjectOptions() {
    return [
      { value: "consulta-producto", label: "Consulta sobre producto" },
      { value: "soporte-tecnico", label: "Soporte técnico" },
      { value: "garantia", label: "Garantía" },
      { value: "cotizacion", label: "Solicitar cotización" },
      { value: "reclamo", label: "Reclamo" },
      { value: "otro", label: "Otro" },
    ];
  }

  /**
   * Obtener las opciones de estados disponibles
   */
  static getStatusOptions() {
    return [
      { value: "pending", label: "Pendiente", color: "yellow" },
      { value: "resolved", label: "Resuelto", color: "green" },
      { value: "spam", label: "Spam", color: "red" },
    ];
  }

  /**
   * Formatear fecha para mostrar
   */
  static formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("es-PE", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
    } catch {
      return dateString;
    }
  }

  /**
   * Obtener el texto del estado en español
   */
  static getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      pending: "Pendiente",
      resolved: "Resuelto",
      spam: "Spam",
    };
    return statusMap[status] || status;
  }

  /**
   * Obtener la clase CSS para el estado
   */
  static getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      resolved: "bg-green-100 text-green-700 border-green-200",
      spam: "bg-red-100 text-red-700 border-red-200",
    };
    return statusClasses[status] || "bg-gray-100 text-gray-700 border-gray-200";
  }

  /**
   * Probar conexión con el servidor (debug)
   */
  static async testConnection(): Promise<unknown> {
    try {
      console.log("Testing connection to:", "/api/contacts/test");

      const result = await apiClient.request<unknown>("/api/contacts/test", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Test response data:", result);

      return result;
    } catch (error) {
      console.error("Connection test failed:", error);
      throw error;
    }
  }
}

export {
  ContactService,
  type ContactFormData,
  type Contact,
  type ContactStats,
};
