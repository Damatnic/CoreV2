const fs = require('fs');
const path = require('path');

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const size = Buffer.byteLength(content, 'utf8');
  const lines = content.split('\n').length;
  const exports = (content.match(/export /g) || []).length;
  
  return { size, lines, exports };
}

console.log('📊 ICON BUNDLE ANALYSIS');
console.log('='.repeat(50));

const files = [
  { name: 'Original icons.tsx', path: '../src/components/icons.tsx' },
  { name: 'Optimized icons.tsx', path: '../src/components/icons.optimized.tsx' },
  { name: 'Dynamic icons.tsx', path: '../src/components/icons.dynamic.tsx' }
];

let totalSavings = 0;
let originalSize = 0;

files.forEach((file, index) => {
  const filePath = path.join(__dirname, file.path);
  
  if (fs.existsSync(filePath)) {
    const analysis = analyzeFile(filePath);
    const sizeKB = (analysis.size / 1024).toFixed(2);
    
    if (index === 0) originalSize = analysis.size;
    if (index > 0) {
      const savings = originalSize - analysis.size;
      const savingsPercent = ((savings / originalSize) * 100).toFixed(1);
      totalSavings += savings;
      
      console.log(`\n${file.name}:`);
      console.log(`  Size: ${sizeKB} KB (${analysis.size} bytes)`);
      console.log(`  Lines: ${analysis.lines}`);
      console.log(`  Exports: ${analysis.exports}`);
      console.log(`  Savings: ${savings} bytes (${savingsPercent}%)`);
    } else {
      console.log(`\n${file.name}:`);
      console.log(`  Size: ${sizeKB} KB (${analysis.size} bytes)`);
      console.log(`  Lines: ${analysis.lines}`);
      console.log(`  Exports: ${analysis.exports}`);
    }
  } else {
    console.log(`\n${file.name}: File not found`);
  }
});

console.log('\n🚀 OPTIMIZATION SUMMARY:');
console.log(`  Total potential savings: ${totalSavings} bytes (${(totalSavings/1024).toFixed(2)} KB)`);
console.log(`  Reduction: ${((totalSavings/originalSize)*100).toFixed(1)}%`);

// Analyze icon path files
const iconPathsDir = path.join(__dirname, '../src/components/icon-paths');
if (fs.existsSync(iconPathsDir)) {
  const iconPaths = fs.readdirSync(iconPathsDir);
  let totalIconPathSize = 0;
  
  iconPaths.forEach(file => {
    const content = fs.readFileSync(path.join(iconPathsDir, file), 'utf8');
    totalIconPathSize += Buffer.byteLength(content, 'utf8');
  });
  
  console.log(`\n📁 LAZY-LOADED ICONS:`);
  console.log(`  Files: ${iconPaths.length}`);
  console.log(`  Total size: ${(totalIconPathSize/1024).toFixed(2)} KB`);
  console.log(`  Average per file: ${(totalIconPathSize/iconPaths.length).toFixed(0)} bytes`);
}

console.log('\n💡 RECOMMENDATIONS:');
console.log('1. Use dynamic icons system for best tree-shaking');
console.log('2. Frequently used icons load immediately');
console.log('3. Rarely used icons load on-demand');
console.log('4. Consider icon sprite sheets for very large apps');
console.log('5. Implement icon caching for repeated lazy loads');
