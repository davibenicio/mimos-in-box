// Mede a largura (em "em") das linhas gigantes do topo na Unbounded. Uso: node tools/mede-letras.cjs  (edite a lista no fim)
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  const f = 'data:font/woff2;base64,' + require('fs').readFileSync(path.resolve('node_modules/@fontsource/anton/files/anton-latin-400-normal.woff2')).toString('base64');
  await p.setContent(`<style>@font-face{font-family:U;src:url('${f}') format('woff2');font-weight:400}</style><body></body>`);
  const r = await p.evaluate(async (linhas) => {
    await document.fonts.load("400 100px U");
    return linhas.map(([t, w, ls]) => { const s = document.createElement('span'); s.style.cssText = `font:${w} 100px U;white-space:nowrap;letter-spacing:${ls}em;position:absolute`; s.textContent = t; document.body.append(s); const x = s.getBoundingClientRect().width / 100; s.remove(); return [t, w, +x.toFixed(3)]; });
  }, [['PRESENTES', 400, 0], ['MONTE', 400, 0], ['A SUA', 400, 0], ['CESTAS', 400, 0], ['CARINHO', 400, 0], ['MIMOS', 400, 0], ['PROMOÇÃO', 400, 0], ['EM CADA DETALHE', 400,0]]);
  console.log(JSON.stringify(r)); await b.close();
})();
