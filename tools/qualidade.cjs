// Portão de qualidade da Fluensy (v1, 11/nov/2026). Roda contra o site PUBLICADO (RP-21).
// Uso: node tools/qualidade.cjs https://site.vercel.app [--json]
// Sai com código 1 se algum portão bloqueante falhar. Limites no objeto LIMITES abaixo.
// Mede: desempenho no celular (4G lento + CPU 4×), estouro lateral em 5 larguras, erros de console,
// acessibilidade (axe-core), cabeçalhos de segurança e arquivos que nunca podem estar públicos.
const { chromium } = require('playwright');
const { execFileSync } = require('child_process');
// curl respeita o proxy do ambiente (o fetch do Node não)
const curl = (u, ...a) => execFileSync('curl', ['-s', '--max-time', '20', ...a, u], { encoding: 'utf8', maxBuffer: 2e7 });

const LIMITES = {
  lcpMs: 2500, // Core Web Vitals "bom"
  clsMax: 0.1,
  jsKB: 150, // JS transferido (gzip) no 1º acesso
  totalKB: 1200, // peso do 1º acesso no celular (meta de longo prazo: 300 KB sem vídeo)
  larguras: [320, 360, 390, 414, 1280], // 414 e 384–390 são as mais comuns no Brasil (StatCounter, out/2026)
  axeGraves: 0, // violações "critical" ou "serious"
};
const CABECALHOS = ['content-security-policy', 'x-content-type-options', 'referrer-policy', 'strict-transport-security', 'permissions-policy'];
const PROIBIDOS = ['/.env', '/.git/config', '/.env.local', '/package.json'];
const AXE = 'https://cdn.jsdelivr.net/npm/axe-core@4.10.2/axe.min.js';

const url = process.argv[2];
if (!url) { console.error('uso: node tools/qualidade.cjs <url publicada>'); process.exit(2); }
const base = new URL(url).origin;
const res = { url, quando: new Date().toISOString(), portoes: [] };
const portao = (nome, ok, detalhe, bloqueia = true) => res.portoes.push({ nome, ok, bloqueia, detalhe });

