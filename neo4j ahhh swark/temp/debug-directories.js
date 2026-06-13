const fs = require('fs').promises;
const path = require('path');

async function debugSwarkDirectories() {

  const baseDir = __dirname;

  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {

        if (entry.name.includes('temp') || entry.name.includes('output') || entry.name.includes('swark')) {
          
          await exploreDirectory(path.join(baseDir, entry.name), '    ');
        }
      } else {
        
      }
    }
    
  } catch (error) {
    
  }
}

async function exploreDirectory(dirPath, indent = '') {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {

        if (entry.name === 'filtered-filesystem') {
          
          await exploreDirectory(fullPath, indent + '    ');
        } else if (entry.name.startsWith('batch')) {
          
          await exploreDirectory(fullPath, indent + '    ');
        }
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        const isCodeFile = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'].includes(ext);
        const marker = isCodeFile ? '✅' : '📄';
        ' : ''}`);
      }
    }
  } catch (error) {
    
  }
}

async function checkCommonPaths() {

  const commonPaths = [
    path.join(process.env.TEMP || process.env.TMP || '/tmp', 'swark'),
    path.join(process.env.TEMP || process.env.TMP || '/tmp'),
    path.join(require('os').homedir(), '.swark'),
    path.join(__dirname, '..', 'temp'),
    path.join(__dirname, 'temp'),
    path.join(__dirname, 'output')
  ];
  
  for (const checkPath of commonPaths) {
    try {
      await fs.access(checkPath);
      
      await exploreDirectory(checkPath, '  ');
    } catch {
      
    }
  }
}

async function main() {
  await debugSwarkDirectories();
  await checkCommonPaths();
  
}

main();
