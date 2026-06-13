const getModuleColor = (module: string) => {
  const colors = {
    // Core modules
    auth: "#e74c3c",
    user: "#3498db", 
    api: "#2ecc71",
    utils: "#f39c12",
    controller: "#9b59b6",
    service: "#1abc9c",
    
    // Frontend modules
    components: "#ff6b6b",
    pages: "#4ecdc4",
    hooks: "#45b7d1",
    atoms: "#96ceb4", 
    steps: "#feca57",
    
    // Backend modules
    entities: "#fd79a8",
    repositories: "#74b9ff",
    middleware: "#a29bfe",
    config: "#fdcb6e",
    models: "#6c5ce7",
    
    // General
    src: "#55a3ff",
    lib: "#26de81",
    helpers: "#ffa726",
    constants: "#ff7675",
    types: "#00b894",
    interfaces: "#e17055",
    
    // File types
    tsx: "#61dafb",
    ts: "#3178c6", 
    js: "#f7df1e",
    json: "#ff6b35",
    
    // Default
    unknown: "#95a5a6",
  };
  
  // Normalize module name (remove paths, extensions, etc.)
  const normalizedModule = module.toLowerCase()
    .replace(/^.*\//, '') // Remove path
    .replace(/\.(ts|tsx|js|json)$/, '') // Remove extension 
    .replace(/[-_]/g, ''); // Remove separators
    
  return colors[normalizedModule as keyof typeof colors] || colors.unknown;
};

export { getModuleColor };
