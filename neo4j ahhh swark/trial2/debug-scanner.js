const fs = require('fs').promises;
const path = require('path');

async function scanDirectory(dirPath) {
  const codeFiles = [];
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'];
  
  console.log(`🔍 Scanning directory: ${dirPath}`);

  try {
    // First check if directory exists
    try {
      await fs.access(dirPath);
      console.log(`✅ Directory exists: ${dirPath}`);
    } catch (error) {
      console.log(`❌ Directory does not exist: ${dirPath}`);
      return codeFiles;
    }

    const scanDirectoryRecursive = async (currentDir, relativePath = '') => {
      const entries = await fs.readdir(currentDir, { withFileTypes: true });
      console.log(`📂 Scanning ${currentDir}: found ${entries.length} entries`);

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        const relativeFilePath = path.join(relativePath, entry.name).replace(/\\/g, '/');

        if (entry.isDirectory()) {
          // Skip common non-code directories
          if (!['node_modules', '.git', 'dist', 'build', 'out'].includes(entry.name)) {
            console.log(`📁 Entering directory: ${entry.name}`);
            await scanDirectoryRecursive(fullPath, relativeFilePath);
          } else {
            console.log(`⏭️ Skipping directory: ${entry.name}`);
          }
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          console.log(`📄 Found file: ${entry.name} (${ext})`);
          if (codeExtensions.includes(ext)) {
            console.log(`✅ Added code file: ${relativeFilePath}`);
            codeFiles.push(relativeFilePath);
          }
        }
      }
    };

    await scanDirectoryRecursive(dirPath);
    console.log(`📁 Scanned filesystem and found ${codeFiles.length} code files`);
    if (codeFiles.length > 0) {
      console.log(`📋 Code files found: ${codeFiles.slice(0, 5).join(', ')}${codeFiles.length > 5 ? '...' : ''}`);
    }
  } catch (error) {
    console.error('❌ Error scanning filtered filesystem:', error);
  }

  return codeFiles;
}

async function testScanner() {
  const testDir = path.join(__dirname, 'src');
  console.log('🧪 Testing filesystem scanner...');
  const files = await scanDirectory(testDir);
  console.log('\n🎯 Test completed!');
}

testScanner();
