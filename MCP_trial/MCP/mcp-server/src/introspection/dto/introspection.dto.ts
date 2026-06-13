export interface OverviewResponse {
  projectName: string;
  uptime: number;
  agents: string[];
  db: {
    tableCount: number;
    tables: string[];
  };
  repo: {
    fileCount: number;
    topDirs: string[];
    indexedChunks: number;
  };
  generatedAt: string;
}

export interface RepoTreeNode {
  name: string;
  type: 'file' | 'dir';
  children?: RepoTreeNode[];
}

export interface RepoResponse {
  rootPath: string;
  fileCount: number;
  topDirs: string[];
  byExtension: Record<string, number>;
  tree: RepoTreeNode[];
  indexedAt: string;
}

export interface ColumnInfo {
  name: string;
  type: string;
}

export interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

export interface DbResponse {
  tables: TableInfo[];
  generatedAt: string;
}
