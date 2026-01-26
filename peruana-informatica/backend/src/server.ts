import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import chalk from "chalk";
import { swaggerSpec } from "./config/swagger";
import { connectDatabase, sequelize } from "./database/connection";
import productRoutes from "./routes/productRoutes";
import brandRoutes from "./routes/brandRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import laptopRoutes from "./routes/laptopRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import { contactRoutes } from "./routes/contactRoutes";
import { seoRoutes } from "./routes/seoRoutes";
import { blogRoutes } from "./routes/blogRoutes";
import adminProductRoutes from "./routes/admin/productRoutes";
import adminCategoryRoutes from "./routes/admin/categoryRoutes";
import adminCarouselRoutes from "./routes/admin/carouselRoutes";
import adminAuthRoutes from "./routes/admin/authRoutes";
import adminImageRoutes from "./routes/admin/imageRoutes";
import adminTaxonomyRoutes from "./routes/admin/taxonomyRoutes";
import adminBrandRoutes from "./routes/admin/brandRoutes";
import adminCustomerRoutes from "./routes/admin/customerRoutes"; // Rutas admin de clientes
import quotationRoutes from "./routes/quotationRoutes";  // Nuevas rutas de cotizaciones
import pdfQuotationRoutes from "./routes/pdfQuotationRoutes";  // Ruta para PDF de cotizaciones
import orderRoutes from "./routes/orderRoutes"; // Nuevas rutas de pedidos
import adminOrderRoutes from "./routes/admin/orderRoutes"; // Nuevas rutas de pedidos ADMIN
import adminSettingRoutes from "./routes/admin/settingRoutes"; // Rutas de configuración
import cotizadorRoutes from "./routes/cotizadorRoutes"; // Rutas de Cotizador
import paymentRoutes from "./routes/paymentRoutes"; // Rutas de pagos
import adminPaymentRoutes from "./routes/admin/paymentRoutes"; // Rutas admin de pagos
import uploadRoutes from "./routes/admin/uploadRoutes"; // Rutas de subida de archivos
import externalApiRoutes from "./routes/externalApiRoutes"; // Rutas para API Externa
import syncRoutes from "./routes/syncRoutes"; // Rutas para sincronización con API Externa
import clientRoutes from "./routes/clientRoutes"; // Rutas para clientes (consulta y descarga)
import companySettingsRoutes from "./routes/companySettingsRoutes"; // Rutas públicas de configuración de empresa
import adminCompanySettingsRoutes from "./routes/admin/companySettingsRoutes"; // Rutas admin de configuración de empresa
import authRoutes from "./routes/authRoutes"; // Rutas de autenticación de clientes
import customerRoutes from "./routes/customerRoutes"; // Rutas de perfil de clientes
import cartRoutes from "./routes/cartRoutes"; // Rutas de carrito
import compatibilityRoutes from "./routes/compatibilityRoutes"; // Rutas de compatibilidad

import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import {
  apiRateLimit,
  searchRateLimit,
  sanitizeInput,
  securityHeaders,
} from "./middleware/security";
import { apiLimiter, authLimiter, createLimiter, paymentLimiter } from "./middleware/rateLimiter";
import { initRedis } from "./config/redis";
import { logger } from "./config/logger";
import { requestLogger, errorLogger } from "./middleware/logger";

dotenv.config();

// Initialize Redis (graceful degradation if unavailable)
initRedis();

const app = express();
const PORT = process.env.PORT || 3002;

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false, // Allow embedding
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded by frontend
}));

// Middleware CORS - debe ser el primer middleware
// Middleware CORS - debe ser el primer middleware
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma', 'Expires'],
  exposedHeaders: ['X-Session-Token'],
  optionsSuccessStatus: 204
}));

// Middleware para agregar headers CORS adicionales (fallback)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    // Default fallback to first allowed origin or localhost
    res.header('Access-Control-Allow-Origin', allowedOrigins[0] || 'http://localhost:3000');
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin,Cache-Control,Pragma,Expires');
  res.header('Access-Control-Expose-Headers', 'X-Session-Token');

  // Log CORS headers for debugging
  console.log('🔧 CORS headers added for:', req.method, req.url);

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Max-Age', '86400'); // 24 hours
    res.sendStatus(204);
    return;
  }

  next();
});

