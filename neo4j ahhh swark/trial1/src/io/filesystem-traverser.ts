import * as fs from 'fs';
import * as path from 'path';

export interface FileSystemNode {
    name: string;
    type: 'file' | 'directory';
    path: string;
    extension?: string;
    size?: number;
    children?: FileSystemNode[];
}

export class FileSystemTraverser {
    private defaultIgnoreDirs = [
        '.git',
        'node_modules', 
        '.vscode',
        'dist',
        'build',
        'out',
        '.next',
        'coverage',
        '.nyc_output',
        'logs',
        'tmp',
        'temp',
        '__pycache__',
        '.pytest_cache'
    ];

    /**
     * Step 1: Traverse all files and folders from root level and build JSON object
     */
    buildFileSystemJSON(rootPath: string, customIgnoreDirs: string[] = []): FileSystemNode {
        const ignoreDirs = [...this.defaultIgnoreDirs, ...customIgnoreDirs];
        return this.traverseDirectory(rootPath, ignoreDirs);
    }

    private traverseDirectory(dirPath: string, ignoreDirs: string[]): FileSystemNode {
        const stats = fs.statSync(dirPath);
        const name = path.basename(dirPath);

        if (stats.isFile()) {
            return {
                name: name,
                type: 'file',
                path: dirPath,
                extension: path.extname(name),
                size: stats.size
            };
        }

        if (stats.isDirectory()) {
            const result: FileSystemNode = {
                name: name,
                type: 'directory',
                path: dirPath,
                children: []
            };

            try {
                const items = fs.readdirSync(dirPath);
                
                for (const item of items) {
                    if (ignoreDirs.includes(item)) continue;
                    
                    const itemPath = path.join(dirPath, item);
                    
                    try {
                        const childNode = this.traverseDirectory(itemPath, ignoreDirs);
                        result.children!.push(childNode);
                    } catch (error) {
                        console.warn(`Cannot access: ${itemPath}`);
                    }
                }
            } catch (error) {
                console.warn(`Cannot read directory: ${dirPath}`);
            }

            return result;
        }

        throw new Error(`Unknown file type: ${dirPath}`);
    }

    getStatistics(node: FileSystemNode): { files: number; directories: number; totalSize: number } {
        let files = 0;
        let directories = 0;
        let totalSize = 0;

        if (node.type === 'file') {
            files = 1;
            totalSize = node.size || 0;
        } else {
            directories = 1;
            if (node.children) {
                for (const child of node.children) {
                    const childStats = this.getStatistics(child);
                    files += childStats.files;
                    directories += childStats.directories;
                    totalSize += childStats.totalSize;
                }
            }
        }

        return { files, directories, totalSize };
    }

    getAllFilePaths(node: FileSystemNode): string[] {
        const paths: string[] = [];

        if (node.type === 'file') {
            paths.push(node.path);
        } else if (node.children) {
            for (const child of node.children) {
                paths.push(...this.getAllFilePaths(child));
            }
        }

        return paths;
    }
}
