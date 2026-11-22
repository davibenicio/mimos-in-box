// Vidro líquido — portado do Laboratório de Efeitos (lab 01, 24 e 26).
// VG: filtro SVG de refração (técnica kube.io: perfil de superfície + Snell + mapa de deslocamento + brilho de borda),
//     aplicado como backdrop-filter. Só o Chrome/Edge/Android aplica url() no backdrop; os outros ficam com o vidro fosco do CSS.
// LC: lente em canvas (desenho de lente do Glisse, github.com/0kzh/glisse, MIT): refração calculada em JS sobre uma cópia
//     do fundo; igual em todo navegador. Só para fundos parados (foto).
const SVGNS = 'http://www.w3.org/2000/svg';

export const CROMO = !!(
  navigator.userAgentData &&
  navigator.userAgentData.brands &&
  navigator.userAgentData.brands.some((b) => /Chromium|Google Chrome|Edge/.test(b.brand))
);

export const VG = (() => {
  let n = 0;
  let defs = null;
  const pegaDefs = () => {
    if (defs) return defs;
    defs = document.createElementNS(SVGNS, 'svg');
    defs.setAttribute('width', '0');
    defs.setAttribute('height', '0');
    defs.setAttribute('aria-hidden', 'true');
    defs.style.position = 'absolute';
    document.body.appendChild(defs);
    return defs;
  };
  const perfis = {
    squircle: (x) => Math.pow(1 - Math.pow(1 - x, 4), 0.25),
    circulo: (x) => Math.sqrt(1 - (1 - x) * (1 - x)),
  };
  const raio = (f, esp, bez, ior) => {
    const N = 128;
    const o = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = Math.min(0.995, Math.max(0.005, i / (N - 1)));
      const d = 0.002;
      const inc = (((f(Math.min(1, x + d)) - f(Math.max(0, x - d))) / (2 * d)) * esp) / bez;
      const t1 = Math.atan(Math.abs(inc));
      const t2 = Math.asin(Math.sin(t1) / ior);
      o[i] = Math.sign(inc) * f(x) * esp * Math.tan(t1 - t2);
    }
    return o;
  };
  function mapas(w, h, r, bez, op) {
    const f = perfis[op.perfil || 'squircle'];
    const M = raio(f, op.esp || 40, bez, op.ior || 1.5);
    let mx = 0;
    for (const v of M) mx = Math.max(mx, Math.abs(v));
    mx = mx || 1;
    const cd = document.createElement('canvas');
    const cs = document.createElement('canvas');
    cd.width = cs.width = w;
    cd.height = cs.height = h;
    const D = cd.getContext('2d').createImageData(w, h);
    const S = cs.getContext('2d').createImageData(w, h);
    const hw = w / 2;
    const hh = h / 2;
    const a = ((op.luz ?? -60) * Math.PI) / 180;
    const Lx = Math.cos(a);
    const Ly = Math.sin(a);
    const sp = op.brilho ?? 0.9;
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++) {
        const px = i + 0.5 - hw;
        const py = j + 0.5 - hh;
        const qx = Math.abs(px) - (hw - r);
        const qy = Math.abs(py) - (hh - r);
        let dist, nx, ny;
        if (qx > 0 && qy > 0) {
          const l = Math.hypot(qx, qy);
          dist = l - r;
          nx = qx / l;
          ny = qy / l;
        } else if (qx > qy) {
          dist = qx - r;
          nx = 1;
          ny = 0;
        } else {
          dist = qy - r;
          nx = 0;
          ny = 1;
        }
        nx *= px < 0 ? -1 : 1;
        ny *= py < 0 ? -1 : 1;
        const d = -dist;
        const k = (j * w + i) * 4;
        let dx = 0,
          dy = 0,
          al = 0;
        if (d > 0 && d < bez) {
          const t = d / bez;
          const m = M[Math.round(t * 127)] / mx;
          dx = -nx * m;
          dy = -ny * m;
          const dot = nx * Lx + ny * Ly;
          al = (Math.pow(Math.max(0, dot), 2.5) + 0.5 * Math.pow(Math.max(0, -dot), 2.5)) * Math.pow(1 - t, 2.4) * sp + (d < 1.6 ? 0.35 * sp : 0);
        }
        D.data[k] = 128 + dx * 127;
        D.data[k + 1] = 128 + dy * 127;
        D.data[k + 2] = 128;
        D.data[k + 3] = 255;
        S.data[k] = S.data[k + 1] = S.data[k + 2] = 255;
        S.data[k + 3] = d > 0 ? Math.min(255, al * 255) : 0;
      }
    cd.getContext('2d').putImageData(D, 0, 0);
    cs.getContext('2d').putImageData(S, 0, 0);
    return { d: cd.toDataURL(), s: cs.toDataURL(), esc: mx * 2 };
  }
  function filtro(w, h, r, bez, op = {}) {
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    const id = 'vg' + ++n;
    const m = mapas(w, h, Math.min(r, w / 2, h / 2), bez, op);
    const f = document.createElementNS(SVGNS, 'filter');
    f.id = id;
    ['x', 'y'].forEach((k) => f.setAttribute(k, '0'));
    f.setAttribute('width', w);
    f.setAttribute('height', h);
    f.setAttribute('filterUnits', 'userSpaceOnUse');
    f.setAttribute('color-interpolation-filters', 'sRGB');
    f.innerHTML = `<feGaussianBlur in="SourceGraphic" stdDeviation="${op.desfoque ?? 0.6}" result="b"/>
      <feImage href="${m.d}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="d"/>
      <feDisplacementMap in="b" in2="d" scale="${m.esc}" xChannelSelector="R" yChannelSelector="G" result="r"/>
      <feColorMatrix in="r" type="saturate" values="${op.sat ?? 1.35}" result="rs"/>
      <feImage href="${m.s}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="s"/>
      <feComposite in="s" in2="rs" operator="over"/>`;
    pegaDefs().appendChild(f);
    return id;
  }
  const limpa = (id) => {
    const e = id && document.getElementById(id);
    e && e.remove();
  };
  // aplica (e refaz no resize) a refração num elemento; devolve uma função para recalcular
  function aplica(el, op = {}) {
    if (!CROMO) return () => {};
    let id = null,
      ult = '';
    const faz = () => {
      const w = el.offsetWidth,
        h = el.offsetHeight;
      if (!w || !h) return;
      const chave = w + 'x' + h;
      if (chave === ult) return;
      ult = chave;
      const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
      const bez = op.bez ?? Math.min(26, Math.min(w, h) / 2 - 1);
      limpa(id);
      id = filtro(w, h, Math.min(r, w / 2, h / 2), bez, op);
      el.style.backdropFilter = el.style.webkitBackdropFilter = `url(#${id}) ${op.extra ?? 'saturate(1.5)'}`;
      el.classList.add('real');
    };
    faz();
    let t = 0;
    new ResizeObserver(() => {
      clearTimeout(t);
      t = setTimeout(faz, 120);
    }).observe(el);
    return () => {
      ult = '';
      faz();
    };
  }
  const solta = (el) => {
    el.style.backdropFilter = el.style.webkitBackdropFilter = '';
    el.classList.remove('real');
  };
  return { filtro, limpa, aplica, solta };
})();

