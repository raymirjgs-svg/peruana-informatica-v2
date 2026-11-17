export type Slide = {
  id: number;
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor?: string;
  imageUrl?: string;
  isActive: boolean;
  order: number;
};

export type SlideForm = {
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  backgroundColor: string;
  imageUrl: string;
  isActive: boolean;
  order: number;
};

export type ToastState = {
  type: 'success' | 'error';
  message: string;
};
