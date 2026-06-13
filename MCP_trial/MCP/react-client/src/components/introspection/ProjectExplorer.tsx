import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { withApiKeyHeaders } from '@/services/auth';

interface OverviewResponse {
  projectName: string;
  uptime: number;
  agents: string[];
  db: { tableCount: number; tables: string[] };
  repo: { fileCount: number; topDirs: string[]; indexedChunks: number };
}

interface ColumnInfo {
  name: string;
  type: string;
}

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
}

interface DbResponse {
  tables: TableInfo[];
}

interface RepoTreeNode {
  name: string;
  type: 'file' | 'dir';
  children?: RepoTreeNode[];
}

interface RepoResponse {
  rootPath: string;
  fileCount: number;
  topDirs: string[];
  byExtension: Record<string, number>;
  tree: RepoTreeNode[];
}

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    headers: withApiKeyHeaders({ 'Content-Type': 'application/json' }),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

function formatUptime(seconds: number): string {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export function ProjectExplorer() {
  const [healthOpen, setHealthOpen] = useState(true);
  const [dbOpen, setDbOpen] = useState(true);
  const [repoOpen, setRepoOpen] = useState(true);

  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const [dbData, setDbData] = useState<DbResponse | null>(null);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [expandedTables, setExpandedTables] = useState<Record<string, boolean>>({});

  const [repoData, setRepoData] = useState<RepoResponse | null>(null);
  const [repoLoading, setRepoLoading] = useState(true);
  const [repoError, setRepoError] = useState<string | null>(null);

  const [reindexPending, setReindexPending] = useState(false);
  const [reindexCooldownUntil, setReindexCooldownUntil] = useState<number>(0);

  useEffect(() => {
    let mounted = true;
    const loadOverview = async () => {
      setOverviewLoading(true);
      setOverviewError(null);
      try {
        const data = await fetchJson<OverviewResponse>('/api/introspection/overview');
        if (mounted) setOverview(data);
      } catch (error: unknown) {
        if (mounted) {
          setOverviewError(error instanceof Error ? error.message : 'Failed to load project health.');
        }
      } finally {
        if (mounted) setOverviewLoading(false);
      }
    };

    void loadOverview();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadDb = async () => {
      setDbLoading(true);
      setDbError(null);
      try {
        const data = await fetchJson<DbResponse>('/api/introspection/db');
        if (mounted) setDbData(data);
      } catch (error: unknown) {
        if (mounted) {
          setDbError(error instanceof Error ? error.message : 'Failed to load database schema.');
        }
      } finally {
        if (mounted) setDbLoading(false);
      }
    };

    void loadDb();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadRepo = async () => {
      setRepoLoading(true);
      setRepoError(null);
      try {
        const data = await fetchJson<RepoResponse>('/api/introspection/repo');
        if (mounted) setRepoData(data);
      } catch (error: unknown) {
        if (mounted) {
          setRepoError(error instanceof Error ? error.message : 'Failed to load repo structure.');
        }
      } finally {
        if (mounted) setRepoLoading(false);
      }
    };

    void loadRepo();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setReindexCooldownUntil((prev) => (prev > Date.now() ? prev : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const reindexRemainingSec = useMemo(() => {
    if (!reindexCooldownUntil) return 0;
    return Math.max(0, Math.ceil((reindexCooldownUntil - Date.now()) / 1000));
  }, [reindexCooldownUntil]);

  const isReindexDisabled = reindexPending || reindexRemainingSec > 0;

  const handleReindex = async () => {
    if (isReindexDisabled) return;

    setReindexPending(true);
    setOverviewError(null);
    setRepoError(null);

    try {
      const response = await fetch(`${API_BASE}/api/introspection/reindex`, {
        method: 'POST',
        headers: withApiKeyHeaders({ 'Content-Type': 'application/json' }),
      });
      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      setReindexCooldownUntil(Date.now() + 60_000);
    } catch (error: unknown) {
      setOverviewError(error instanceof Error ? error.message : 'Failed to trigger reindex.');
    } finally {
      setReindexPending(false);
    }
  };

  const toggleTable = (name: string) => {
    setExpandedTables((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const extensionRows = useMemo(() => {
    if (!repoData) return [];
    return Object.entries(repoData.byExtension).sort((a, b) => b[1] - a[1]);
  }, [repoData]);

  const maxExtCount = useMemo(
    () => (extensionRows.length ? Math.max(...extensionRows.map(([, count]) => count)) : 1),
    [extensionRows],
  );

  return (
    <div className="h-full overflow-y-auto custom-scrollbar pr-1">
      <div className="space-y-4 p-1">
        <section className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl">
          <button
            onClick={() => setHealthOpen((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="font-semibold text-white/90">Project health</span>
            <span className="text-white/60">{healthOpen ? '▾' : '▸'}</span>
          </button>

          {healthOpen && (
            <div className="px-4 pb-4 border-t border-white/10">
              {overviewLoading ? (
                <div className="py-4 text-sm text-white/60">Loading project health...</div>
              ) : overviewError ? (
                <div className="py-4 text-sm text-red-300">{overviewError}</div>
              ) : overview ? (
                <div className="pt-4 space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-white/50">Project</p>
                      <h3 className="text-2xl font-semibold text-white">{overview.projectName}</h3>
                      <p className="text-sm text-white/70 mt-1">Uptime: {formatUptime(overview.uptime)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200">
                        {overview.agents.length} agents
                      </span>
                      <button
                        onClick={handleReindex}
                        disabled={isReindexDisabled}
                        className="px-3 py-1.5 text-xs rounded-lg border border-white/20 bg-white/10 hover:bg-white/15 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {reindexPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        {reindexRemainingSec > 0 ? `Reindex (${reindexRemainingSec}s)` : 'Reindex'}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs">
                    <div className="rounded-lg border border-white/10 p-2 bg-black/20">
                      <p className="text-white/50">Tables</p>
                      <p className="text-white/90 font-medium">{overview.db.tableCount}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 p-2 bg-black/20">
                      <p className="text-white/50">Indexed Files</p>
                      <p className="text-white/90 font-medium">{overview.repo.fileCount}</p>
                    </div>
                    <div className="rounded-lg border border-white/10 p-2 bg-black/20">
                      <p className="text-white/50">Indexed Chunks</p>
                      <p className="text-white/90 font-medium">{overview.repo.indexedChunks}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl">
          <button
            onClick={() => setDbOpen((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="font-semibold text-white/90">Database schema</span>
            <span className="text-white/60">{dbOpen ? '▾' : '▸'}</span>
          </button>

          {dbOpen && (
            <div className="px-4 pb-4 border-t border-white/10">
              {dbLoading ? (
                <div className="pt-4 space-y-3">
                  <div className="h-4 w-40 rounded bg-white/10 animate-pulse" />
                  <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
                  <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
                  <div className="h-10 rounded-lg bg-white/10 animate-pulse" />
                </div>
              ) : dbError ? (
                <div className="py-4 text-sm text-red-300">{dbError}</div>
              ) : (
                <div className="pt-4">
                  <p className="text-xs text-white/60 mb-3">
                    Total tables: <span className="text-white/90 font-medium">{dbData?.tables.length ?? 0}</span>
                  </p>
                  <div className="space-y-2">
                    {(dbData?.tables ?? []).map((table) => {
                      const isOpen = !!expandedTables[table.name];
                      return (
                        <div key={table.name} className="rounded-lg border border-white/10 bg-black/20">
                          <button
                            onClick={() => toggleTable(table.name)}
                            className="w-full px-3 py-2 flex items-center justify-between text-sm text-left"
                          >
                            <span className="text-white/90 font-medium">{table.name}</span>
                            <span className="text-white/60">{isOpen ? '▾' : '▸'}</span>
                          </button>
                          {isOpen && (
                            <div className="px-3 pb-3 border-t border-white/10">
                              <table className="w-full mt-2 text-xs">
                                <thead>
                                  <tr className="text-white/50">
                                    <th className="text-left py-1 font-medium">Column</th>
                                    <th className="text-left py-1 font-medium">Type</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {table.columns.map((col) => (
                                    <tr key={`${table.name}-${col.name}`} className="border-t border-white/5">
                                      <td className="py-1.5 text-white/85">{col.name}</td>
                                      <td className="py-1.5 text-white/70">{col.type}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-white/10 bg-black/30 backdrop-blur-xl">
          <button
            onClick={() => setRepoOpen((v) => !v)}
            className="w-full px-4 py-3 flex items-center justify-between text-left"
          >
            <span className="font-semibold text-white/90">Repo structure</span>
            <span className="text-white/60">{repoOpen ? '▾' : '▸'}</span>
          </button>

          {repoOpen && (
            <div className="px-4 pb-4 border-t border-white/10">
              {repoLoading ? (
                <div className="py-4 text-sm text-white/60">Loading repo structure...</div>
              ) : repoError ? (
                <div className="py-4 text-sm text-red-300">{repoError}</div>
              ) : repoData ? (
                <div className="pt-4 space-y-4">
                  <div className="text-xs text-white/70">
                    <p>
                      Root path: <span className="text-white/90 break-all">{repoData.rootPath}</span>
                    </p>
                    <p className="mt-1">
                      File count: <span className="text-white/90">{repoData.fileCount}</span>
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/60 mb-2">Top directories</p>
                    <div className="flex flex-wrap gap-2">
                      {repoData.topDirs.map((dir) => (
                        <span
                          key={dir}
                          className="text-xs px-2 py-1 rounded-full bg-teal-500/15 border border-teal-400/30 text-teal-200"
                        >
                          {dir}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-white/60 mb-2">By extension</p>
                    <div className="space-y-2">
                      {extensionRows.map(([ext, count]) => {
                        const pct = Math.max(6, Math.round((count / maxExtCount) * 100));
                        return (
                          <div key={ext} className="text-xs">
                            <div className="flex justify-between text-white/80 mb-1">
                              <span>{ext}</span>
                              <span>{count}</span>
                            </div>
                            <div className="h-2 rounded bg-white/10 overflow-hidden">
                              <div className="h-full bg-purple-400/70 rounded" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
