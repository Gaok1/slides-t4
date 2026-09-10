// Creates the portable, offline HTML without a build framework.
const fs = require('node:fs');
const path = require('node:path');
let html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
html = html.replace(/<link rel="stylesheet" href="([\w.-]+\.css)">/g, (_, file) => `<style>${fs.readFileSync(path.join(__dirname, file), 'utf8')}</style>`);
html = html.replace(/<script src="([\w.-]+\.js)"><\/script>/g, (_, file) => `<script>${fs.readFileSync(path.join(__dirname, file), 'utf8')}</script>`);
html = html.replace(/src="(assets\/[^"]+\.png)"/g, (_, file) => `src="data:image/png;base64,${fs.readFileSync(path.join(__dirname, file)).toString('base64')}"`);
fs.writeFileSync(path.join(__dirname, 'apresentacao.html'), html);
console.log('Criado: apresentacao.html (autônomo, imagens e interações incluídas).');
