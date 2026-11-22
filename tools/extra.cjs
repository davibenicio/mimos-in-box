// Telas extras: abas do catálogo, ficha aberta e quadros da abertura. Uso: node tools/extra.cjs <url> <largura> <altura> <pasta>
const { chromium } = require('playwright');
const [url, w = '1440', h = '900', pasta = '/tmp/telas'] = process.argv.slice(2);
(async () => {
  require('fs').mkdirSync(pasta, { recursive: true });
  const b = await chromium.launch();
  const mob = +w < 700;
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: 1, isMobile: mob, hasTouch: mob });
  const erros = []; p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); }); p.on('pageerror', (e) => erros.push(String(e)));
  await p.goto(url, { waitUntil: 'commit' });
  const t0 = Date.now();
  for (const ms of [500, 1100, 1700, 2100, 2400, 2700, 3100, 3600]) { await p.waitForTimeout(Math.max(0, ms - (Date.now() - t0))); await p.screenshot({ path: `${pasta}/ab-${ms}.png` }); }
  await p.waitForTimeout(2500);
  const vai = async (s, d = 20) => { await p.evaluate(([s, d]) => { const e = document.querySelector(s); scrollTo({ top: e.getBoundingClientRect().top + scrollY - d, behavior: 'instant' }); }, [s, d]); await p.waitForTimeout(900); };
  await vai('#cestas');
  await p.click('#cd-aba-kits-presente'); await p.waitForTimeout(500);
  const it = p.locator('.cd-lista li[data-cat="kits-presente"] .cd-it').nth(5);
  if (mob) await it.tap(); else await it.hover(); await p.waitForTimeout(900);
  await p.screenshot({ path: `${pasta}/x1-kits.png` });
  if (mob) await p.locator('.cd-ficha .bt').tap(); else await it.click(); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${pasta}/x2-ficha.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await p.waitForTimeout(700);
  await p.locator('.rd [data-filtro="bebe-e-infantil"]').click(); await p.waitForTimeout(1600);
  await p.screenshot({ path: `${pasta}/x3-rodape-filtro.png` });
  console.log('aba depois do rodapé:', await p.evaluate(() => document.querySelector('[data-cardapio]').dataset.aba), '| erros:', erros.length ? erros.slice(0, 5) : 'nenhum');
  await b.close();
})();
