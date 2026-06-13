const fs = require('fs').promises;
const path = require('path');

async function debugSwarkDirectories() {
  console.log('🔍 Debug: Looking for Swark generated directories...');
  
  const baseDir = __dirname;
  console.log(`📁 Base directory: ${baseDir}`);
  
  // Look for temp directories
  try {
    const entries = await fs.readdir(baseDir, { withFileTypes: true });
    console.log('\n📂 Found entries in base directory:');
    
    for (const entry of entries) {
      if (entry.isDirectory()) {
        console.log(`  📁 ${entry.name}/`);
        
        // Check if this looks like a temp or output directory
        if (entry.name.includes('temp') || entry.name.includes('output') || entry.name.includes('swark')) {
          console.log(`    🔍 Exploring ${entry.name}...`);
          await exploreDirectory(path.join(baseDir, entry.name), '    ');
        }
      } else {
        console.log(`  📄 ${entry.name}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error reading base directory:', error);
  }
}

async function exploreDirectory(dirPath, indent = '') {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        console.log(`${indent}📁 ${entry.name}/`);
        
        // If it's filtered-filesystem, explore deeper
        if (entry.name === 'filtered-filesystem') {
          console.log(`${indent}  🎯 Found filtered-filesystem! Exploring...`);
          await exploreDirectory(fullPath, indent + '    ');
        } else if (entry.name.startsWith('batch')) {
          console.log(`${indent}  📦 Found batch directory: ${entry.name}`);
          await exploreDirectory(fullPath, indent + '    ');
        }
      } else {
        const ext = path.extname(entry.name).toLowerCase();
        const isCodeFile = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java'].includes(ext);
        const marker = isCodeFile ? '✅' : '📄';
        console.log(`${indent}${marker} ${entry.name} ${isCodeFile ? '(CODE)' : ''}`);
      }
    }
  } catch (error) {
    console.error(`${indent}❌ Error reading directory ${dirPath}:`, error.message);
  }
}

// Also check for common workspace paths where Swark might create temp directories
async function checkCommonPaths() {
  console.log('\n🔍 Checking common paths for Swark directories...');
  
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
      console.log(`✅ Found directory: ${checkPath}`);
      await exploreDirectory(checkPath, '  ');
    } catch {
      console.log(`❌ Not found: ${checkPath}`);
    }
  }
}

async function main() {
  await debugSwarkDirectories();
  await checkCommonPaths();
  console.log('\n🎯 Debug completed!');
}

main();
