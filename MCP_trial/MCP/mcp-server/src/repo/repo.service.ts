import { Injectable, OnModuleInit, Logger, Inject } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { z } from 'zod';
import type { AIProvider } from '../ai/ai.provider.interface';

interface McpConfig {
  rootDir?: string;
  repo?: {
    path?: string;
    ignore?: string[];
    maxFileSizeKb?: number;
  };
  ignore?: string[];
  maxFileSizeKb?: number;
}

@Injectable()
export class RepoService implements OnModuleInit {
  private readonly logger = new Logger(RepoService.name);
  private repoContext: string = '';
  private fileCache: Map<string, string> = new Map();
  private fileStatsCache: Map<string, fs.Stats> = new Map();
  private llmSummaryCache: Map<string, string> = new Map();
  private config: McpConfig | null = null;
  private projectRoot: string;

  constructor(
    @Inject('AIProvider') private readonly aiProvider: AIProvider,
  ) {
    this.projectRoot = process.cwd();
  }

  async onModuleInit() {
    await this.reindex();
  }

  public getRepoContext(): string {
    return this.repoContext;
  }

  /**
   * Produces a short, tiered repository summary derived entirely from the existing file cache.
   * No new file reads are performed.
   */
  public getRepoSummary(): string {
    const fileCount = this.fileCache.size;
    const topLevelDirs = new Set<string>();
    const importCounts = new Map<string, number>();

    for (const relativePath of this.fileCache.keys()) {
      const parts = relativePath.split('/');
      const dir =
        parts.length >= 2 ? `${parts[0]}/${parts[1]}` : (parts[0] || 'root');
      topLevelDirs.add(dir);
    }

    for (const [, content] of this.fileCache.entries()) {
      const imports = this.extractImports(content);
      for (const imp of imports) {
        const normalized = this.normalizeModuleName(imp);
        if (!normalized) continue;
        importCounts.set(normalized, (importCounts.get(normalized) ?? 0) + 1);
      }
    }

    const topDirs = Array.from(topLevelDirs).slice(0, 6);
    const topImports = Array.from(importCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([mod]) => mod);

    const across = topDirs.length ? topDirs.join(', ') : '(none)';
    const mostImported = topImports.length ? topImports.join(', ') : '(none)';

    let summary = `Project has ${fileCount} files across: ${across}. Most imported: ${mostImported}.`;
    if (summary.length > 200) {
      summary = `${summary.slice(0, 197)}...`;
    }

    return summary;
  }

  public getFile(relativePath: string): string {
    return this.fileCache.get(relativePath) || '';
  }

  public getRepoGraph(): string {
    const fileKeys = Array.from(this.fileCache.keys()).sort();
    const graphData = new Map<string, { imports: Set<string>; importedBy: Set<string> }>();

    for (const file of fileKeys) {
      graphData.set(file, { imports: new Set<string>(), importedBy: new Set<string>() });
    }

    for (const [file, content] of this.fileCache.entries()) {
      const imports = this.extractImports(content);
      const sourceNode = graphData.get(file);
      if (!sourceNode) continue;

      for (const imp of imports) {
        sourceNode.imports.add(imp);
        if (!graphData.has(imp)) {
          graphData.set(imp, { imports: new Set<string>(), importedBy: new Set<string>() });
        }
        graphData.get(imp)?.importedBy.add(file);
      }
    }

    const topLevelDirs = new Set<string>();
    for (const file of fileKeys) {
      const dir = file.includes('/') ? file.split('/')[0] : 'root';
      topLevelDirs.add(dir);
    }

    const entryPoints = fileKeys
      .filter(file => (graphData.get(file)?.importedBy.size ?? 0) >= 3)
      .sort();

    const serializeGraph = (keysToInclude: string[]) => {
      const graph: Record<string, { imports: string[]; importedBy: string[] }> = {};
      const allowed = new Set(keysToInclude);
      for (const key of keysToInclude) {
        const node = graphData.get(key);
        if (!node) continue;
        graph[key] = {
          imports: Array.from(node.imports).sort(),
          importedBy: Array.from(node.importedBy).filter(i => allowed.has(i)).sort(),
        };
      }
      return JSON.stringify({
        files: fileKeys.length,
        dirs: Array.from(topLevelDirs).sort(),
        graph,
        entryPoints,
      });
    };

    let result = serializeGraph(Array.from(graphData.keys()).sort());
    if (result.length <= 3000) {
      return result;
    }

    const connectedFileKeys = fileKeys.filter(file => {
      const node = graphData.get(file);
      if (!node) return false;
      return node.imports.size + node.importedBy.size >= 2;
    });
    const shownCount = connectedFileKeys.length;
    const totalCount = fileKeys.length;
    const truncatedBody = serializeGraph(connectedFileKeys.sort());
    return `[Graph truncated to connected files only — ${shownCount} of ${totalCount} files shown]\n${truncatedBody}`;
  }

