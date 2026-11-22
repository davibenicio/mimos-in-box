// Tira telas do site por seção, com rolagem natural. Uso: node tools/telas.cjs <url> <largura> <altura> <pasta>
const { chromium } = require('playwright');
const [url, w = '1440', h = '900', pasta = '/tmp/telas'] = process.argv.slice(2);
const SECOES = ['.hr', '#monte', '#promocoes', '#loja', '#cestas', '.cm', '#como-pedir', '#contato', '.rd'];
(async () => {
  require('fs').mkdirSync(pasta, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: +w < 700, hasTouch: +w < 700 });
  const erros = []; p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); }); p.on('pageerror', (e) => erros.push(String(e)));
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${pasta}/00-abertura.png` });
  await p.waitForTimeout(3600);
  for (let i = 0; i < SECOES.length; i++) {
    const y = await p.evaluate((s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect().top + scrollY : -1; }, SECOES[i]);
    if (y < 0) { console.log('sem', SECOES[i]); continue; }
    const atual = await p.evaluate(() => scrollY);
    for (let k = 1; k <= 6; k++) { await p.mouse.wheel(0, (y - 20 - atual) / 6); await p.waitForTimeout(140); }
    await p.evaluate((yy) => scrollTo({ top: yy - 20, behavior: 'instant' }), y); await p.waitForTimeout(1300);
    await p.screenshot({ path: `${pasta}/${String(i + 1).padStart(2, '0')}.png` });
  }
  const sw = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth, document.documentElement.scrollHeight]);
  console.log('scrollWidth/innerWidth/altura', sw.join(' / '), '| erros:', erros.length ? erros.slice(0, 6) : 'nenhum');
  await b.close();
})();
