const fs = require('fs').promises;
const path = require('path');

async function scanDirectory(dirPath) {
  const codeFiles = [];
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'];

  try {
    
    try {
      await fs.access(dirPath);
      
    } catch (error) {
      
      return codeFiles;
    }

    const scanDirectoryRecursive = async (currentDir, relativePath = '') => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          
          if (!['node_modules', '.git', 'dist', 'build', 'out'].includes(entry.name)) {
            
            await scanDirectoryRecursive(fullPath, relativeFilePath);
          } else {
            
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          `);
          if (codeExtensions.includes(ext)) {
            
            codeFiles.push(relativeFilePath);
          }
        }
      }
    };

    await scanDirectoryRecursive(dirPath);
    
    if (codeFiles.length > 0) {
      .join(', ')}${codeFiles.length > 5 ? '...' : ''}`);
    }
  } catch (error) {
    
  }

  return codeFiles;
}

async function testScanner() {
  const testDir = path.join(__dirname, 'src');
  
  const files = await scanDirectory(testDir);
  
}

testScanner();