  public getFileSummaries(): string {
    const fileKeys = Array.from(this.fileCache.keys()).sort((a, b) => a.localeCompare(b));
    const lines: string[] = [];

    for (const file of fileKeys) {
      const content = this.fileCache.get(file) || '';
      const exportsList = this.extractExports(content);
      const llmSummary = this.llmSummaryCache.get(file)?.trim();
      let description = llmSummary || 'no exports detected';
      if (!llmSummary && exportsList.length > 0) {
        description = `exports ${exportsList.join(', ')}`;
      }

      const prefix = `${file}: `;
      const maxLineLength = 80;
      const available = Math.max(0, maxLineLength - prefix.length);
      let truncatedDescription = description;
      if (truncatedDescription.length > available) {
        truncatedDescription =
          available > 3 ? `${truncatedDescription.slice(0, available - 3)}...` : '';
      }

      lines.push(`${prefix}${truncatedDescription}`);
    }

    const maxChars = 2000;
    let output = '';
    let used = 0;
    let kept = 0;
    for (const line of lines) {
      const chunk = output.length === 0 ? line : `\n${line}`;
      if (used + chunk.length > maxChars) break;
      output += chunk;
      used += chunk.length;
      kept += 1;
    }

    if (kept < lines.length) {
      const remaining = lines.length - kept;
      const suffix = `${output.length === 0 ? '' : '\n'}[...${remaining} more files]`;
      if (output.length + suffix.length <= maxChars) {
        output += suffix;
      } else if (output.length > 0) {
        output = output.slice(0, Math.max(0, maxChars - suffix.length)) + suffix;
      } else {
        output = `[...${remaining} more files]`;
      }
    }

    return output;
  }

  public getRepoOverview(): string {
    const fileCount = this.fileCache.size;
    const dirs = new Set<string>();
    for (const relativePath of this.fileCache.keys()) {
      const dir = relativePath.includes('/') ? relativePath.split('/')[0] : 'root';
      dirs.add(dir);
    }

    const graphText = this.getRepoGraph();
    const summariesText = this.getFileSummaries();

    let entryPointsText = '(none)';
    try {
      const jsonStart = graphText.indexOf('{');
      if (jsonStart >= 0) {
        const parsed = JSON.parse(graphText.slice(jsonStart)) as { entryPoints?: string[] };
        if (parsed.entryPoints && parsed.entryPoints.length > 0) {
          entryPointsText = parsed.entryPoints.slice(0, 8).join(', ');
        }
      }
    } catch {
      entryPointsText = '(unavailable)';
    }

    let result = [
      '=== Project Overview ===',
      `${fileCount} files | dirs: ${Array.from(dirs).sort().join(', ') || '(none)'}`,
      `Entry points: ${entryPointsText}`,
      '',
      '=== File Summaries ===',
      summariesText,
      '',
      '=== Dependency Graph ===',
      graphText,
    ].join('\n');

    if (result.length > 4000) {
      const header = [
        '=== Project Overview ===',
        `${fileCount} files | dirs: ${Array.from(dirs).sort().join(', ') || '(none)'}`,
        `Entry points: ${entryPointsText}`,
        '',
        '=== File Summaries ===',
      ].join('\n');
      const graphHeader = '\n\n=== Dependency Graph ===\n';
      const totalBudget = 4000;
      const fixedOverhead = header.length + graphHeader.length + 1;
      const available = Math.max(0, totalBudget - fixedOverhead);
      const summaryBudget = Math.min(summariesText.length, Math.max(200, Math.floor(available * 0.4)));
      const graphBudget = Math.max(0, available - summaryBudget);

      const trimmedSummary = summariesText.slice(0, summaryBudget);
      const trimmedGraph = graphText.slice(0, graphBudget);
      result = `${header}\n${trimmedSummary}${graphHeader}${trimmedGraph}`;
      if (result.length > 4000) {
        result = result.slice(0, 4000);
      }
    }

    console.log('[RepoService] getRepoOverview() chars:', result.length);
    return result;
  }

