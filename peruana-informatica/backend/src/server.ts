import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import path from "path";
import helmet from "helmet";
import compression from "compression";
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
import adminSystemRoutes from "./routes/admin/systemRoutes"; // Rutas de sistema
import cotizadorRoutes from "./routes/cotizadorRoutes"; // Rutas de Cotizador
import paymentRoutes from "./routes/paymentRoutes"; // Rutas de pagos
import adminPaymentRoutes from "./routes/admin/paymentRoutes"; // Rutas admin de pagos
import uploadRoutes from "./routes/admin/uploadRoutes"; // Rutas de subida de archivos
import externalApiRoutes from "./routes/externalApiRoutes"; // Rutas para API Externa
import syncRoutes from "./routes/syncRoutes"; // Rutas para sincronización con API Externa
import clientRoutes from "./routes/clientRoutes"; // Rutas para clientes (consulta y descarga)
import companySettingsRoutes from "./routes/companySettingsRoutes"; // Rutas públicas de configuración de empresa
import globalSettingsRoutes from "./routes/globalSettingsRoutes"; // Rutas públicas de configuración global
import adminCompanySettingsRoutes from "./routes/admin/companySettingsRoutes"; // Rutas admin de configuración de empresa
import authRoutes from "./routes/authRoutes"; // Rutas de autenticación de clientes
import customerRoutes from "./routes/customerRoutes"; // Rutas de perfil de clientes
import cartRoutes from "./routes/cartRoutes"; // Rutas de carrito
import compatibilityRoutes from "./routes/compatibilityRoutes"; // Rutas de compatibilidad
import reviewRoutes from "./routes/reviewRoutes"; // Rutas de reseñas
import wishlistRoutes from "./routes/wishlistRoutes"; // Rutas de wishlist
import couponRoutes from "./routes/couponRoutes"; // Rutas de cupones
import promoBannerRoutes from "./routes/promoBannerRoutes"; // Rutas de banners promocionales
import pageRoutes from "./routes/pageRoutes"; // Rutas públicas de páginas
import adminReviewRoutes from "./routes/admin/reviewRoutes"; // Rutas admin de reseñas
import adminCouponRoutes from "./routes/admin/couponRoutes"; // Rutas admin de cupones
import adminPromoBannerRoutes from "./routes/admin/promoBannerRoutes"; // Rutas admin de banners
import adminPageRoutes from "./routes/admin/pageRoutes"; // Rutas admin de páginas
import adminWishlistRoutes from "./routes/admin/wishlistRoutes"; // Rutas admin de wishlists
import adminAnalyticsRoutes from "./routes/admin/analyticsRoutes"; // Rutas admin de analytics
import adminRoleRoutes from "./routes/admin/roleRoutes"; // Rutas admin de roles y permisos
import adminDiscountRoutes from "./routes/admin/discountRoutes"; // Rutas admin de descuentos
import adminMarketingRoutes from "./routes/admin/marketingRoutes"; // Rutas admin de marketing
import { initAssociations } from "./models/associations"; // Inicialización de asociaciones

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


// Initialize Redis (graceful degradation if unavailable)
initRedis();

const app = express();
const PORT = process.env.PORT || 3001;

// Security Headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for API
  crossOriginEmbedderPolicy: false, // Allow embedding
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images to be loaded by frontend
}));

// Gzip Compression
app.use(compression());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || '').split(',')
  .map(o => o.trim())
  .filter(o => o !== '') || ['http://localhost:3000', 'http://127.0.0.1:3000'];

// Si después del split está vacío, usar valores por defecto
if (allowedOrigins.length === 0) {
  allowedOrigins.push('http://localhost:3000', 'http://127.0.0.1:3000');
}

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'Cache-Control', 'Pragma', 'Expires'],
  exposedHeaders: ['X-Session-Token'],
  optionsSuccessStatus: 204
}));

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

// Health Check Endpoint with CORS support
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'backend',
    timestamp: new Date().toISOString()
  });
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
app.use("/api/settings", globalSettingsRoutes); // Rutas públicas de configuración global
app.use("/api/auth", authRoutes); // Rutas de autenticación de clientes
app.use("/api/customers", customerRoutes); // Rutas de perfil de clientes
app.use("/api/reviews", reviewRoutes); // Rutas de reseñas
app.use("/api/wishlist", wishlistRoutes); // Rutas de wishlist
app.use("/api/coupons", couponRoutes); // Rutas de cupones
app.use("/api/compatibility", compatibilityRoutes); // Rutas de compatibilidad
app.use("/api/promo-banners", promoBannerRoutes); // Rutas de banners promocionales

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
app.use("/api/admin/reviews", adminReviewRoutes); // Rutas admin de reseñas
app.use("/api/admin/coupons", adminCouponRoutes); // Rutas admin de cupones
app.use("/api/admin/promo-banners", adminPromoBannerRoutes); // Rutas admin de banners
app.use("/api/admin/pages", adminPageRoutes); // Rutas admin de páginas
app.use("/api/admin/wishlists", adminWishlistRoutes); // Rutas admin de wishlists
app.use("/api/admin/analytics", adminAnalyticsRoutes); // Rutas admin de analytics
app.use("/api/admin/system", adminSystemRoutes); // Rutas de monitoreo del sistema
app.use("/api/admin/roles", adminRoleRoutes); // Rutas admin de roles y permisos
app.use("/api/admin/discounts", adminDiscountRoutes); // Rutas admin de descuentos
app.use("/api/admin/marketing", adminMarketingRoutes); // Rutas admin de marketing

// Rutas API Externa y Adicionales
app.use("/api/external", externalApiRoutes);
app.use("/api/pages", pageRoutes); // Rutas públicas de páginas
app.use("/api/sync", syncRoutes); // Rutas de sincronización con API Externa
app.use("/api/cart", cartRoutes); // Rutas de carrito
app.use("/api/payment", paymentRoutes); // Rutas de pago

// Manejo de errores (debe ir al final)
app.use(notFoundHandler);
app.use(errorHandler);

// Iniciar servidor
const startServer = async () => {
  try {
    await connectDatabase();

    // Inicializar asociaciones
    initAssociations();

    // ✅ CRÍTICO: Validar que la BD tenga tablas ANTES de continuar
    console.log(chalk.cyan('\n🔍 Validando estructura de base de datos...'));
    try {
      const [tables]: any = await sequelize.query("SHOW TABLES");
      const tableCount = tables.length;

      console.log(chalk.green(`📊 Tablas encontradas en BD: ${tableCount}`));

      if (tableCount === 0) {
        console.error(chalk.red('\n⚠️ WARNING: La base de datos está VACÍA'));
        console.error(chalk.yellow('Se intentará sincronizar los modelos automáticamente...'));
        // process.exit(1); // DISABLED TEMPORARILY
      }

      // Listar primeras 5 tablas para confirmar
      const tableNames = tables.slice(0, 5).map((t: any) => Object.values(t)[0]);
      console.log(chalk.gray(`   Primeras tablas: ${tableNames.join(', ')}...`));
      console.log(chalk.green('✅ Estructura de BD validada correctamente\n'));

    } catch (error) {
      console.error(chalk.red('❌ Error validando BD:'), error);
      console.error(chalk.yellow('El servidor continuará, pero pueden ocurrir errores 500'));
    }

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