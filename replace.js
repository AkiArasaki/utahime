const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('flags: 64')) {
    content = content.replace(/ephemeral: *true/g, 'flags: 64');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✔ Replaced in ${filePath}`);
  }
}

function walk(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.js')) {
      replaceInFile(fullPath);
    }
  });
}

walk('./'); // Start from the current directory
