import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

// Asegurarse de que las variables de entorno estén cargadas
dotenv.config();

interface TokenResponse {
    success: boolean;
    token?: string;
    message?: string;
    expiresAt?: string;
}

interface ArticuloResponse {
    success: boolean;
    data?: any;
    message?: string;
}

export class PeruanaInformaticaService {
    // URL base de la API del ERP. Configurable por entorno (ERP_API_URL).
    private static baseUrl = process.env.ERP_API_URL || 'http://54.144.139.115/peruanadeinformatica/api';
    private static token = process.env.API_PERUANA_TOKEN;
    private static tokenExpiresAt: Date | null = null;

    // Circuit breaker state
    private static consecutiveFailures = 0;
    private static readonly MAX_CONSECUTIVE_FAILURES = 5;
    private static circuitBreakerOpen = false;
    private static circuitBreakerOpenedAt: Date | null = null;
    private static readonly CIRCUIT_BREAKER_RESET_MS = 60 * 1000; // 1 minuto

    /**
     * Solicita un nuevo token a la API
     * @param usuario Usuario para solicitar el token (ej. 'raymir' o 'Raymir')
     * @param dias Duración del token en días
     * @returns Token generado o null si ocurre un error
     */
    static async solicitarToken(usuario: string = 'Raymir', dias: number = 30): Promise<TokenResponse> {
        try {
            const url = `${this.baseUrl}/solicitarToken`;

            const payload = {
                usuario,
                dias
            };

            console.log(`Solicitando nuevo token para usuario: ${usuario}, duración: ${dias} días...`);

            const response = await axios.post(url, payload, {
                headers: {
                    'Content-Type': 'application/json'
                },
                responseType: 'text',
                validateStatus: () => true,
                timeout: 10000
            });

            let responseBody = response.data;

            // Limpiar respuesta cruda si viene con warnings de PHP
            if (typeof responseBody === 'string') {
                const firstBrace = responseBody.indexOf('{');
                const lastBrace = responseBody.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1) {
                    const jsonPart = responseBody.substring(firstBrace, lastBrace + 1);
                    const parsed = JSON.parse(jsonPart);

                    // Verificar si el token está en la raíz o dentro de data
                    const token = parsed.token || (parsed.data && parsed.data.token);

                    if (token) {
                        // Guardar el nuevo token
                        this.token = token;

                        // Calcular fecha de expiración
                        const expiresAt = new Date();
                        expiresAt.setDate(expiresAt.getDate() + dias);
                        this.tokenExpiresAt = expiresAt;

                        // Actualizar el archivo .env
                        await this.updateEnvToken(token);

                        console.log(`✓ Nuevo token obtenido exitosamente. Expira: ${expiresAt.toISOString()}`);

                        return {
                            success: true,
                            token: token,
                            expiresAt: expiresAt.toISOString(),
                            message: 'Token obtenido exitosamente'
                        };
                    }

                    return {
                        success: false,
                        message: parsed.message || 'No se pudo obtener el token'
                    };
                }
            }

            return {
                success: false,
                message: 'Respuesta inválida del servidor'
            };


        } catch (error: any) {
            console.error('Error en PeruanaInformaticaService.solicitarToken:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Checks connection health to the external API
     */
    static async checkHealth(): Promise<{ status: 'ok' | 'error'; latency: number; message?: string }> {
        const start = Date.now();
        try {
            await axios.get(this.baseUrl, { validateStatus: () => true, timeout: 5000 });
            const latency = Date.now() - start;
            return { status: 'ok', latency };
        } catch (error: any) {
            const latency = Date.now() - start;
            return { status: 'error', latency, message: error.message };
        }
    }

    private static async updateEnvToken(newToken: string): Promise<void> {
        try {
            const envPath = path.join(process.cwd(), '.env');
            let envContent = await fs.readFile(envPath, 'utf-8');

            const tokenLine = `API_PERUANA_TOKEN=${newToken}`;

            if (envContent.includes('API_PERUANA_TOKEN=')) {
                envContent = envContent.replace(/API_PERUANA_TOKEN=.*/, tokenLine);
            } else {
                envContent += `\n${tokenLine}`;
            }

            await fs.writeFile(envPath, envContent, 'utf-8');
            process.env.API_PERUANA_TOKEN = newToken;
            console.log('✓ Token actualizado en .env');
        } catch (error: any) {
            console.error('Error al actualizar .env:', error.message);
        }
    }

    /**
     * Verifica si el token está próximo a expirar y lo renueva si es necesario
     */
    static async verificarYRenovarToken(diasAnticipacion: number = 7): Promise<boolean> {
        if (!this.tokenExpiresAt) {
            console.log('No hay información de expiración del token. Solicitando nuevo token...');
            const result = await this.solicitarToken();
            return result.success;
        }

        const ahora = new Date();
        const diasRestantes = Math.floor((this.tokenExpiresAt.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));

        if (diasRestantes <= diasAnticipacion) {
            console.log(`Token expira en ${diasRestantes} días. Renovando...`);
            const result = await this.solicitarToken();
            return result.success;
        }

        return true;
    }

    /**
     * Maneja el circuit breaker
     */
    private static checkCircuitBreaker(): boolean {
        if (!this.circuitBreakerOpen) return false;

        // Auto-reset después de un minuto
        if (this.circuitBreakerOpenedAt && Date.now() - this.circuitBreakerOpenedAt.getTime() > this.CIRCUIT_BREAKER_RESET_MS) {
            console.log('🔄 Circuit breaker: reset automático tras 1 min');
            this.circuitBreakerOpen = false;
            this.consecutiveFailures = 0;
            this.circuitBreakerOpenedAt = null;
            return false;
        }
        return true;
    }

    private static recordSuccess() {
        this.consecutiveFailures = 0;
    }

    private static recordFailure() {
        this.consecutiveFailures++;
        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES && !this.circuitBreakerOpen) {
            this.circuitBreakerOpen = true;
            this.circuitBreakerOpenedAt = new Date();
            console.warn(`⚡ Circuit breaker ABIERTO tras ${this.consecutiveFailures} fallas consecutivas. API ERP considerada no disponible por 1 min.`);
        }
    }

    /**
     * Consulta un artículo por su ID
     * @param idArticulo ID del artículo a consultar (ej. '19287')
     * @returns Datos del artículo o null si ocurre un error
     */
    static async consultarArticulo(idArticulo: string): Promise<ArticuloResponse> {
        await this.verificarYRenovarToken();

        if (!this.token) {
            console.error('API_PERUANA_TOKEN no está definido en las variables de entorno.');
            return {
                success: false,
                message: 'Configuración de API incompleta: Falta TOKEN'
            };
        }

        // Circuit breaker check
        if (this.checkCircuitBreaker()) {
            return {
                success: false,
                message: 'Circuito abierto: API ERP no disponible (demasiadas fallas recientes). Reintente en 1 minuto.'
            };
        }

        // Reintentos con backoff exponencial
        const maxRetries = 2;
        const baseTimeout = 8000; // 8s timeout por intento

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const url = `${this.baseUrl}/consultarArticulo`;

                const payload = {
                    id: idArticulo,
                    token: this.token
                };

                const response = await axios.post(url, payload, {
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    responseType: 'text',
                    validateStatus: () => true,
                    timeout: baseTimeout
                });

                // Éxito - reset circuit breaker counter
                this.recordSuccess();

                let responseBody: string = response.data;

                if (typeof responseBody === 'string') {
                    const firstBrace = responseBody.indexOf('{');
                    const lastBrace = responseBody.lastIndexOf('}');

                    if (firstBrace !== -1 && lastBrace !== -1) {
                        const jsonPart = responseBody.substring(firstBrace, lastBrace + 1);
                        try {
                            const parsed = JSON.parse(jsonPart);
                            if (parsed.data && parsed.status === 200) {
                                return {
                                    success: true,
                                    data: parsed.data
                                };
                            }
                            return {
                                success: true,
                                data: parsed
                            };
                        } catch (e) {
                            console.error('Error al parsear el JSON extraído:', e);
                            this.recordFailure();
                            if (attempt === maxRetries) {
                                return {
                                    success: false,
                                    message: 'Respuesta inválida del servidor externo'
                                };
                            }
                            // Reintentar
                            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
                            continue;
                        }
                    } else {
                        console.warn('No se encontró estructura JSON en la respuesta textual.');
                        this.recordFailure();
                        if (attempt === maxRetries) {
                            return {
                                success: false,
                                message: 'No se encontró estructura JSON en la respuesta'
                            };
                        }
                        await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
                        continue;
                    }
                } else {
                    const parsed = response.data;
                    this.recordSuccess();
                    if (parsed.data && parsed.status === 200) {
                        return {
                            success: true,
                            data: parsed.data
                        };
                    }
                    return {
                        success: true,
                        data: parsed
                    };
                }

            } catch (error: any) {
                this.recordFailure();
                const isLastAttempt = attempt === maxRetries;
                const isTimeout = error.code === 'ECONNABORTED' || error.message?.includes('timeout');
                const msg = isTimeout ? `Timeout (${baseTimeout}ms)` : error.message;

                console.warn(`⚠️ consultarArticulo(${idArticulo}) intento ${attempt + 1}/${maxRetries + 1} falló: ${msg}`);

                if (isLastAttempt) {
                    return {
                        success: false,
                        message: `Error consultando ERP: ${msg}`
                    };
                }
                // Backoff exponencial antes de reintentar
                await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
            }
        }

