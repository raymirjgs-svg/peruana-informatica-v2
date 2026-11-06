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
    private static baseUrl = 'http://54.144.139.115/peruanadeinformatica/api';
    private static token = process.env.API_PERUANA_TOKEN;
    private static tokenExpiresAt: Date | null = null;

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
                validateStatus: () => true
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
            // Simple network reachability check to the API base URL
            // We expect 200, 404, or 403, but getting a response means network is up.
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

            // Reemplazar o agregar el token
            const tokenLine = `API_PERUANA_TOKEN=${newToken}`;

            if (envContent.includes('API_PERUANA_TOKEN=')) {
                // Reemplazar token existente
                envContent = envContent.replace(/API_PERUANA_TOKEN=.*/, tokenLine);
            } else {
                // Agregar nuevo token
                envContent += `\n${tokenLine}`;
            }

            await fs.writeFile(envPath, envContent, 'utf-8');

            // Actualizar variable de entorno en memoria
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
     * Consulta un artículo por su ID
     * @param idArticulo ID del artículo a consultar (ej. '19287')
     * @returns Datos del artículo o null si ocurre un error
     */
    static async consultarArticulo(idArticulo: string): Promise<ArticuloResponse> {
        // Verificar y renovar token si es necesario
        await this.verificarYRenovarToken();

        if (!this.token) {
            console.error('API_PERUANA_TOKEN no está definido en las variables de entorno.');
            return {
                success: false,
                message: 'Configuración de API incompleta: Falta TOKEN'
            };
        }

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
                validateStatus: () => true
            });

            let responseBody: string = response.data;

            // La API a veces devuelve warnings de PHP antes del JSON. Limpiamos la respuesta.
            if (typeof responseBody === 'string') {
                const firstBrace = responseBody.indexOf('{');
                const lastBrace = responseBody.lastIndexOf('}');

                if (firstBrace !== -1 && lastBrace !== -1) {
                    const jsonPart = responseBody.substring(firstBrace, lastBrace + 1);
                    try {
                        const parsed = JSON.parse(jsonPart);
                        // Verificar si la respuesta envuelta en data (como en el token) o directa
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
                        return {
                            success: false,
                            message: 'Respuesta inválida del servidor externo'
                        };
                    }
                } else {
                    console.warn('No se encontró estructura JSON en la respuesta textual.');
                    return {
                        success: false,
                        message: 'No se encontró estructura JSON en la respuesta'
                    };
                }
            } else {
                // En caso axios haya parseado automáticamente
                const parsed = response.data;
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
            console.error('Error en PeruanaInformaticaService.consultarArticulo:', error.message);
            return {
                success: false,
                message: error.message
            };
        }
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

            // Log para debug de campos recibidos
            // console.log(`Datos recibidos para ${idArticulo}:`, articulo);

            // Parsear stock que puede venir como "65.000"
            const stockRaw = articulo.stock || 0;
            const stock = typeof stockRaw === 'string' ? parseFloat(stockRaw) : stockRaw;

            // Mapeo de precios basado en respuesta real API
            // precio_unitario_soles -> pre_cli
            // precio_lista_preferencial_soles -> pre_web (y pre_cot)
            // precio_lista_premium_soles -> pre_dis

            const round50 = (n: number) => n > 0 ? Math.ceil(n / 0.5) * 0.5 : 0;

            const precioUnitario = round50(parseFloat(articulo.precio_unitario_soles) || 0);
            const precioPreferencial = round50(parseFloat(articulo.precio_lista_preferencial_soles) || 0);
            const precioPremium = round50(parseFloat(articulo.precio_lista_premium_soles) || 0);
            const precioBase = round50(parseFloat(articulo.precio) || 0); // Fallback antiguo

            return {
                // Stock
                stock: Math.floor(stock), // Stock entero
                disponible: stock > 0,

                // Precios
                pre_cli: precioUnitario || precioBase,
                pre_cot: precioPreferencial || precioUnitario || precioBase,
                pre_web: precioPreferencial || precioUnitario || precioBase,
                pre_dis: precioPremium || precioPreferencial || precioUnitario || precioBase,

                // Información adicional
                nombre: articulo.nombre || articulo.descripcion || '',
                codigo: articulo.cod_articulo || articulo.codigo || idArticulo,
                marca: articulo.marca || null,
                categoria: articulo.categoria || null
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

        for (const id of idsArticulos) {
            try {
                const datos = await this.obtenerStockYPrecio(id);

                if (datos) {
                    resultados.push({
                        id,
                        success: true,
                        datos
                    });
                    console.log(`✓ Producto ${id} sincronizado: Stock=${datos.stock}, Pre_CLI=${datos.pre_cli}, Pre_COT=${datos.pre_cot}, Pre_WEB=${datos.pre_web}`);
                } else {
                    resultados.push({
                        id,
                        success: false,
                        error: 'No se obtuvieron datos'
                    });
                    console.log(`✗ Producto ${id} no pudo sincronizarse`);
                }

                // Pequeña pausa para no saturar la API
                await new Promise(resolve => setTimeout(resolve, 500));

            } catch (error: any) {
                resultados.push({
                    id,
                    success: false,
                    error: error.message
                });
                console.error(`✗ Error sincronizando producto ${id}:`, error.message);
            }
        }

        console.log(`✓ Sincronización completada: ${resultados.filter(r => r.success).length}/${idsArticulos.length} exitosos`);

        return resultados;
    }
}
