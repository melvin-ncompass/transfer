import { useState, useRef, useEffect } from 'react';
import { Trash2, HardDrive, Copy, FolderOpen, AlertCircle, CheckCircle, Loader, Terminal, Skull, Zap, Shield, Folder, ChevronRight, ArrowLeft, X } from 'lucide-react';

interface FileInstance {
    id: string;
    name: string;
    path: string;
    size: number;
}

interface DuplicateGroup {
    id: string;
    hash: string;
    instances: FileInstance[];
}

interface LargeFile {
    id: string;
    name: string;
    path: string;
    size: number;
    type: string;
}

// Custom Folder Browser Modal Component
function FolderBrowserModal({ isOpen, onClose, onSelect, apiUrl }: {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (path: string) => void;
    apiUrl: string;
}) {
    const [currentPath, setCurrentPath] = useState('');
    const [folders, setFolders] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadDirectory('');
        }
    }, [isOpen]);

    const loadDirectory = async (path: string) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${apiUrl}/list-dir?path=${encodeURIComponent(path)}`);
            const data = await res.json();
            if (data.error) {
                setError(data.error);
                setFolders([]);
            } else {
                setFolders(data.folders || []);
                setCurrentPath(data.path || '');
            }
        } catch (e) {
            setError('CONNECTION_FAILED');
            setFolders([]);
        }
        setLoading(false);
    };

    const navigateTo = (folder: string) => {
        const newPath = currentPath ? `${currentPath}\\${folder}` : folder;
        loadDirectory(newPath);
    };

    const goBack = () => {
        if (currentPath) {
            const parts = currentPath.split('\\');
            parts.pop();
            const parentPath = parts.join('\\');
            loadDirectory(parentPath);
        }
    };

    const selectCurrent = () => {
        onSelect(currentPath);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ animation: 'fadeIn 0.3s ease-out' }}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
                style={{ animation: 'fadeIn 0.2s ease-out' }}
            />

            {/* Modal */}
            <div
                className="relative w-full max-w-2xl bg-black border-2 border-[#00ff41] rounded-lg shadow-[0_0_50px_rgba(0,255,65,0.3)] overflow-hidden"
                style={{ animation: 'slideUp 0.3s ease-out' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#00ff41]/30 bg-[#00ff41]/5">
                    <div className="flex items-center gap-3">
                        <Folder className="w-6 h-6 text-[#00ff41] neon-text" />
                        <h2 className="text-lg font-bold text-[#00ff41] tracking-wider" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            DIRECTORY_BROWSER
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-[#00ff41]/20 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-[#00ff41]" />
                    </button>
                </div>

                {/* Current Path */}
                <div className="flex items-center gap-2 p-3 bg-black/50 border-b border-[#00ff41]/20">
                    <button
                        onClick={goBack}
                        disabled={!currentPath}
                        className="p-2 border border-[#00ff41]/50 rounded hover:bg-[#00ff41]/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    >
                        <ArrowLeft className="w-4 h-4 text-[#00ff41]" />
                    </button>
                    <div className="flex-1 px-3 py-2 bg-black border border-[#00ff41]/30 rounded text-[#00ff41] text-sm font-mono overflow-hidden">
                        <span className="text-[#00ff41]/50">PATH: </span>
                        {currentPath || 'SELECT_DRIVE...'}
                    </div>
                </div>

                {/* Folder List */}
                <div className="h-[400px] overflow-y-auto p-2">
                    {loading && (
                        <div className="flex items-center justify-center h-full gap-3 text-[#00ff41]">
                            <Loader className="w-6 h-6 animate-spin" />
                            <span className="animate-pulse">SCANNING_DIRECTORY...</span>
                        </div>
                    )}

                    {error && (
                        <div className="flex items-center justify-center h-full gap-3 text-[#ff0040]">
                            <AlertCircle className="w-6 h-6" />
                            <span>{error}</span>
                        </div>
                    )}

                    {!loading && !error && folders.length === 0 && (
                        <div className="flex items-center justify-center h-full text-[#00ff41]/40">
                            NO_SUBDIRECTORIES_FOUND
                        </div>
                    )}

                    {!loading && !error && folders.map((folder, idx) => (
                        <button
                            key={idx}
                            onClick={() => navigateTo(folder)}
                            className="w-full flex items-center gap-3 p-3 mb-1 bg-black/30 border border-[#00ff41]/20 rounded hover:bg-[#00ff41]/10 hover:border-[#00ff41]/50 transition-all group"
                            style={{ animation: `slideIn 0.2s ease-out ${idx * 0.03}s both` }}
                        >
                            <Folder className="w-5 h-5 text-[#00ff41]/60 group-hover:text-[#00ff41] transition-colors" />
                            <span className="flex-1 text-left text-[#00ff41] truncate">{folder}</span>
                            <ChevronRight className="w-4 h-4 text-[#00ff41]/40 group-hover:text-[#00ff41] transition-colors" />
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-[#00ff41]/30 bg-[#00ff41]/5">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 border border-[#00ff41]/50 rounded text-[#00ff41] hover:bg-[#00ff41]/10 transition-all"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={selectCurrent}
                        disabled={!currentPath}
                        className="px-6 py-2 bg-[#00ff41] text-black font-bold rounded hover:shadow-[0_0_20px_rgba(0,255,65,0.5)] disabled:bg-[#00ff41]/30 disabled:cursor-not-allowed transition-all"
                    >
                        SELECT_TARGET
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}

function App() {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMsg, setProgressMsg] = useState("AWAITING_COMMAND...");
    const [showBrowser, setShowBrowser] = useState(false);

    const [largeFiles, setLargeFiles] = useState<LargeFile[]>([]);
    const [duplicates, setDuplicates] = useState<DuplicateGroup[]>([]);
    const [stats, setStats] = useState({ totalSize: 0, duplicateSize: 0, largeFileSize: 0 });

    const [selectedItems, setSelectedItems] = useState(new Set());
    const [activeTab, setActiveTab] = useState('large');
    const [scanPath, setScanPath] = useState('');
    const [logs, setLogs] = useState<any[]>([
        { message: 'SYSTEM_INITIALIZED', type: 'success', time: new Date().toLocaleTimeString() },
        { message: 'NEURAL_LINK_ESTABLISHED', type: 'info', time: new Date().toLocaleTimeString() },
    ]);

    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // API Helper - NestJS Backend
    const API_URL = 'http://localhost:3000';

    const addLog = (message: string, type = 'info') => {
        setLogs(prev => [...prev.slice(-50), { message: message.toUpperCase().replace(/ /g, '_'), type, time: new Date().toLocaleTimeString() }]);
    };

    const browseFolder = () => {
        setShowBrowser(true);
        addLog('OPENING_DIRECTORY_BROWSER', 'info');
    };

    const handleFolderSelect = (path: string) => {
        setScanPath(path);
        addLog(`TARGET_ACQUIRED: ${path}`, 'success');
    };

    const startScan = async () => {
        if (!scanPath) {
            addLog('ERROR: NO_TARGET_SPECIFIED', 'error');
            return;
        }

        try {
            const res = await fetch(`${API_URL}/scan/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: scanPath })
            });

            if (!res.ok) {
                const err = await res.json();
                addLog(err.detail || 'SCAN_INIT_FAILED', 'error');
                return;
            }

            setScanning(true);
            setProgress(0);
            setLargeFiles([]);
            setDuplicates([]);
            setSelectedItems(new Set());
            addLog(`INFILTRATING: ${scanPath}`, 'info');

            if (pollInterval.current) clearInterval(pollInterval.current);
            pollInterval.current = setInterval(checkProgress, 1000);

        } catch (e) {
            addLog('CONNECTION_LOST: SERVER_UNREACHABLE', 'error');
        }
    };

    const checkProgress = async () => {
        try {
            const res = await fetch(`${API_URL}/scan/progress`);
            const data = await res.json();

            setProgress(data.progress);
            setProgressMsg(data.message?.toUpperCase().replace(/ /g, '_') || 'PROCESSING...');

            if (!data.scanning && data.results) {
                clearInterval(pollInterval.current as ReturnType<typeof setInterval>);
                setScanning(false);
                processResults(data.results);
                addLog('SCAN_COMPLETE: DATA_EXTRACTED', 'success');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const processResults = (results: any) => {
        setLargeFiles(results.largeFiles || []);
        setDuplicates(results.duplicates || []);

        const lfSize = (results.largeFiles || []).reduce((sum: number, f: any) => sum + f.size, 0);
        const dupSize = (results.duplicates || []).reduce((sum: number, d: any) =>
            sum + (d.instances[0].size * (d.instances.length - 1)), 0);

        setStats({
            totalSize: lfSize + dupSize,
            largeFileSize: lfSize,
            duplicateSize: dupSize
        });
    };

    useEffect(() => {
        return () => {
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, []);

    const formatSize = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
        if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${bytes} B`;
    };

    const toggleSelection = (id: any) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            return newSet;
        });
    };

    const selectAllInGroup = (group: any) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            group.instances.forEach((item: any) => newSet.add(item.id));
            return newSet;
        });
    };

    const deleteSelected = async () => {
        const count = selectedItems.size;
        if (count === 0) return;

        if (!window.confirm(`[WARNING] PERMANENT_DELETION: ${count} TARGETS\nPROCEED?`)) return;

        addLog(`INITIATING_PURGE: ${count} TARGETS`, 'info');

        const pathsToDelete: string[] = [];
        largeFiles.forEach(f => { if (selectedItems.has(f.id)) pathsToDelete.push(f.path); });
        duplicates.forEach(d => { d.instances.forEach(inst => { if (selectedItems.has(inst.id)) pathsToDelete.push(inst.path); }); });

        try {
            const res = await fetch(`${API_URL}/delete`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: pathsToDelete })
            });

            const result = await res.json();

            if (result.deleted > 0) {
                addLog(`PURGE_COMPLETE: ${result.deleted} ELIMINATED`, 'success');
                setLargeFiles(prev => prev.filter(f => !selectedItems.has(f.id)));
                setDuplicates(prev => prev.map(group => ({
                    ...group,
                    instances: group.instances.filter(inst => !selectedItems.has(inst.id))
                })).filter(group => group.instances.length > 1));
                setSelectedItems(new Set());
            }

            if (result.errors?.length > 0) {
                result.errors.forEach((e: string) => addLog(e, 'error'));
            }
        } catch (e) {
            addLog('PURGE_FAILED: ACCESS_DENIED', 'error');
        }
    };

    const getSelectedSize = () => {
        let total = 0;
        largeFiles.forEach(f => { if (selectedItems.has(f.id)) total += f.size; });
        duplicates.forEach(group => { group.instances.forEach(inst => { if (selectedItems.has(inst.id)) total += inst.size; }); });
        return total;
    };

    return (
        <div className="min-h-screen p-6 relative">
            {/* Folder Browser Modal */}
            <FolderBrowserModal
                isOpen={showBrowser}
                onClose={() => setShowBrowser(false)}
                onSelect={handleFolderSelect}
                apiUrl={API_URL}
            />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="mb-8 text-center">
                    <div className="flex items-center justify-center gap-4 mb-4">
                        {/* <Skull className="w-10 h-10 text-[#00ff41] neon-text" /> */}
                        <h1 className="text-4xl md:text-5xl font-black tracking-wider neon-text" style={{ fontFamily: 'Orbitron, sans-serif' }}>
                            SYSTEM_PURGE
                        </h1>
                        {/* <Skull className="w-10 h-10 text-[#00ff41] neon-text" /> */}
                    </div>
                    <p className="text-[#00ff41]/60 text-sm tracking-[0.3em]">[ DISK_INFILTRATION_PROTOCOL v2.0 ]</p>
                    <div className="mt-2 flex items-center justify-center gap-2 text-xs text-[#00ff41]/40">
                        <Shield className="w-3 h-3" />
                        <span>ENCRYPTION: AES-256</span>
                        <span>|</span>
                        <Zap className="w-3 h-3" />
                        <span>STATUS: ONLINE</span>
                    </div>
                </div>

                {/* Scan Input */}
                <div className="cyber-card rounded-lg p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4 text-[#00ff41]/60 text-xs">
                        <Terminal className="w-4 h-4" />
                        <span>root@system:~$ </span>
                        <span className="animate-pulse">▌</span>
                    </div>
                    <div className="flex flex-col md:flex-row gap-4">
                        <button
                            onClick={browseFolder}
                            disabled={scanning}
                            className="cyber-btn px-6 py-3 rounded font-bold"
                        >
                            [BROWSE]
                        </button>
                        <input
                            type="text"
                            value={scanPath}
                            onChange={(e) => setScanPath(e.target.value)}
                            placeholder="ENTER_TARGET_PATH..."
                            className="terminal-input flex-1 px-4 py-3 rounded font-mono"
                            disabled={scanning}
                        />
                        <button
                            onClick={startScan}
                            disabled={scanning}
                            className="cyber-btn px-8 py-3 rounded font-bold flex items-center justify-center gap-2"
                        >
                            {scanning ? (
                                <>
                                    <Loader className="w-5 h-5 animate-spin" />
                                    SCANNING...
                                </>
                            ) : (
                                <>
                                    <HardDrive className="w-5 h-5" />
                                    EXECUTE
                                </>
                            )}
                        </button>
                    </div>

                    {scanning && (
                        <div className="mt-6">
                            <div className="flex justify-between text-xs text-[#00ff41]/60 mb-2">
                                <span>PROGRESS</span>
                                <span className="neon-text">{Math.round(progress)}%</span>
                            </div>
                            <div className="cyber-progress rounded-full h-3 overflow-hidden">
                                <div
                                    className="cyber-progress-bar h-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-[#00ff41] text-sm mt-3 font-mono animate-pulse">{`> ${progressMsg}`}</p>
                        </div>
                    )}
                </div>

                {/* Stats Cards */}
                {(largeFiles.length > 0 || duplicates.length > 0) && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="cyber-card rounded-lg p-4 text-center">
                            <div className="text-[#00ff41]/50 text-xs mb-2 tracking-wider">BLOAT_DETECTED</div>
                            <div className="text-2xl font-bold text-[#00ffff] neon-text">{formatSize(stats.largeFileSize)}</div>
                        </div>
                        <div className="cyber-card rounded-lg p-4 text-center">
                            <div className="text-[#00ff41]/50 text-xs mb-2 tracking-wider">REDUNDANCY_FOUND</div>
                            <div className="text-2xl font-bold text-[#ffaa00] neon-text">{formatSize(stats.duplicateSize)}</div>
                        </div>
                        <div className="cyber-card rounded-lg p-4 text-center">
                            <div className="text-[#00ff41]/50 text-xs mb-2 tracking-wider">MARKED_FOR_DELETION</div>
                            <div className="text-2xl font-bold text-[#ff0040] neon-text">{formatSize(getSelectedSize())}</div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                {(largeFiles.length > 0 || duplicates.length > 0) && (
                    <>
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setActiveTab('large')}
                                className={`px-6 py-3 rounded-t font-bold tracking-wider transition-all ${activeTab === 'large'
                                    ? 'bg-[#00ff41]/10 border-t-2 border-[#00ff41] text-[#00ff41] neon-text'
                                    : 'bg-transparent border border-[#00ff41]/30 text-[#00ff41]/50 hover:text-[#00ff41]'
                                    }`}
                            >
                                BLOAT [{largeFiles.length}]
                            </button>
                            <button
                                onClick={() => setActiveTab('duplicates')}
                                className={`px-6 py-3 rounded-t font-bold tracking-wider transition-all ${activeTab === 'duplicates'
                                    ? 'bg-[#00ff41]/10 border-t-2 border-[#00ff41] text-[#00ff41] neon-text'
                                    : 'bg-transparent border border-[#00ff41]/30 text-[#00ff41]/50 hover:text-[#00ff41]'
                                    }`}
                            >
                                CLONES [{duplicates.length}]
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="cyber-card rounded-lg p-6 mb-6 min-h-[400px]">
                            {activeTab === 'large' && largeFiles.length === 0 && (
                                <div className="text-center text-[#00ff41]/40 py-20">NO_BLOAT_DETECTED</div>
                            )}
                            {activeTab === 'large' && (
                                <div className="space-y-2">
                                    {largeFiles.map(file => (
                                        <div
                                            key={file.id}
                                            className="flex items-center gap-4 p-4 bg-black/50 hover:bg-[#00ff41]/5 rounded border border-[#00ff41]/20 hover:border-[#00ff41]/50 transition-all group cursor-pointer"
                                            onClick={() => toggleSelection(file.id)}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(file.id)}
                                                onChange={() => toggleSelection(file.id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <FolderOpen className="w-5 h-5 text-[#00ff41]/40 group-hover:text-[#00ff41] transition-colors" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[#00ff41] truncate">{file.name}</div>
                                                <div className="text-xs text-[#00ff41]/40 truncate">{file.path}</div>
                                            </div>
                                            <div className="text-[#00ffff] font-bold">{formatSize(file.size)}</div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'duplicates' && duplicates.length === 0 && (
                                <div className="text-center text-[#00ff41]/40 py-20">NO_CLONES_DETECTED</div>
                            )}
                            {activeTab === 'duplicates' && (
                                <div className="space-y-6">
                                    {duplicates.map(group => (
                                        <div key={group.id} className="border border-[#ffaa00]/30 rounded-lg p-4 bg-black/30">
                                            <div className="flex justify-between items-center mb-3">
                                                <div className="flex items-center gap-2">
                                                    <Copy className="w-5 h-5 text-[#ffaa00]" />
                                                    <span className="text-[#ffaa00] font-bold">
                                                        {group.instances.length}x CLONES
                                                    </span>
                                                    <span className="text-xs text-[#ff0040]">
                                                        [WASTED: {formatSize(group.instances[0].size * (group.instances.length - 1))}]
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => selectAllInGroup(group)}
                                                    className="text-xs px-3 py-1 border border-[#00ff41]/50 rounded text-[#00ff41] hover:bg-[#00ff41]/10"
                                                >
                                                    SELECT_ALL
                                                </button>
                                            </div>
                                            <div className="space-y-2">
                                                {group.instances.map((inst) => (
                                                    <div
                                                        key={inst.id}
                                                        className="flex items-center gap-3 p-3 bg-black/50 rounded border border-[#00ff41]/10 hover:border-[#00ff41]/30 cursor-pointer"
                                                        onClick={() => toggleSelection(inst.id)}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedItems.has(inst.id)}
                                                            onChange={() => toggleSelection(inst.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            <div className="text-sm text-[#00ff41] truncate">{inst.name}</div>
                                                            <div className="text-xs text-[#00ff41]/30 truncate">{inst.path}</div>
                                                        </div>
                                                        <div className="text-sm text-[#00ff41]/60">{formatSize(inst.size)}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Delete Button */}
                        <div className="flex flex-col md:flex-row justify-between items-center gap-4 cyber-card rounded-lg p-4 sticky bottom-4">
                            <div className="text-[#00ff41]/60 font-mono text-sm">
                                {selectedItems.size > 0 ? (
                                    <span>
                                        <span className="text-[#ff0040] font-bold neon-text">{selectedItems.size}</span> TARGETS_LOCKED
                                        [{formatSize(getSelectedSize())}]
                                    </span>
                                ) : (
                                    <span className="animate-pulse">SELECT_TARGETS_FOR_ELIMINATION...</span>
                                )}
                            </div>
                            <button
                                onClick={deleteSelected}
                                disabled={selectedItems.size === 0}
                                className={`px-8 py-3 rounded font-bold flex items-center gap-2 transition-all ${selectedItems.size === 0
                                    ? 'bg-transparent border border-[#333] text-[#333] cursor-not-allowed'
                                    : 'bg-[#ff0040] border-2 border-[#ff0040] text-white hover:shadow-[0_0_30px_#ff0040] hover:scale-105'
                                    }`}
                            >
                                <Trash2 className="w-5 h-5" />
                                PURGE
                            </button>
                        </div>
                    </>
                )}

                {/* Terminal Logs */}
                <div className="mt-6 cyber-card rounded-lg p-4">
                    <div className="flex items-center gap-2 text-[#00ff41]/60 text-xs mb-3">
                        <Terminal className="w-4 h-4" />
                        <span>SYSTEM_LOG</span>
                        <span className="ml-auto text-[#00ff41]/30">{logs.length} entries</span>
                    </div>
                    <div className="space-y-1 max-h-48 overflow-y-auto font-mono text-xs">
                        {logs.map((log, idx) => (
                            <div key={idx} className="flex items-start gap-2 py-1">
                                <span className="text-[#00ff41]/30 shrink-0">[{log.time}]</span>
                                {log.type === 'success' && <CheckCircle className="w-3 h-3 text-[#00ff41] shrink-0 mt-0.5" />}
                                {log.type === 'error' && <AlertCircle className="w-3 h-3 text-[#ff0040] shrink-0 mt-0.5" />}
                                {log.type === 'info' && <span className="text-[#00ffff] shrink-0">{'>'}</span>}
                                <span className={
                                    log.type === 'success' ? 'text-[#00ff41]' :
                                        log.type === 'error' ? 'text-[#ff0040]' :
                                            'text-[#00ff41]/70'
                                }>{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-8 text-[#00ff41]/20 text-xs tracking-widest">
                    ═══════════════════════════════════════════════════════════════
                    <br />
                    SYSTEM_PURGE // UNAUTHORIZED_ACCESS_PROHIBITED
                    <br />
                    ═══════════════════════════════════════════════════════════════
                </div>
            </div>
        </div>
    );
}

export default App;
