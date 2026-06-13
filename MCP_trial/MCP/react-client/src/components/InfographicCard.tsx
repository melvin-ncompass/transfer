import { useMemo } from 'react';

interface InfographicModule {
    name: string;
    fileCount: number;
    responsibility: string;
}

interface InfographicData {
    title: string;
    stack: string[];
    modules: InfographicModule[];
    dbTables: number;
    entryPoint: string;
    summary: string;
}

export function InfographicCard({ data }: { data: string }) {
    const parsed: InfographicData | null = useMemo(() => {
        try {
            return JSON.parse(data);
        } catch {
            return null;
        }
    }, [data]);

    if (!parsed) {
        return (
            <div style={{ border: '2px solid #ef4444', borderRadius: '12px', padding: '16px', color: '#fca5a5' }}>
                Invalid Infographic JSON
            </div>
        );
    }

    return (
        <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(0,255,170,0.03) 100%)',
            backdropFilter: 'blur(24px) saturate(160%)',
            WebkitBackdropFilter: 'blur(24px) saturate(160%)',
            border: '1px solid rgba(0,255,170,0.12)',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06)',
            padding: '24px',
            width: '100%',
            color: 'rgba(255,255,255,0.85)',
        }}>
            {/* Header */}
            <div className="mb-6">
                <h2 style={{ color: '#a8ffd8', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>{parsed.title}</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{parsed.summary}</p>
            </div>

            {/* Stack Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
                {parsed.stack?.map((tech, i) => (
                    <span key={i} style={{
                        background: 'rgba(0,255,170,0.1)',
                        border: '1px solid rgba(0,255,170,0.25)',
                        borderRadius: '20px',
                        padding: '3px 12px',
                        fontSize: '12px',
                        color: '#a8ffd8',
                    }}>{tech}</span>
                ))}
            </div>

            {/* Modules Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                {parsed.modules?.map((mod, i) => (
                    <div key={i} style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '12px',
                        padding: '12px',
                    }}>
                        <div style={{ color: '#a8ffd8', fontWeight: 600, fontSize: '13px', marginBottom: '4px' }}>
                            {mod.name} <span style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 400 }}>({mod.fileCount} files)</span>
                        </div>
                        <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{mod.responsibility}</div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex gap-4">
                <div style={{ background: 'rgba(0,255,170,0.08)', border: '1px solid rgba(0,255,170,0.2)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>DB Tables: </span>
                    <span style={{ color: '#a8ffd8', fontWeight: 600 }}>{parsed.dbTables}</span>
                </div>
                <div style={{ background: 'rgba(0,255,170,0.08)', border: '1px solid rgba(0,255,170,0.2)', borderRadius: '8px', padding: '8px 14px', fontSize: '12px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.4)' }}>Entry: </span>
                    <span style={{ color: '#a8ffd8', fontWeight: 600, fontFamily: 'monospace' }}>{parsed.entryPoint}</span>
                </div>
            </div>
        </div>
    );
}
