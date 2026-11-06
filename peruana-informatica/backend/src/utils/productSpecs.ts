/**
 * Centralized component specs extraction from product descriptions.
 * Used by CotizadorController and LaptopController.
 */

export interface ComponentSpecs {
    processor: string;
    ram: string;
    storage: string;
    graphics?: string;
    screen_size?: string;
}

export const extractComponentSpecs = (product: any, includeExtras: boolean = false): ComponentSpecs => {
    const description = product.description || '';
    const cleanDescription = description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

    // Processor patterns
    let processor = 'No especificado';
    const processorPatterns = [
        /(Intel\s+Core\s+i[3579]-?\d+[A-Z]*)/i,
        /(AMD\s+Ryzen\s+\d+\s*\d*)/i,
        /(Intel\s+Celeron|Intel\s+Pentium)/i,
        /(Apple\s+M\d+\s+Chip)/i,
        /(Intel\s+Core)/i,
        /(AMD\s+Ryzen)/i,
    ];

    for (const pattern of processorPatterns) {
        const match = cleanDescription.match(pattern);
        if (match) {
            processor = match[0].replace(/\s+/g, ' ').trim();
            break;
        }
    }

    // RAM patterns
    let ram = 'No especificado';
    const ramMatch = cleanDescription.match(/(\d+)\s*(GB|GB DDR4|GB DDR5|GB RAM)/i);
    if (ramMatch) {
        ram = ramMatch[0].trim();
    }

    // Storage patterns
    let storage = 'No especificado';
    const storagePatterns = [
        /(\d+)\s*(GB|TB)\s*(SSD|HDD|NVMe)/i,
        /Disco\s+S[oó]lido\s+de\s+(\d+)\s*(GB|TB)/i,
        /(\d+)\s*(GB|TB)\s+de\s+almacenamiento/i,
    ];

    for (const pattern of storagePatterns) {
        const match = cleanDescription.match(pattern);
        if (match) {
            storage = match[0].replace(/Disco\s+S[oó]lido\s+de\s+/i, '').replace(/de\s+almacenamiento/i, '').trim();
            break;
        }
    }

    const specs: ComponentSpecs = { processor, ram, storage };

    if (includeExtras) {
        // Graphics
        let graphics = 'No especificado';
        if (cleanDescription.includes('GTX') || cleanDescription.includes('RTX')) {
            graphics = 'Dedicada';
        } else if (cleanDescription.includes('Intel') || cleanDescription.includes('AMD') || cleanDescription.includes('integrada')) {
            graphics = 'Integrada';
        }
        specs.graphics = graphics;

        // Screen size
        let screenSize = 'No especificado';
        const screenMatch = cleanDescription.match(/(\d+\.?\d*)[""]/);
        if (screenMatch) {
            screenSize = screenMatch[0];
        }
        specs.screen_size = screenSize;
    }

    return specs;
};