  public async reindex(): Promise<void> {
    this.logger.log('Starting repository indexing...');
    this.repoContext = '';
    this.fileCache.clear();
    this.fileStatsCache.clear();
    this.llmSummaryCache.clear();

    const configPath = path.join(this.projectRoot, 'melcp.config.json');
    if (!fs.existsSync(configPath)) {
      this.logger.warn(`Config file not found at ${configPath}`);
      return;
    }

    try {
      const configRaw = fs.readFileSync(configPath, 'utf8');
      this.config = JSON.parse(configRaw) as McpConfig;
    } catch (error) {
      this.logger.error('Failed to parse melcp.config.json', error);
      return;
    }

    const repoRootFromConfig = this.config?.repo?.path?.trim() || this.config?.rootDir?.trim();
    if (!this.config || !repoRootFromConfig) {
      this.logger.warn('Invalid config: repo.path (or legacy rootDir) missing');
      return;
    }

    const rootDir = path.resolve(this.projectRoot, repoRootFromConfig);
    if (!fs.existsSync(rootDir)) {
      this.logger.warn(`Root dir not found: ${rootDir}`);
      return;
    }

    const defaultIgnore = ['node_modules', '.git', 'dist'];
    const customIgnore = this.config.repo?.ignore || this.config.ignore || [];
    const ignorePatterns = [...defaultIgnore, ...customIgnore];

    const contextLines: string[] = [];
    const maxFileSizeKb = this.config.repo?.maxFileSizeKb || this.config.maxFileSizeKb || 1024;

    this.walkDir(rootDir, rootDir, ignorePatterns, maxFileSizeKb, contextLines);
    await this.summarizeFiles(rootDir);

    this.repoContext = contextLines.join('\n');
    this.logger.log(`Repository indexing completed. Parsed ${this.fileCache.size} files.`);
  }

