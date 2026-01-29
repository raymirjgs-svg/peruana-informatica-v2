export const SITE_NAME = 'Peruana de Informática';
export const SITE_URL = 'https://peruanadeinformatica.com';
export const SITE_DESCRIPTION = 'Los mejores productos tecnológicos en Perú';

export const CATEGORIES = [
  'Laptops',
  'Computadoras',
  'Monitores',
  'Accesorios',
  'Componentes',
  'Impresoras'
];

export const MOCK_PRODUCTS = [
  {
    id: '1',
    name: 'Laptop HP Pavilion 15',
    slug: 'laptop-hp-pavilion-15',
    description: 'Laptop potente para trabajo y entretenimiento',
    price: 2500,
    image: '/images/products/laptop-hp.jpg',
    category: 'Laptops',
    stock: 10,
    brand: 'HP',
    featured: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Monitor LG 24"',
    slug: 'monitor-lg-24',
    description: 'Monitor Full HD para oficina',
    price: 650,
    image: '/images/products/monitor-lg.jpg',
    category: 'Monitores',
    stock: 15,
    brand: 'LG',
    featured: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];