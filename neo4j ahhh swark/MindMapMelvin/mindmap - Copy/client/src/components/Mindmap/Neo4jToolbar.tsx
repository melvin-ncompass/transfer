import React, { useState } from 'react';
import { Search, Database, BarChart3, Settings, Play, History, Bookmark } from 'lucide-react';
import './Neo4jToolbar.css';

interface Neo4jToolbarProps {
    onQueryRun: (query: string) => void;
    onTogglePanel: (panel: 'database' | 'graph' | 'query') => void;
    activePanels: string[];
}

const Neo4jToolbar: React.FC<Neo4jToolbarProps> = ({ onQueryRun, onTogglePanel, activePanels }) => {
    const [query, setQuery] = useState('MATCH (n:Function) RETURN n LIMIT 25');
    const [queryHistory, setQueryHistory] = useState<string[]>([
        'MATCH (n:Function) RETURN n LIMIT 25',
        'MATCH (n:Function)-[r:DEPENDS_ON]->(m:Function) RETURN n, r, m',
        'MATCH (n:Function) WHERE n.complexity > 5 RETURN n',
        'MATCH (n:Function) WHERE n.isEntryPoint = true RETURN n'
    ]);

    const handleRunQuery = () => {
        onQueryRun(query);
        if (!queryHistory.includes(query)) {
            setQueryHistory(prev => [query, ...prev.slice(0, 9)]);
        }
    };

    const predefinedQueries = [
        {
            name: 'All Functions',
            query: 'MATCH (n:Function) RETURN n LIMIT 25',
            description: 'Show all function nodes'
        },
        {
            name: 'Dependencies',
            query: 'MATCH (n:Function)-[r:DEPENDS_ON]->(m:Function) RETURN n, r, m LIMIT 50',
            description: 'Show function dependencies'
        },
        {
            name: 'Complex Functions',
            query: 'MATCH (n:Function) WHERE n.complexity > 5 RETURN n ORDER BY n.complexity DESC',
            description: 'Find complex functions'
        },
        {
            name: 'Entry Points',
            query: 'MATCH (n:Function) WHERE n.isEntryPoint = true RETURN n',
            description: 'Show entry point functions'
        },
        {
            name: 'Module Analysis',
            query: 'MATCH (n:Function) RETURN n.module as module, count(n) as count ORDER BY count DESC',
            description: 'Count functions by module'
        }
    ];

    return (
        <div className="neo4j-toolbar">
            {/* Logo and Title */}
            <div className="toolbar-brand">
                <div className="neo4j-logo">
                    <Database className="logo-icon" />
                    <span className="brand-text">
                        <span className="neo4j">Neo4j</span>
                        <span className="browser">Browser</span>
                    </span>
                </div>
            </div>

            {/* Main Query Interface */}
            <div className="query-interface">
                <div className="query-input-section">
                    <div className="query-input-container">
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="cypher-query-input"
                            placeholder="Enter Cypher query..."
                            rows={2}
                        />
                        <div className="query-actions">
                            <button onClick={handleRunQuery} className="run-btn">
                                <Play size={16} />
                                Run
                            </button>
                            <button className="save-btn">
                                <Bookmark size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="quick-actions">
                    {predefinedQueries.map((q, index) => (
                        <button
                            key={index}
                            className="quick-query-btn"
                            onClick={() => setQuery(q.query)}
                            title={q.description}
                        >
                            {q.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Panel Controls */}
            <div className="toolbar-controls">
                <button
                    className={`panel-btn ${activePanels.includes('database') ? 'active' : ''}`}
                    onClick={() => onTogglePanel('database')}
                    title="Database Information"
                >
                    <Database size={18} />
                    Database
                </button>
                
                <button
                    className={`panel-btn ${activePanels.includes('graph') ? 'active' : ''}`}
                    onClick={() => onTogglePanel('graph')}
                    title="Graph Statistics"
                >
                    <BarChart3 size={18} />
                    Graph
                </button>

                <button className="settings-btn" title="Settings">
                    <Settings size={18} />
                </button>
            </div>

            {/* Query History Dropdown */}
            <div className="query-history">
                <button className="history-btn">
                    <History size={16} />
                    History
                </button>
                <div className="history-dropdown">
                    {queryHistory.map((q, index) => (
                        <div
                            key={index}
                            className="history-item"
                            onClick={() => setQuery(q)}
                        >
                            {q.length > 50 ? q.substring(0, 50) + '...' : q}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Neo4jToolbar;