// Middleware de seguridad
app.use(securityHeaders);
app.use(apiRateLimit);
app.use(sanitizeInput);

// Middleware básico
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Request logging
app.use(requestLogger);

// Servir archivos estáticos (imágenes del carousel y uploads)
app.use("/images", express.static(path.join(__dirname, "../public/images")));
app.use("/uploads", express.static(path.join(__dirname, "../public/uploads")));

// Rutas
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Rutas públicas
app.use("/api/products", productRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/laptops", laptopRoutes);  // Nuevas rutas para laptops con subcategorías
app.use("/api/contacts", contactRoutes);
app.use("/api/seo", seoRoutes);
app.use("/api/blog", blogRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes); // Rutas de pagos
app.use("/api/cotizador", cotizadorRoutes);
app.use("/api/client", clientRoutes); // Rutas para clientes (consulta y descarga)
app.use("/api/company-settings", companySettingsRoutes); // Rutas públicas de configuración de empresa
app.use("/api/auth", authRoutes); // Rutas de autenticación de clientes
app.use("/api/customers", customerRoutes); // Rutas de perfil de clientes
app.use("/api/reviews", require("./routes/reviewRoutes").default); // Rutas de reseñas
app.use("/api/wishlist", require("./routes/wishlistRoutes").default); // Rutas de wishlist
app.use("/api/coupons", require("./routes/couponRoutes").default); // Rutas de cupones
app.use("/api/compatibility", compatibilityRoutes); // Rutas de compatibilidad (FIX: Was missing)
app.use("/api/promo-banners", require("./routes/promoBannerRoutes").default); // Rutas de banners promocionales

// Swagger Documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rutas de administración
// AUTH ROUTES MUST BE FIRST (no auth required)
app.use("/api/admin", adminAuthRoutes);

app.use("/api/admin/dashboard", dashboardRoutes);
app.use("/api/admin/products", adminProductRoutes);
app.use("/api/admin/categories", adminCategoryRoutes);
app.use("/api/admin/carousel", adminCarouselRoutes);
app.use("/api/admin/images", adminImageRoutes);
app.use("/api/admin/taxonomy", adminTaxonomyRoutes);
app.use("/api/admin/brands", adminBrandRoutes);
app.use("/api/admin/customers", adminCustomerRoutes); // Admin Gestión de clientes
app.use("/api/admin/upload", uploadRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/admin/payments", adminPaymentRoutes); // Rutas admin de pagos
app.use("/api/admin/settings", adminSettingRoutes);
app.use("/api/admin/company-settings", adminCompanySettingsRoutes); // Rutas admin de configuración de empresa
app.use("/api/admin/reviews", require("./routes/admin/reviewRoutes").default); // Rutas admin de reseñas
app.use("/api/admin/coupons", require("./routes/admin/couponRoutes").default); // Rutas admin de cupones
app.use("/api/admin/promo-banners", require("./routes/admin/promoBannerRoutes").default); // Rutas admin de banners
app.use("/api/admin/pages", require("./routes/admin/pageRoutes").default); // Rutas admin de páginas
app.use("/api/admin/wishlists", require("./routes/admin/wishlistRoutes").default); // Rutas admin de wishlists
app.use("/api/admin/analytics", require("./routes/admin/analyticsRoutes").default); // Rutas admin de analytics
app.use("/api/admin", require("./routes/admin/roleRoutes").default); // Rutas admin de roles y permisos

// Rutas API Externa
app.use("/api/external", externalApiRoutes);
app.use("/api/pages", require("./routes/pageRoutes").default); // Rutas públicas de páginas


// ... imports

// Rutas API Externa
app.use("/api/external", externalApiRoutes);
app.use("/api/sync", syncRoutes); // Rutas de sincronización con API Externa
app.use("/api/auth", authRoutes); // Rutas de autenticación de clientes
app.use("/api/cart", cartRoutes); // Rutas de carrito
app.use("/api/payment", paymentRoutes); // Rutas de pago

// Ruta temporal para sincronizar tablas de pedidos y cotizador
app.get('/api/debug/sync-orders', async (req, res) => {
  try {
    const { Order } = require('./models/Order');
    const { OrderItem } = require('./models/OrderItem');
    const { Product } = require('./models/Product');
    const { Setting } = require('./models/Setting');
    const { Page } = require('./models/Page');

    await Order.sync({ alter: true });
    await OrderItem.sync({ alter: true });
    await Product.sync({ alter: true }); // Add price columns
    await Setting.sync({ alter: true }); // Create settings table
    await Page.sync({ alter: true }); // Create pages table

    // Init default setting
    const setting = await Setting.findByPk('cotizador_price_type');
    if (!setting) {
      await Setting.create({ key: 'cotizador_price_type', value: 'pre_cot' });
    }

    res.json({ success: true, message: 'Tablas sincronizadas (Orders, Product, Settings)' });
  } catch (error: any) {
    console.error('Error syncing:', error);
    res.status(500).json({ error: error.message });
  }
});



// Endpoint para obtener una imagen aleatoria real
app.get('/api/debug/random-image', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const publicPath = path.join(__dirname, 'public', 'images', 'products');

    // Verificar si la carpeta existe
    if (!fs.existsSync(publicPath)) {
      return res.json({ url: 'https://placehold.co/600x600?text=Carpeta+no+encontrada' });
    }

    // Obtener archivos de la carpeta
    const files = fs.readdirSync(publicPath).filter((file: string) => {
      const ext = path.extname(file).toLowerCase();
      return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
    });

    if (files.length === 0) {
      return res.json({ url: 'https://placehold.co/600x600?text=No+hay+imágenes' });
    }

    // Seleccionar una imagen aleatoria
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const url = `http://localhost:3001/images/products/${randomFile}`;

    res.json({ url, file: randomFile });
  } catch (error) {
    console.error('Error getting random image:', error);
    res.status(500).json({ error: 'Error obteniendo imagen aleatoria' });
  }
});

