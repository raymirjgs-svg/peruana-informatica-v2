import { Request, Response } from 'express';
import { PeruanaInformaticaService } from '../services/PeruanaInformaticaService';
import { sendError } from '../middleware/errorHandler';

export const consultArticle = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'Se requiere el ID del artículo' });
        }

        const data = await PeruanaInformaticaService.consultarArticulo(id);

        if (!data) {
            return res.status(404).json({ error: 'Artículo no encontrado o respuesta inválida del servidor externo' });
        }

        res.json(data);
    } catch (error) {
        return sendError(res, error, 'Error interno al consultar la API externa');
    }
};
