import { sequelize } from '../database/connection';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { Carousel } from '../models/Carousel';

async function initDatabase() {
  try {
    console.log('🔄 Inicializando base de datos...');

    // Sincronizar modelos (aplicar cambios de columnas sin borrar datos)
    // Importar asociaciones para registrar todos los modelos
    const { initAssociations } = require('../models/associations');
    initAssociations();

    // Importar modelos adicionales que no están en asociaciones
    const { CompanySettings } = require('../models/CompanySettings');
    const { PromoBanner } = require('../models/PromoBanner');
    const { Setting } = require('../models/Setting');
    const { Page } = require('../models/Page');

    await CompanySettings.sync({ alter: true });
    console.log('✅ Tabla company_settings sincronizada');

    await sequelize.sync({ alter: true });
    console.log('✅ Modelos sincronizados');

    // Configuración de la empresa por defecto
    await CompanySettings.findOrCreate({
      where: { id: 1 },
      defaults: {
        company_name: 'Peruana Informática',
        company_ruc: '20123456789',
        company_address: 'Av. Principal 123, Lima - Perú',
        company_phone: '(01) 123-4567',
        company_email: 'ventas@peruanainformatica.com'
      }
    });
    console.log('✅ Configuración de empresa inicializada');

    // Crear categorías por defecto
    const categories = await Category.findOrCreate({
      where: { name: 'Laptops' },
      defaults: {
        name: 'Laptops',
        slug: 'laptops',
        appears_in_menu: true
      }
    });

    await Category.findOrCreate({
      where: { name: 'Monitores' },
      defaults: {
        name: 'Monitores',
        slug: 'monitores',
        appears_in_menu: true
      }
    });

    await Category.findOrCreate({
      where: { name: 'Periféricos' },
      defaults: {
        name: 'Periféricos',
        slug: 'perifericos',
        appears_in_menu: true
      }
    });

    console.log('✅ Categorías creadas');

    // Crear marcas por defecto
    await Brand.findOrCreate({
      where: { name: 'ASUS' },
      defaults: {
        name: 'ASUS',
        slug: 'asus'
      }
    });

    await Brand.findOrCreate({
      where: { name: 'HP' },
      defaults: {
        name: 'HP',
        slug: 'hp'
      }
    });

    await Brand.findOrCreate({
      where: { name: 'Lenovo' },
      defaults: {
        name: 'Lenovo',
        slug: 'lenovo'
      }
    });

    console.log('✅ Marcas creadas');

    // Crear slides del carrusel por defecto
    const carouselCount = await Carousel.count();
    if (carouselCount === 0) {
      await Carousel.bulkCreate([
        {
          title: 'Tecnología de Vanguardia',
          description: 'Descubre los últimos equipos tecnológicos con la mejor calidad y garantía del mercado peruano.',
          buttonText: 'Ver Productos',
          buttonUrl: '/products',
          backgroundColor: 'from-blue-500 to-blue-700',
          isActive: true,
          order: 1
        },
        {
          title: 'Envío Gratis a Todo el Perú',
          description: 'Recibe tus productos en la comodidad de tu hogar con nuestro servicio de envío gratuito.',
          buttonText: 'Comprar Ahora',
          buttonUrl: '/products',
          backgroundColor: 'from-green-500 to-green-700',
          isActive: true,
          order: 2
        },
        {
          title: 'Garantía Oficial',
          description: 'Todos nuestros productos cuentan con garantía oficial del fabricante y soporte técnico especializado.',
          buttonText: 'Más Información',
          buttonUrl: '/contacto',
          backgroundColor: 'from-purple-500 to-purple-700',
          isActive: true,
          order: 3
        }
      ]);
      console.log('✅ Slides del carrusel creados');
    }

    console.log('🎉 Base de datos inicializada correctamente');
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error);
  } finally {
    await sequelize.close();
  }
}

initDatabase();