// Manejo de errores (debe ir al final)
app.use(notFoundHandler);
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
  try {
    await connectDatabase();
    // Optional schema sync in development to apply new columns (e.g., SEO fields)
    // if (process.env.DB_SYNC_ALTER === "true") {
    //   console.log("🛠️ Applying DB schema updates (alter)...");
    //   await sequelize.sync({ alter: true });
    //   console.log("✅ DB schema updated");
    // } else {
    //   // Sync Image model specifically
    //   const { Image } = require("./models/Image");
    //   // await sequelize.sync({ alter: true });
    //   console.log("✅ Image table synced");
    // }
    // Inicializar asociaciones
    const { initAssociations } = require("./models/associations");
    initAssociations();

    // Global Error Handlers
    process.on('uncaughtException', (error) => {
      console.error('FATAL: Uncaught Exception:', error);
      // Keep the process alive if possible, or exit with error code
      // process.exit(1); 
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('FATAL: Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('exit', (code) => {
      console.log(`🛑 PROCESS EXITING WITH CODE: ${code}`);
    });

    process.on('SIGINT', () => {
      console.log('🛑 Received SIGINT. Shutting down...');
      process.exit(0);
    });

    const server = app.listen(PORT, () => {
      console.log(chalk.cyan(`\n🚀 Server running on `) + chalk.green.bold(`http://localhost:${PORT}`));
      console.log(chalk.cyan(`📚 API Documentation: `) + chalk.blue.bold(`http://localhost:${PORT}/api-docs`));
      console.log(chalk.cyan(`📊 Health check:      `) + chalk.white(`http://localhost:${PORT}/health\n`));
      console.log(chalk.yellow('⏰ Server will stay running...'));

      // Force process to stay alive
      setInterval(() => {
        // console.log('💓 Heartbeat');
      }, 10000);
    });

    // Keep server reference to prevent process exit
    return server;
  } catch (error) {
    console.error("❌ Error starting server:", error);
    process.exit(1);
  }
};

startServer();

export default app;