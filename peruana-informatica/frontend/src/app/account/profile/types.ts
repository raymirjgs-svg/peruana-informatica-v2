export interface ProfileData {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  auth_provider: string;
  createdAt: string;
}

export interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface CustomerOrder {
  id: number;
  createdAt: string;
  status: string;
  total: string | number;
}

export interface WishlistItem {
  id: number;
  product?: {
    name: string;
    price: string | number;
    images?: { imagen: string }[];
  };
}
