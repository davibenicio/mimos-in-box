// Desenhos gerados por código: escorrido (calda), coração, selo.
const GOTAS: [number, number][] = [[46, 58], [30, 22], [54, 96], [34, 34], [40, 70], [28, 16], [60, 44], [36, 84], [44, 30], [32, 62]];

/** Caminho SVG de uma borda que escorre para baixo. w: largura; base: altura da faixa cheia; k: escala das gotas. */
export function escorre(w: number, base: number, k = 1, desloca = 0): string {
  let d = `M0 0H${w}V${base}`, x = w, i = desloca;
  while (x > 0) {
    const [sw, sh] = GOTAS[i % GOTAS.length]; const s = Math.min(sw * k, x); const h = sh * k;
    d += `c0 ${h} ${-s} ${h} ${-s} 0`; x -= s;
    if (x > 0) { const g = Math.min(20 * k, x); d += `c0 ${-10 * k} ${-g} ${-10 * k} ${-g} 0`; x -= g; }
    i++;
  }
  return d + 'Z';
}
export const CORACAO = 'M12 21C5 15.5 2 12.6 2 8.6A5.2 5.2 0 0 1 12 6.4 5.2 5.2 0 0 1 22 8.6c0 4-3 6.9-10 12.4z';
export const SELO_TXT = 'FEITO COM CARINHO • MIMOS IN BOX • ';