  private walkDir(
    currentDir: string,
    baseDir: string,
    ignorePatterns: string[],
    maxFileSizeKb: number,
    contextLines: string[]
  ) {
    let files: string[] = [];
    try {
      files = fs.readdirSync(currentDir);
    } catch (err) {
      this.logger.warn(`Could not read directory ${currentDir}`);
      return;
    }

    for (const file of files) {
      const fullPath = path.join(currentDir, file);
      const normalizedPath = fullPath.replace(/\\/g, '/');
      const isIgnored = ignorePatterns.some(pattern => {
         return file === pattern || normalizedPath.includes(`/${pattern}/`) || normalizedPath.endsWith(`/${pattern}`);
      });
      
      if (isIgnored) continue;

      try {
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
          this.walkDir(fullPath, baseDir, ignorePatterns, maxFileSizeKb, contextLines);
        } else if (stat.isFile()) {
          const ext = path.extname(file).toLowerCase();
          if (['.ts', '.js', '.py', '.go'].includes(ext)) {
            const fileSizeKb = stat.size / 1024;
            if (fileSizeKb <= maxFileSizeKb) {
              this.processFile(fullPath, baseDir, contextLines, stat);
            }
          }
        }
      } catch (err) {
        this.logger.warn(`Could not stat ${fullPath}`);
      }
    }
  }

  private processFile(fullPath: string, baseDir: string, contextLines: string[], stats: fs.Stats) {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
      
      this.fileCache.set(relativePath, content);
      this.fileStatsCache.set(relativePath, stats);

      const exportsList = this.extractExports(content);
      const importsList = this.extractImports(content);

      const exportsStr = exportsList.length > 0 ? exportsList.join(',') : '';
      const importsStr = importsList.length > 0 ? importsList.join(',') : '';

      contextLines.push(`File ${relativePath}: exports ${exportsStr || 'none'} imports ${importsStr || 'none'}`);
    } catch (error) {
      this.logger.error(`Failed to process file ${fullPath}`, error);
    }
  }

  private extractExports(content: string): string[] {
    const exportsList: string[] = [];
    const exportRegex = /export\s+(class|function|const)\s+(\w+)/g;
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exportsList.push(match[2]);
    }
    return [...new Set(exportsList)];
  }

  private extractImports(content: string): string[] {
    const importsList: string[] = [];
    const importRegex = /from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      importsList.push(match[1]);
    }
    return [...new Set(importsList)];
  }

  private normalizeModuleName(importPath: string): string {
    // Turn something like "./schema.service" or "../schema.service" into "schema.service"
    let p = importPath.replace(/\\/g, '/').trim();
    if (!p) return '';
    if (p.startsWith('./') || p.startsWith('../')) {
      p = p.replace(/^(\.\/|\.\.\/)+/, '');
    }

    const base = p.split('/').filter(Boolean).pop() ?? p;
    return base.replace(/\.(ts|tsx|js|jsx|py|go)$/, '');
  }

  private async summarizeFiles(configuredRootDir: string): Promise<void> {
    const skipSummarize = process.env.MELCP_SKIP_SUMMARIZE === 'true';
    if (skipSummarize) {
      this.logger.log('Skipping LLM file summarization (MELCP_SKIP_SUMMARIZE=true).');
      return;
    }

    const cacheDir = path.resolve(configuredRootDir, '..', '.melcp-cache');
    const cacheFilePath = path.join(cacheDir, 'file-summaries.json');

    const existingCache = this.readSummaryCache(cacheFilePath);
    const nextCache: Record<string, { summary: string; hash: string }> = {};
    const files = Array.from(this.fileCache.keys()).sort();

    const filesToSummarize: string[] = [];
    for (const filename of files) {
      if (this.isAlwaysIgnoredPath(filename)) continue;
      const stats = this.fileStatsCache.get(filename);
      if (!stats) continue;
      if (stats.size > 50 * 1024) continue;

      const hash = this.toChangeHash(stats);
      const cached = existingCache[filename];
      if (cached && cached.hash === hash && cached.summary) {
        this.llmSummaryCache.set(filename, cached.summary);
        nextCache[filename] = cached;
        console.log(`[RepoService] Summary cache hit for: ${filename}`);
        continue;
      }
      filesToSummarize.push(filename);
    }

    const batchSize = 5;
    for (let i = 0; i < filesToSummarize.length; i += batchSize) {
      const batch = filesToSummarize.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (filename, idx) => {
          const progress = i + idx + 1;
          const total = filesToSummarize.length;
          console.log(`[RepoService] Summarizing ${progress}/${total}: ${filename}`);

          const summary = await this.generateFileSummary(filename);
          const stats = this.fileStatsCache.get(filename);
          if (!stats) return;
          const hash = this.toChangeHash(stats);
          this.llmSummaryCache.set(filename, summary);
          nextCache[filename] = { summary, hash };
        })
      );

      if (i + batchSize < filesToSummarize.length) {
        await this.sleep(200);
      }
    }

    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cacheFilePath, JSON.stringify(nextCache, null, 2), 'utf8');
  }

  private readSummaryCache(cacheFilePath: string): Record<string, { summary: string; hash: string }> {
    if (!fs.existsSync(cacheFilePath)) return {};
    try {
      const raw = fs.readFileSync(cacheFilePath, 'utf8');
      if (!raw.trim()) return {};
      return JSON.parse(raw) as Record<string, { summary: string; hash: string }>;
    } catch (error) {
      this.logger.warn(`Failed reading summary cache at ${cacheFilePath}`);
      return {};
    }
  }

  private async generateFileSummary(filename: string): Promise<string> {
    const content = this.fileCache.get(filename) || '';
    const exportsList = this.extractExports(content);
    const importsList = this.extractImports(content);
    const fallback = `${exportsList[0] || path.basename(filename, path.extname(filename))} module`;

    const prompt =
      `In exactly 1 sentence (max 15 words), describe what this file does ` +
      `based on its exports and imports. File: ${filename}\n` +
      `Exports: ${exportsList.join(',') || 'none'}\n` +
      `Imports: ${importsList.join(',') || 'none'}\n` +
      'Respond with ONLY the sentence. No prefix, no punctuation at end.';

    const schema = z.object({ summary: z.string().min(1) });
    try {
      const result = await Promise.race([
        this.aiProvider.generateStructured(
          prompt,
          schema,
          'FileSummary',
          undefined,
          0
        ),
        this.sleep(5000).then(() => {
          throw new Error('summary timeout');
        }),
      ]);
      const summary = (result as { summary: string }).summary.trim();
      return summary || fallback;
    } catch {
      return fallback;
    }
  }

  private toChangeHash(stats: fs.Stats): string {
    return `${stats.size}-${stats.mtimeMs.toString(36)}`.slice(0, 8);
  }

  private isAlwaysIgnoredPath(relativePath: string): boolean {
    const normalized = relativePath.replace(/\\/g, '/');
    return (
      normalized.includes('/node_modules/') ||
      normalized.includes('/dist/') ||
      normalized.includes('/.git/') ||
      normalized.startsWith('node_modules/') ||
      normalized.startsWith('dist/') ||
      normalized.startsWith('.git/')
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