(async () => {
  const b = await chromium.launch();

  // 1. Desempenho no celular
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 3 });
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6e6 / 8) * 10, uploadThroughput: 750e3 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const tam = {}, tipo = {};
    cdp.on('Network.responseReceived', (e) => (tipo[e.requestId] = e.type));
    cdp.on('Network.loadingFinished', (e) => (tam[e.requestId] = e.encodedDataLength));
    await p.addInitScript(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => l.getEntries().forEach((e) => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });
    });
    await p.goto(url, { waitUntil: 'load', timeout: 90000 });
    await p.waitForTimeout(5000);
    const lcp = await p.evaluate(() => new Promise((r) => {
      new PerformanceObserver((l) => { const e = l.getEntries(); r(e[e.length - 1].startTime); }).observe({ type: 'largest-contentful-paint', buffered: true });
      setTimeout(() => r(-1), 3000);
    }));
    const cls = await p.evaluate(() => window.__cls);
    let tot = 0, js = 0, video = 0;
    for (const k in tam) { tot += tam[k]; if (tipo[k] === 'Script') js += tam[k]; if (tipo[k] === 'Media') video += tam[k]; }
    const kb = (n) => Math.round(n / 1024);
    res.desempenho = { lcpMs: Math.round(lcp), cls: +cls.toFixed(3), totalKB: kb(tot), jsKB: kb(js), videoKB: kb(video) };
    portao('LCP no celular', lcp > 0 && lcp <= LIMITES.lcpMs, `${Math.round(lcp)} ms (limite ${LIMITES.lcpMs})`);
    portao('CLS', cls <= LIMITES.clsMax, `${cls.toFixed(3)} (limite ${LIMITES.clsMax})`);
    portao('JS no 1º acesso', kb(js) <= LIMITES.jsKB, `${kb(js)} KB (limite ${LIMITES.jsKB})`);
    portao('Peso do 1º acesso', kb(tot) <= LIMITES.totalKB, `${kb(tot)} KB, vídeo ${kb(video)} KB (limite ${LIMITES.totalKB}; meta 300 sem vídeo)`, false);
    await ctx.close();
  }

  // 2. Estouro lateral e erros de console em várias larguras (e com movimento reduzido na menor)
  {
    const estouros = [], erros = new Set();
    for (const w of LIMITES.larguras) {
      for (const rm of w === 320 ? ['no-preference', 'reduce'] : ['no-preference']) {
        const ctx = await b.newContext({ viewport: { width: w, height: w < 900 ? 800 : 900 }, reducedMotion: rm, isMobile: w < 900, hasTouch: w < 900 });
        const p = await ctx.newPage();
        p.on('pageerror', (e) => erros.add(e.message.slice(0, 160)));
        p.on('console', (m) => { if (m.type() === 'error') erros.add(m.text().slice(0, 160)); });
        await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
        // rola a página inteira para disparar revelações e efeitos
        await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += innerHeight * 0.8) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 120)); } scrollTo(0, 0); });
        await p.waitForTimeout(600);
        const o = await p.evaluate(() => {
          const sw = document.documentElement.scrollWidth, iw = innerWidth;
          const culpados = sw > iw ? [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); return r.right > iw + 1 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 3).map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '')) : [];
          return { sw, iw, culpados };
        });
        if (o.sw > o.iw) estouros.push(`${w}px${rm === 'reduce' ? ' (mov. reduzido)' : ''}: ${o.sw}>${o.iw} ${o.culpados.join(', ')}`);
        await ctx.close();
      }
    }
    portao('Sem rolagem lateral (320/360/390/414/1280)', estouros.length === 0, estouros.join(' | ') || 'ok');
    portao('Sem erros de console', erros.size === 0, [...erros].join(' | ') || 'ok');
  }

  // 3. Acessibilidade automática (axe-core cobre cerca de metade; o resto é roteiro manual)
  {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, bypassCSP: true, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
    await p.waitForTimeout(2500);
    try {
      await p.addScriptTag({ url: AXE });
      const v = await p.evaluate(async () => (await window.axe.run(document, { resultTypes: ['violations'] })).violations.map((x) => ({ id: x.id, impacto: x.impact, n: x.nodes.length, alvo: x.nodes[0]?.target?.join(' ') })));
      // Contraste: o axe não enxerga fundos pintados por camada fixa (céu que muda com a rolagem).
      // Para cada nó reprovado, rola até ele, amostra o pixel real ao lado do texto e recalcula.
      const cc = v.find((x) => x.id === 'color-contrast');
      if (cc) {
        const nos = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ['color-contrast'] })).violations[0]?.nodes.map((n) => ({ alvo: n.target[0], fg: n.any[0]?.data?.fgColor, exigido: n.any[0]?.data?.expectedContrastRatio })) || []);
        const lum = (h) => { const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
        const reais = [];
        for (const n of nos) {
          const box = await p.evaluate((sel) => { const e = document.querySelector(sel); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, h: r.height }; }, n.alvo);
          if (!box || !n.fg) { reais.push(n.alvo); continue; }
          if (box.x < 0 || box.x > p.viewportSize().width) continue; // cópia fora da tela (fita/letreiro): a de dentro da tela já é conferida
          await p.waitForTimeout(350);
          const vp = p.viewportSize(); const px = Math.min(vp.width - 1, Math.max(1, Math.round(box.x - 6))), py = Math.min(vp.height - 1, Math.max(1, Math.round(box.y + box.h / 2)));
          const shot = await p.screenshot({ clip: { x: px, y: py, width: 1, height: 1 } });
          const bg = await p.evaluate(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = c.height = 1; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, 1, 1).data; return '#' + [d[0], d[1], d[2]].map((x) => x.toString(16).padStart(2, '0')).join(''); }, shot.toString('base64'));
          const a = lum(n.fg), bb = lum(bg); const ratio = (Math.max(a, bb) + 0.05) / (Math.min(a, bb) + 0.05);
          if (ratio < parseFloat(n.exigido || '4.5')) reais.push(`${n.alvo} ${ratio.toFixed(2)}:1`);
        }
        cc.n = reais.length; cc.alvo = reais.slice(0, 3).join(', ');
        if (!reais.length) cc.impacto = 'falso-positivo';
      }
      const graves = v.filter((x) => (x.impacto === 'critical' || x.impacto === 'serious') && x.n > 0);
      res.acessibilidade = v;
      portao('Acessibilidade (axe: crítico/sério)', graves.length <= LIMITES.axeGraves, graves.map((x) => `${x.id}×${x.n} (${x.alvo})`).join(' | ') || `ok (${v.length} avisos menores)`);
    } catch (e) {
      portao('Acessibilidade (axe)', false, 'não rodou: ' + e.message, false);
    }
    await ctx.close();
  }

  // 4. Segurança (Nível A): cabeçalhos e arquivos que nunca podem estar públicos
  {
    const cab = curl(url, '-sIL').toLowerCase();
    const falta = CABECALHOS.filter((h) => !cab.includes(h + ':'));
    portao('Cabeçalhos de segurança', falta.length === 0, falta.length ? 'faltam: ' + falta.join(', ') : 'ok');
    const expostos = PROIBIDOS.filter((f) => curl(base + f, '-o', '/dev/null', '-w', '%{http_code}') === '200');
    portao('Nada sensível publicado (.env, .git, package.json)', expostos.length === 0, expostos.join(', ') || 'ok');
    const html = curl(url, '-L');
    const segredo = html.match(/(sk-[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{10,}|AIza[0-9A-Za-z_-]{30,}|service_role|-----BEGIN [A-Z ]*PRIVATE KEY)/);
    portao('Sem chave secreta no HTML', !segredo, segredo ? 'padrão encontrado: ' + segredo[0].slice(0, 8) + '…' : 'ok');
  }

  await b.close();
  const falhas = res.portoes.filter((x) => !x.ok && x.bloqueia);
  if (process.argv.includes('--json')) console.log(JSON.stringify(res, null, 2));
  else {
    console.log(`\nPortão de qualidade — ${url}`);
    for (const g of res.portoes) console.log(`${g.ok ? '✅' : g.bloqueia ? '❌' : '⚠️ '} ${g.nome}: ${g.detalhe}`);
    console.log(falhas.length ? `\nREPROVADO: ${falhas.length} portão(ões) bloqueante(s).` : '\nAPROVADO.');
  }
  process.exit(falhas.length ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
