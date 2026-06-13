import { Controller, Get, Post, Body, HttpException, HttpStatus, Query } from '@nestjs/common';
import { CleanupService } from './cleanup.service';

class ScanStartDto {
    path: string;
}

class DeleteDto {
    items: string[];
}

@Controller()
export class CleanupController {
    constructor(private readonly cleanupService: CleanupService) { }

    @Post('scan/start')
    async startScan(@Body() dto: ScanStartDto) {
        if (!dto.path) {
            throw new HttpException('Path is required', HttpStatus.BAD_REQUEST);
        }

        try {
            await this.cleanupService.startScan(dto.path);
            return { status: 'started' };
        } catch (err) {
            throw new HttpException(err.message, HttpStatus.BAD_REQUEST);
        }
    }

    @Get('scan/progress')
    getProgress() {
        return this.cleanupService.getState();
    }

    @Get('browse')
    browse() {
        // Note: Server-side folder browsing is limited in Node.js
        // Return a placeholder - the user can type paths manually
        return {
            path: null,
            message: 'Use the custom folder browser modal instead.'
        };
    }

    @Get('list-dir')
    async listDir(@Query('path') dirPath: string) {
        if (!dirPath) {
            // Return drive roots on Windows
            return {
                path: '',
                folders: ['C:\\', 'D:\\'],
                files: []
            };
        }

        try {
            const fs = await import('fs/promises');
            const path = await import('path');
            const entries = await fs.readdir(dirPath, { withFileTypes: true });

            const folders = entries
                .filter(e => e.isDirectory())
                .map(e => e.name)
                .filter(name => !name.startsWith('.'))
                .slice(0, 50); // Limit for performance

            return {
                path: dirPath,
                folders,
                parent: path.dirname(dirPath)
            };
        } catch (err) {
            return {
                path: dirPath,
                folders: [],
                error: 'Cannot read directory'
            };
        }
    }

    @Post('delete')
    async deleteItems(@Body() dto: DeleteDto) {
        if (!dto.items || !Array.isArray(dto.items)) {
            throw new HttpException('Items array is required', HttpStatus.BAD_REQUEST);
        }

        return await this.cleanupService.deleteItems(dto.items);
    }
}
