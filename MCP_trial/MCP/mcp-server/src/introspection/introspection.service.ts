import { Injectable } from '@nestjs/common';
import { RepoService } from '../repo/repo.service';
import { SchemaService } from '../database/schema.service';
import {
  DbResponse,
  OverviewResponse,
  RepoResponse,
  RepoTreeNode,
  TableInfo,
} from './dto/introspection.dto';

const AGENT_NAMES = [
  'SUPERVISOR_AGENT',
  'SQL_AGENT',
  'EXECUTION_AGENT',
  'TASK_AGENT',
  'REPO_AGENT',
  'DIAGRAM_AGENT',
  'CSV_AGENT',
  'FORMATTER_AGENT',
];

const CACHE_TTL_MS = 30_000;

@Injectable()
export class IntrospectionService {
  private readonly cache = new Map<string, { data: unknown; ts: number }>();

  constructor(
    private readonly repoService: RepoService,
    private readonly schemaService: SchemaService,
  ) {}

  getOverview(): OverviewResponse {
    const cacheKey = 'overview';
    const cached = this.getCached<OverviewResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const repoContext = this.repoService.getRepoContext();
    const schemaText = this.schemaService.getSchema();

    const filePaths = this.extractFilePaths(repoContext);
    const topDirs = this.computeTopDirs(filePaths);
    const tables = this.parseSchema(schemaText).map((t) => t.name);

    const response: OverviewResponse = {
      projectName: this.getProjectName(),
      uptime: process.uptime(),
      agents: AGENT_NAMES,
      db: {
        tableCount: tables.length,
        tables,
      },
      repo: {
        fileCount: filePaths.length,
        topDirs,
        indexedChunks: repoContext
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0).length,
      },
      generatedAt: new Date().toISOString(),
    };

    const redacted = this.redact(response) as OverviewResponse;
    this.cache.set(cacheKey, { data: redacted, ts: Date.now() });
    return redacted;
  }

  getRepo(depth = 2): RepoResponse {
    const normalizedDepth = Number.isFinite(depth) ? Math.max(0, Math.floor(depth)) : 2;
    const cacheKey = `repo:${normalizedDepth}`;
    const cached = this.getCached<RepoResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const repoContext = this.repoService.getRepoContext();
    const filePaths = this.extractFilePaths(repoContext);
    const byExtension = this.countByExtension(filePaths);

    const response: RepoResponse = {
      rootPath: process.cwd(),
      fileCount: filePaths.length,
      topDirs: this.computeTopDirs(filePaths),
      byExtension,
      tree: this.buildTree(filePaths, normalizedDepth),
      indexedAt: new Date().toISOString(),
    };

    const redacted = this.redact(response) as RepoResponse;
    this.cache.set(cacheKey, { data: redacted, ts: Date.now() });
    return redacted;
  }

  getDb(): DbResponse {
    const schemaText = this.schemaService.getSchema();
    const response: DbResponse = {
      tables: this.parseSchema(schemaText),
      generatedAt: new Date().toISOString(),
    };
    return this.redact(response) as DbResponse;
  }

  private getCached<T>(key: string): T | null {
    const hit = this.cache.get(key);
    if (!hit) {
      return null;
    }
    if (Date.now() - hit.ts > CACHE_TTL_MS) {
      this.cache.delete(key);
      return null;
    }
    return hit.data as T;
  }

  private extractFilePaths(repoContext: string): string[] {
    const paths: string[] = [];
    for (const line of repoContext.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('File ')) continue;
      const afterPrefix = trimmed.slice(5);
      const separatorIndex = afterPrefix.indexOf(':');
      if (separatorIndex === -1) continue;
      const relativePath = afterPrefix.slice(0, separatorIndex).trim();
      if (relativePath) {
        paths.push(relativePath);
      }
    }
    return paths;
  }

  private computeTopDirs(filePaths: string[]): string[] {
    const counts = new Map<string, number>();
    for (const filePath of filePaths) {
      const [firstSegment] = filePath.split('/');
      const key = firstSegment || '.';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([name]) => name)
      .slice(0, 10);
  }

  private countByExtension(filePaths: string[]): Record<string, number> {
    const byExtension: Record<string, number> = {};
    for (const filePath of filePaths) {
      const fileName = filePath.split('/').pop() ?? '';
      const dotIdx = fileName.lastIndexOf('.');
      const ext = dotIdx > -1 ? fileName.slice(dotIdx).toLowerCase() : '[no_ext]';
      byExtension[ext] = (byExtension[ext] ?? 0) + 1;
    }
    return byExtension;
  }

  private buildTree(filePaths: string[], depth: number): RepoTreeNode[] {
    const root = new Map<string, { type: 'file' | 'dir'; children: Map<string, any> }>();

    for (const filePath of filePaths) {
      const segments = filePath.split('/').filter(Boolean);
      let current = root;

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];
        const isLast = i === segments.length - 1;
        const existing = current.get(segment);

        if (!existing) {
          current.set(segment, {
            type: isLast ? 'file' : 'dir',
            children: new Map<string, any>(),
          });
        }

        const next = current.get(segment);
        if (!next) break;
        current = next.children;
      }
    }

    const toNodes = (map: Map<string, { type: 'file' | 'dir'; children: Map<string, any> }>, currentDepth: number): RepoTreeNode[] => {
      const entries = [...map.entries()].sort((a, b) => {
        const typeCmp = a[1].type.localeCompare(b[1].type);
        return typeCmp !== 0 ? typeCmp : a[0].localeCompare(b[0]);
      });

      return entries.map(([name, entry]) => {
        if (entry.type === 'file' || currentDepth >= depth) {
          return { name, type: entry.type };
        }

        const children = toNodes(entry.children, currentDepth + 1);
        return { name, type: 'dir', children };
      });
    };

    return toNodes(root, 0);
  }

  private parseSchema(schemaText: string): TableInfo[] {
    const tables: TableInfo[] = [];

    for (const rawLine of schemaText.split('\n')) {
      const line = rawLine.trim();
      const tableMatch = line.match(/^Table\s+\[?([^\]]+)\]?:\s*(.*)$/i);
      if (!tableMatch) continue;

      const tableName = tableMatch[1].trim();
      const columnsPart = tableMatch[2].trim();
      const columns = columnsPart.length === 0
        ? []
        : columnsPart
            .split(',')
            .map((part) => part.trim())
            .filter(Boolean)
            .map((part) => {
              const colMatch = part.match(/^"?([^"(]+?)"?\s*\(([^)]+)\)$/);
              if (!colMatch) {
                return { name: part.replace(/"/g, '').trim(), type: 'unknown' };
              }
              return {
                name: colMatch[1].trim(),
                type: colMatch[2].trim(),
              };
            });

      tables.push({ name: tableName, columns });
    }

    return tables;
  }

  private getProjectName(): string {
    const cwd = process.cwd().replace(/\\/g, '/');
    const parts = cwd.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? 'project';
  }

  private redact(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.redact(item));
    }

    if (value && typeof value === 'object') {
      const result: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
        const keyLower = key.toLowerCase();
        const shouldRedact =
          keyLower.includes('password') ||
          keyLower.includes('secret') ||
          keyLower.includes('key') ||
          keyLower.includes('token') ||
          keyLower.includes('credential') ||
          keyLower.includes('dsn') ||
          keyLower.includes('url');

        result[key] = shouldRedact ? '[redacted]' : this.redact(child);
      }
      return result;
    }

    return value;
  }
}
