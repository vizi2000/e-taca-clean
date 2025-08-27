#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files that need to be updated
const filesToUpdate = [
  'app/[slug]/[goalSlug]/page.tsx',
  'app/reset-password/page.tsx',
  'app/reset-password/confirm/page.tsx',
  'app/panel/qr/page.tsx',
  'app/panel/donations/page.tsx',
  'app/panel/goals/page.tsx'
];

// Function to update a file
function updateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;
  
  // Check if import already exists
  const hasImport = content.includes("import { apiEndpoint } from '@/lib/api/config'");
  
  // Add import if not present
  if (!hasImport) {
    // Find the right place to add the import
    const importRegex = /^import .* from ['"].*['"]$/m;
    const lastImportMatch = content.match(/^(import .* from ['"].*['"][\n\r]*)+/m);
    
    if (lastImportMatch) {
      const lastImportEnd = lastImportMatch.index + lastImportMatch[0].length;
      content = content.slice(0, lastImportEnd - 1) + 
                "\nimport { apiEndpoint } from '@/lib/api/config'" +
                content.slice(lastImportEnd - 1);
    } else {
      // If no imports found, add after 'use client'
      content = content.replace(
        "'use client'",
        "'use client'\n\nimport { apiEndpoint } from '@/lib/api/config'"
      );
    }
  }
  
  // Replace all localhost URLs
  const urlPatterns = [
    // Simple fetch calls
    { 
      pattern: /fetch\(['"]http:\/\/localhost:\d+\/api\/([^'"]+)['"]/g,
      replacement: "fetch(apiEndpoint('/$1')"
    },
    // Template literal fetch calls
    {
      pattern: /fetch\(`http:\/\/localhost:\d+\/api\/([^`]+)`/g,
      replacement: (match, path) => {
        // Check if path contains ${} expressions
        if (path.includes('${')) {
          return `fetch(apiEndpoint(\`/${path}\`)`;
        }
        return `fetch(apiEndpoint('/${path}')`;
      }
    },
    // QR code base URLs
    {
      pattern: /const baseUrl = ['"]http:\/\/localhost:\d+['"]/g,
      replacement: "const baseUrl = window.location.origin"
    },
    // Direct URL returns
    {
      pattern: /return [`']http:\/\/localhost:\d+\/api\/([^`']+)[`']/g,
      replacement: (match, path) => {
        if (path.includes('${')) {
          return `return apiEndpoint(\`/${path}\`)`;
        }
        return `return apiEndpoint('/${path}')`;
      }
    }
  ];
  
  // Apply all replacements
  urlPatterns.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });
  
  // Only write if content changed
  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ Updated: ${filePath}`);
  } else {
    console.log(`⏭️  No changes needed: ${filePath}`);
  }
}

// Update all files
console.log('🔧 Fixing localhost URLs in frontend files...\n');
filesToUpdate.forEach(updateFile);
console.log('\n✨ Done!');