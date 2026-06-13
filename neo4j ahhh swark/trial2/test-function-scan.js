const path = require('path');
const fs = require('fs').promises;

// Simple test to verify our function scanning would work
async function testFunctionScanning() {
  console.log('🧪 Testing function scanning on our own source code...');
  
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
  
  console.log(`📁 Found ${codeFiles.length} code files:`);
  codeFiles.slice(0, 10).forEach(file => console.log(`  ✅ ${file}`));
  if (codeFiles.length > 10) {
    console.log(`  ... and ${codeFiles.length - 10} more files`);
  }
  
  // Now test reading one of these files
  if (codeFiles.length > 0) {
    const testFile = path.join(testDir, codeFiles[0]);
    console.log(`\n📄 Testing file read: ${testFile}`);
    
    try {
      const content = await fs.readFile(testFile, 'utf8');
      console.log(`✅ Successfully read ${content.length} characters`);
      console.log(`📝 First 200 characters: ${content.substring(0, 200)}...`);
    } catch (error) {
      console.error(`❌ Error reading file: ${error.message}`);
    }
  }
}

testFunctionScanning();
