import React from 'react';
import { Link } from 'react-router-dom';
import { Database, Zap, ArrowRight } from 'lucide-react';
import './MindmapIndex.css';

const MindmapIndex: React.FC = () => {
    return (
        <div className="mindmap-index">
            <div className="index-container">
                <h1 className="index-title">Choose Your Mindmap Experience</h1>
                <p className="index-subtitle">
                    Select between our professional Neo4j-style interface or the classic visualization
                </p>
                
                <div className="mindmap-options">
                    {/* Neo4j Style Option */}
                    <Link to="/mindmap/neo4j" className="mindmap-option featured">
                        <div className="option-icon neo4j-icon">
                            <Database size={32} />
                        </div>
                        <div className="option-content">
                            <h3>Neo4j Browser Style</h3>
                            <p>
                                Professional graph database interface with Cypher queries, 
                                property panels, and advanced visualization features.
                            </p>
                            <ul className="feature-list">
                                <li>✨ Professional Neo4j Browser UI</li>
                                <li>🔍 Cypher-style query interface</li>
                                <li>📊 Interactive database panels</li>
                                <li>🎯 Node property inspector</li>
                                <li>⚡ Force-directed layout</li>
                                <li>🎨 Module-based color coding</li>
                            </ul>
                        </div>
                        <div className="option-arrow">
                            <ArrowRight size={24} />
                        </div>
                        <div className="new-badge">NEW</div>
                    </Link>
                    
                    {/* Classic Option */}
                    <Link to="/mindmap/classic" className="mindmap-option">
                        <div className="option-icon classic-icon">
                            <Zap size={32} />
                        </div>
                        <div className="option-content">
                            <h3>Classic Mindmap</h3>
                            <p>
                                The original mindmap interface with simple search and 
                                tree-based visualization.
                            </p>
                            <ul className="feature-list">
                                <li>🌳 Tree-based layout</li>
                                <li>🔍 Simple text search</li>
                                <li>📱 Mobile-friendly</li>
                                <li>⚡ Fast rendering</li>
                                <li>🎯 Click to explore</li>
                            </ul>
                        </div>
                        <div className="option-arrow">
                            <ArrowRight size={24} />
                        </div>
                    </Link>
                </div>
                
                <div className="quick-links">
                    <Link to="/" className="back-link">
                        ← Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default MindmapIndex;
