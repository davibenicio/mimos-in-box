// Gera as capturas do topo usadas na abertura (a tela do notebook/celular). Rodar de novo sempre que o topo mudar.
// Uso: node tools/capturas-intro.cjs http://localhost:4391  → public/img/intro/{pc,cel}-{claro,escuro}.webp
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
const base = process.argv[2] || 'http://localhost:4391';
require('fs').mkdirSync('public/img/intro', { recursive: true });
(async () => {
  const b = await chromium.launch();
  for (const [nome, w, h, larg] of [['pc', 1440, 900, 1100], ['cel', 390, 844, 560]]) for (const tema of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: nome === 'cel' ? 2 : 1, isMobile: w < 900, hasTouch: w < 900 });
    await ctx.addInitScript((t) => { try { localStorage.setItem('mimos-tema', t); } catch (e) {} }, tema);
    const p = await ctx.newPage();
    await p.goto(base + '/?captura', { waitUntil: 'networkidle' });
    await p.addStyleTag({ content: '*{animation:none!important;transition:none!important} .cur,.wa,.abas,.prog{display:none!important}' });
    await p.waitForTimeout(900);
    const png = `/tmp/intro-${nome}-${tema}.png`;
    await p.screenshot({ path: png });
    const dest = `public/img/intro/${nome}-${tema === 'light' ? 'claro' : 'escuro'}.webp`;
    execFileSync('python3', ['-c', `from PIL import Image; im=Image.open('${png}').convert('RGB'); im=im.resize((${larg}, round(im.height*${larg}/im.width)), Image.LANCZOS); im.save('${dest}','WEBP',quality=62,method=6); print('${dest}', im.size)`], { stdio: 'inherit' });
    await ctx.close();
  }
  await b.close();
})();
