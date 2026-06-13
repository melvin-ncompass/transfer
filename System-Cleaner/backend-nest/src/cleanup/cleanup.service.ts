import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';

export interface FileInstance {
    id: string;
    name: string;
    path: string;
    size: number;
}

export interface DuplicateGroup {
    id: string;
    hash: string;
    instances: FileInstance[];
}

export interface LargeFile {
    id: string;
    name: string;
    path: string;
    size: number;
    type: string;
}

export interface ScanResults {
    largeFiles: LargeFile[];
    duplicates: DuplicateGroup[];
}

export interface ScanState {
    scanning: boolean;
    progress: number;
    message: string;
    results: ScanResults | null;
}

@Injectable()
export class CleanupService {
    private state: ScanState = {
        scanning: false,
        progress: 0,
        message: 'Ready',
        results: null,
    };

    private readonly LARGE_FILE_THRESHOLD = 50 * 1024 * 1024; // 50MB
    private readonly IGNORE_DIRS = ['node_modules', '.git', '__pycache__', 'venv'];

    getState(): ScanState {
        return { ...this.state };
    }

    async startScan(targetPath: string): Promise<void> {
        if (this.state.scanning) {
            throw new Error('Scan already in progress');
        }

        this.state = {
            scanning: true,
            progress: 0,
            message: 'Initializing scan...',
            results: null,
        };

        // Run scan in background
        this.runScan(targetPath).catch((err) => {
            this.state.scanning = false;
            this.state.message = `Error: ${err.message}`;
        });
    }

    private async runScan(targetPath: string): Promise<void> {
        const largeFiles: LargeFile[] = [];
        const fileHashes: Map<string, FileInstance[]> = new Map();

        this.state.message = 'Scanning directory structure...';

        // Get all files
        const allFiles = await this.getAllFiles(targetPath);
        const totalFiles = allFiles.length;

        this.state.message = `Found ${totalFiles} files. Analyzing...`;

        for (let i = 0; i < allFiles.length; i++) {
            const filePath = allFiles[i];
            const fileName = path.basename(filePath);

            try {
                const stats = await fs.stat(filePath);

                // Check for large files
                if (stats.size >= this.LARGE_FILE_THRESHOLD) {
                    largeFiles.push({
                        id: `lf-${i}`,
                        name: fileName,
                        path: filePath,
                        size: stats.size,
                        type: path.extname(filePath) || 'unknown',
                    });
                }

                // Calculate hash for duplicate detection (skip very large files)
                if (stats.size < 500 * 1024 * 1024) {
                    // Skip files > 500MB for hashing
                    const hash = await this.getFileHash(filePath);
                    const existing = fileHashes.get(hash) || [];
                    existing.push({
                        id: `f-${i}`,
                        name: fileName,
                        path: filePath,
                        size: stats.size,
                    });
                    fileHashes.set(hash, existing);
                }
            } catch {
                // Skip files we can't read
            }

            // Update progress
            this.state.progress = Math.round(((i + 1) / totalFiles) * 100);
            this.state.message = `Scanning: ${fileName}`;
        }

        // Build duplicates list
        const duplicates: DuplicateGroup[] = [];
        let dupIndex = 0;
        for (const [hash, instances] of fileHashes.entries()) {
            if (instances.length > 1) {
                duplicates.push({
                    id: `dup-${dupIndex++}`,
                    hash,
                    instances,
                });
            }
        }

        // Sort large files by size descending
        largeFiles.sort((a, b) => b.size - a.size);

        this.state.results = { largeFiles, duplicates };
        this.state.scanning = false;
        this.state.progress = 100;
        this.state.message = 'Scan complete';
    }

    private async getAllFiles(dirPath: string): Promise<string[]> {
        const files: string[] = [];

        const processDir = async (currentPath: string) => {
            try {
                const entries = await fs.readdir(currentPath, { withFileTypes: true });

                for (const entry of entries) {
                    const fullPath = path.join(currentPath, entry.name);

                    if (entry.isDirectory()) {
                        if (!this.IGNORE_DIRS.includes(entry.name)) {
                            await processDir(fullPath);
                        }
                    } else if (entry.isFile()) {
                        files.push(fullPath);
                    }
                }
            } catch {
                // Skip directories we can't read
            }
        };

        await processDir(dirPath);
        return files;
    }

    private async getFileHash(filePath: string): Promise<string> {
        const content = await fs.readFile(filePath);
        return crypto.createHash('md5').update(content).digest('hex');
    }

    async deleteItems(paths: string[]): Promise<{ deleted: number; errors: string[] }> {
        let deleted = 0;
        const errors: string[] = [];

        for (const itemPath of paths) {
            try {
                const stats = await fs.stat(itemPath);
                if (stats.isDirectory()) {
                    await fs.rm(itemPath, { recursive: true, force: true });
                } else {
                    await fs.unlink(itemPath);
                }
                deleted++;
            } catch (err) {
                errors.push(`Failed to delete ${itemPath}: ${err.message}`);
            }
        }

        return { deleted, errors };
    }
}
