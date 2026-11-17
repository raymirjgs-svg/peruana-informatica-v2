import fs from 'fs';

export const hasValidImageSignature = (filePath: string): boolean => {
    let fd: number | undefined;
    try {
        fd = fs.openSync(filePath, 'r');
        const header = Buffer.alloc(12);
        const bytesRead = fs.readSync(fd, header, 0, 12, 0);

        if (bytesRead >= 3 && header[0] === 0xFF && header[1] === 0xD8 && header[2] === 0xFF) {
            return true;
        }

        if (bytesRead >= 8 &&
            header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47 &&
            header[4] === 0x0D && header[5] === 0x0A && header[6] === 0x1A && header[7] === 0x0A) {
            return true;
        }

        if (bytesRead >= 4 &&
            header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x38) {
            return true;
        }

        if (bytesRead >= 12 &&
            header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46 &&
            header[8] === 0x57 && header[9] === 0x45 && header[10] === 0x42 && header[11] === 0x50) {
            return true;
        }

        return false;
    } catch (error) {
        return false;
    } finally {
        if (fd !== undefined) {
            fs.closeSync(fd);
        }
    }
};