        // No debería llegar aquí, pero por seguridad
        return {
            success: false,
            message: 'Error consultando ERP tras reintentos'
        };
    }

    /**
     * Obtiene stock y precios actualizados de un producto
     * @param idArticulo ID del artículo
     * @returns Objeto con stock y los tres tipos de precios
     */
    static async obtenerStockYPrecio(idArticulo: string) {
        const response = await this.consultarArticulo(idArticulo);

        if (response.success && response.data) {
            const articulo = response.data;

            const stockRaw = articulo.stock || 0;
            const stock = typeof stockRaw === 'string' ? parseFloat(stockRaw) : stockRaw;

            const round50 = (n: number) => n > 0 ? Math.ceil(n / 0.5) * 0.5 : 0;

            // El ERP del cliente SOLO tiene 2 precios reales:
            // - precio_unitario_soles = Precio Normal (191.50)
            // - precio_lista_preferencial_soles = Precio Distribución (183.00)
            // Los campos precio_lista_premium_soles y precio suelen venir vacíos/0
            const precioNormal = round50(parseFloat(articulo.precio_unitario_soles) || 0);
            const precioDistribucion = round50(parseFloat(articulo.precio_lista_preferencial_soles) || 0);

            return {
                stock: isNaN(stock) ? 0 : stock,
                pre_cli: precioNormal || 0,                    // Precio Normal (191.50)
                pre_dis: precioDistribucion || 0,              // Precio Distribución (183.00)
                pre_web: precioNormal || 0,                    // Precio Web = Precio Normal
                pre_cot: precioNormal || 0,                    // Precio Cotización = Precio Normal
                nombre: articulo.nombre || articulo.descripcion || null,
                marca: articulo.marca || null,
                categoria: articulo.categoria || articulo.familia || null
            };
        }
        return null;
    }

    /**
     * Sincroniza múltiples productos con la API externa
     * @param idsArticulos Array de IDs de artículos a sincronizar
     * @returns Array con los resultados de la sincronización
     */
    static async sincronizarProductos(idsArticulos: string[]) {
        console.log(`Iniciando sincronización de ${idsArticulos.length} productos...`);

        const resultados = [];
        let consecutiveSkipped = 0;

        for (const id of idsArticulos) {
            // Si el circuit breaker está abierto, saltamos el resto
            if (this.checkCircuitBreaker()) {
                resultados.push({
                    id,
                    success: false,
                    error: 'Circuito abierto: API ERP no disponible'
                });
                consecutiveSkipped++;
                if (consecutiveSkipped > 10) {
                    console.log('⏭️ Saltando productos restantes (circuito abierto)');
                    break;
                }
                continue;
            }

            try {
                const datos = await this.obtenerStockYPrecio(id);

                if (datos) {
                    resultados.push({
                        id,
                        success: true,
                        datos
                    });
                    console.log(`✓ Producto ${id} sincronizado: Stock=${datos.stock}, Pre_CLI=${datos.pre_cli}, Pre_COT=${datos.pre_cot}, Pre_WEB=${datos.pre_web}`);
                    consecutiveSkipped = 0;
                } else {
                    resultados.push({
                        id,
                        success: false,
                        error: 'No se obtuvieron datos'
                    });
                    console.log(`✗ Producto ${id} no pudo sincronizarse`);
                    consecutiveSkipped++;
                }

                // Pausa corta entre productos
                await new Promise(resolve => setTimeout(resolve, 300));

            } catch (error: any) {
                resultados.push({
                    id,
                    success: false,
                    error: error.message
                });
                console.error(`✗ Error sincronizando producto ${id}:`, error.message);
                consecutiveSkipped++;
            }
        }

        const exitosos = resultados.filter(r => r.success).length;
        console.log(`✓ Sincronización completada: ${exitosos}/${idsArticulos.length} exitosos`);
        if (this.circuitBreakerOpen) {
            console.warn('⚠️ Circuit breaker quedó abierto al final de la sincronización');
        }

        return resultados;
    }
}