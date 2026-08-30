const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const isDev = process.argv.includes('--watch');

const distDir = path.join(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir);
}

// Copy static files
function copyStaticFiles() {
  const staticFiles = [
    { src: 'manifest.json', dest: 'dist/manifest.json' },
    { src: 'styles', dest: 'dist/styles', isDir: true }
  ];

  staticFiles.forEach(file => {
    const srcPath = path.join(__dirname, file.src);
    const destPath = path.join(__dirname, file.dest);
    
    if (!fs.existsSync(srcPath)) return;

    if (file.isDir) {
      fs.cpSync(srcPath, destPath, { recursive: true });
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
  console.log('[+] Copied static files to dist/');
}

async function build() {
  // Copy static files first
  copyStaticFiles();

  // Configure esbuild
  const buildOptions = {
    entryPoints: ['scripts/audio-control.js', 'scripts/content.js'],
    bundle: true, // Will bundle if there are imports, otherwise just transpile
    minify: !isDev,
    outdir: 'dist/scripts',
    target: ['chrome100'],
  };

  if (isDev) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log('[!] Watching for changes...');
    
    // Simple watch for static files too
    const chokidar = require('chokidar');
    chokidar.watch(['manifest.json', 'styles/**/*']).on('change', (path) => {
      console.log(`[*] Static file changed: ${path}`);
      copyStaticFiles();
    });
  } else {
    await esbuild.build(buildOptions);
    console.log('[+] Build completed.');
  }
}

build().catch(() => process.exit(1));