export const LC = (() => {
  const erf = (x) => Math.tanh(1.7724538509 * x);
  const cl = (v, a, b) => Math.min(b, Math.max(a, v));
  const sdf = (x, y, hw, hh, r) => {
    const qx = Math.abs(x) - hw + r,
      qy = Math.abs(y) - hh + r;
    return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
  };
  const arco = (sag, half) => {
    const R = (half * half + sag * sag) / (2 * sag);
    let s = 0;
    for (let i = 0; i <= 100; i++) {
      const x = (i / 100) * half,
        sl = x / Math.sqrt(R * R - x * x);
      s += i === 0 || i === 100 ? sl / 2 : sl;
    }
    const m = s / 100;
    return { R, k: m > 0 ? 0.5 / m : 1 };
  };
  const incl = (x, a) => {
    const v = Math.min(x, 0.999 * a.R);
    return (v / Math.sqrt(a.R * a.R - v * v)) * a.k;
  };
  const DPR = Math.min(devicePixelRatio || 1, 2);
  function mapa(w, h, r, op) {
    const W = Math.max(1, Math.round(w * DPR)),
      H = Math.max(1, Math.round(h * DPR)),
      hw = w / 2,
      hh = h / 2;
    r = Math.min(r, hw, hh);
    const s = Math.min(w, h),
      dep = (op.borda ?? 0.25) * s,
      dom = (op.cupula ?? 0.5) * s,
      forca = (op.forca ?? 0.45) * s;
    const iw = Math.max(0, hw - dep),
      ih = Math.max(0, hh - dep),
      ir = Math.min(r, iw, ih),
      ramp = dep > 0 ? 1 / (dep * Math.SQRT2) : 1e6;
    const sag = Math.max(0.01, Math.min(dom, Math.min(hw, hh) - 1)),
      ax = arco(sag, hw),
      ay = arco(sag, hh);
    const la = ((op.luz ?? 45) * Math.PI) / 180,
      co = Math.cos(la),
      si = Math.sin(la),
      br = op.brilho ?? 1;
    const DX = new Float32Array(W * H),
      DY = new Float32Array(W * H),
      L = new Float32Array(W * H),
      M = new Float32Array(W * H);
    for (let j = 0; j < H; j++)
      for (let i = 0; i < W; i++) {
        const x = (i + 0.5) / DPR - hw,
          y = (j + 0.5) / DPR - hh,
          e = sdf(x, y, hw, hh, r),
          k = j * W + i;
        M[k] = cl(-e * DPR, 0, 1);
        if (e >= 0) continue;
        const dx = Math.sign(x) * incl(Math.abs(x), ax),
          dy = Math.sign(y) * incl(Math.abs(y), ay),
          f = 0.5 * (1 + erf(sdf(x, y, iw, ih, ir) * ramp));
        DX[k] = -dx * f * forca * DPR;
        DY[k] = -dy * f * forca * DPR;
        const fac = Math.abs(cl(x / hw, -1, 1) * co + cl(y / hh, -1, 1) * si),
          glow = 0.38 * Math.pow(cl((fac - 0.5 * Math.SQRT2) / (0.5 * Math.SQRT2), 0, 1), 1.5) * f,
          rim = 0.55 * Math.max(0, 1 + e / 1.4) * Math.pow(fac, 1.2);
        L[k] = Math.min(1, glow + rim) * br;
      }
    return { W, H, DX, DY, L, M };
  }
  function lente(el, op) {
    const cv = document.createElement('canvas');
    cv.className = 'lc';
    cv.setAttribute('aria-hidden', 'true');
    el.prepend(cv);
    const x = cv.getContext('2d');
    let m = null,
      img = null,
      src = null,
      SW = 0,
      SH = 0;
    const api = {
      op,
      monta() {
        const w = el.offsetWidth,
          h = el.offsetHeight;
        if (!w || !h) return;
        const r = parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
        m = mapa(w, h, r, api.op);
        cv.width = m.W;
        cv.height = m.H;
        img = x.createImageData(m.W, m.H);
      },
      fonte(c) {
        src = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
        SW = c.width;
        SH = c.height;
      },
      desenha(ox, oy) {
        if (!m || !src) return;
        const d = img.data,
          { W, H, DX, DY, L, M } = m,
          bx = ox * DPR,
          by = oy * DPR,
          disp = api.op.dispersao ?? 0.04,
          sat = api.op.sat ?? 1.12,
          tint = api.op.tinta ?? 0.035;
        for (let j = 0; j < H; j++)
          for (let i = 0; i < W; i++) {
            const k = j * W + i,
              o = k * 4;
            if (M[k] === 0) {
              d[o + 3] = 0;
              continue;
            }
            const px = bx + i,
              py = by + j,
              ddx = DX[k],
              ddy = DY[k];
            const s = (f) => {
              const sx = cl(Math.round(px + ddx * f), 0, SW - 1),
                sy = cl(Math.round(py + ddy * f), 0, SH - 1);
              return (sy * SW + sx) * 4;
            };
            const a = s(1 + disp),
              b = s(1),
              c = s(1 - disp);
            let R = src[a],
              G = src[b + 1],
              B = src[c + 2];
            const lum = 0.3 * R + 0.59 * G + 0.11 * B;
            R = lum + (R - lum) * sat;
            G = lum + (G - lum) * sat;
            B = lum + (B - lum) * sat;
            const l = Math.min(1, L[k] + tint);
            d[o] = R + (255 - R) * l;
            d[o + 1] = G + (255 - G) * l;
            d[o + 2] = B + (255 - B) * l;
            d[o + 3] = M[k] * 255;
          }
        x.putImageData(img, 0, 0);
      },
    };
    return api;
  }
  // foto (object-fit: cover) desenhada num canvas em px de dispositivo, do tamanho da caixa
  const capa = (imgEl, W, H) => {
    const c = document.createElement('canvas');
    c.width = Math.round(W * DPR);
    c.height = Math.round(H * DPR);
    const x = c.getContext('2d');
    x.scale(DPR, DPR);
    const k = Math.max(W / imgEl.naturalWidth, H / imgEl.naturalHeight),
      w = imgEl.naturalWidth * k,
      h = imgEl.naturalHeight * k;
    x.drawImage(imgEl, (W - w) / 2, (H - h) / 2, w, h);
    return c;
  };
  return { lente, capa, DPR };
})();
