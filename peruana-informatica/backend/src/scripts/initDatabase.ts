import { sequelize } from '../database/connection';
import { Product } from '../models/Product';
import { Brand } from '../models/Brand';
import { Category } from '../models/Category';
import { Carousel } from '../models/Carousel';
import { logger } from '../config/logger';

async function initDatabase() {
  try {
    logger.info('🔄 Inicializando base de datos...');

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
    logger.info('✅ Tabla company_settings sincronizada');

    await sequelize.sync({ alter: true });
    logger.info('✅ Modelos sincronizados');

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
    logger.info('✅ Configuración de empresa inicializada');

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

    logger.info('✅ Categorías creadas');

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

    logger.info('✅ Marcas creadas');

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
      logger.info('✅ Slides del carrusel creados');
    }

    logger.info('🎉 Base de datos inicializada correctamente');
  } catch (error) {
    logger.error('❌ Error inicializando base de datos:', error);
  } finally {
    await sequelize.close();
  }
}

initDatabase();
