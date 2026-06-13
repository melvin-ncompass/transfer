const path = require('path');
const fs = require('fs').promises;

async function testFunctionScanning() {

  const testDir = path.join(__dirname, 'src');
  const codeFiles = [];
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'];
  
  const scanDirectory = async (dirPath, relativePath = '') => {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativeFilePath = path.join(relativePath, entry.name).replace(/\\/g, '/');
      
      if (entry.isDirectory()) {
        if (!['node_modules', '.git', 'dist', 'build', 'out'].includes(entry.name)) {
          await scanDirectory(fullPath, relativeFilePath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (codeExtensions.includes(ext)) {
          codeFiles.push(relativeFilePath);
        }
      }
    }
  };
  
  await scanDirectory(testDir);

  codeFiles.slice(0, 10).forEach(file => );
  if (codeFiles.length > 10) {
    
  }

  if (codeFiles.length > 0) {
    const testFile = path.join(testDir, codeFiles[0]);

    try {
      const content = await fs.readFile(testFile, 'utf8');
      
      }...`);
    } catch (error) {
      
    }
  }
}

testFunctionScanning();
