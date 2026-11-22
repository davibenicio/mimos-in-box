// Testa o fluxo: montar a cesta, embrulhar, abrir ficha, fechar pedido. Uso: node tools/fluxo.cjs <url> <largura> <altura> <pasta>
const { chromium } = require('playwright');
const [url, w = '1440', h = '900', pasta = '/tmp/fluxo'] = process.argv.slice(2);
(async () => {
  require('fs').mkdirSync(pasta, { recursive: true });
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, isMobile: +w < 700, hasTouch: +w < 700 });
  const erros = []; p.on('console', (m) => { if (m.type() === 'error') erros.push(m.text()); }); p.on('pageerror', (e) => erros.push(String(e)));
  await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(4800);
  await p.evaluate(() => document.querySelector('#monte').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(800);
  await p.evaluate(() => document.querySelectorAll('.mt-grp').forEach((d) => (d.open = true)));
  const ids = ['suco', 'biscoitos', 'nutella', 'caneca', 'pelucia', 'buque', 'ferrero', 'balao', 'fini', 'cartao'];
  for (const id of ids) { await p.click(`[data-item="${id}"] [data-mais]`); await p.waitForTimeout(260); }
  await p.waitForTimeout(900);
  await p.evaluate(() => { const e = document.querySelector('.mt-palco'); e.scrollIntoView({ block: 'center', behavior: 'instant' }); }); await p.waitForTimeout(500);
  await p.screenshot({ path: `${pasta}/1-cheia.png` });
  await p.click('input[name="laco"][value="vermelho"]', { force: true }); await p.click('[data-embrulha]'); await p.waitForTimeout(4350);
  await p.screenshot({ path: `${pasta}/2-embrulhando.png` });
  await p.waitForTimeout(1600);
  await p.screenshot({ path: `${pasta}/3-pedido.png` });
  await p.fill('#pd-nome', 'Cliente Teste'); await p.fill('#pd-cel', '73 99999-0000'); await p.fill('#pd-para', 'Minha mãe'); await p.fill('#pd-msg', 'Feliz aniversário!');
  await p.click('#pedido button[type=submit]'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${pasta}/4-ok.png` });
  console.log('zap:', decodeURIComponent(await p.getAttribute('[data-zap]', 'href')).slice(0, 600));
  await p.click('#pedido .pd-volta'); await p.waitForTimeout(500);
  await p.evaluate(() => document.querySelector('#cestas').scrollIntoView({ behavior: 'instant' })); await p.waitForTimeout(1500);
  const it = p.locator('.cd-lista li[data-cat="cafe-da-manha"] .cd-it').nth(1);
  if (+w < 700) { await it.tap(); await p.waitForTimeout(500); await p.locator('.cd-ficha .bt').tap(); } else await it.click();
  await p.waitForTimeout(1300);
  await p.screenshot({ path: `${pasta}/5-ficha.png` });
  await p.click('#ficha [data-comprar]'); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${pasta}/6-pedido-pronta.png` });
  console.log('erros:', erros.length ? erros.slice(0, 5) : 'nenhum');
  await b.close();
})();
