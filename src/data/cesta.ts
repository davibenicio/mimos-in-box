// Como os itens se arrumam dentro da cesta realista. Usado no servidor (composição parada) e no navegador (montador).
// Regra: os mais altos vão para o fundo e para o meio; os baixos ficam na frente, para nada ficar escondido.
export const AUMENTO = 1.3; // tamanho geral dos itens em relação à largura da foto da cesta
const GIROS = [-5, 6, -3, 7, -6, 4, -7, 3, 6, -4, 5, -6, 2, -5, 7];
const FILEIRAS = [
  { base: 63, de: 12, ate: 88, esc: 0.92, z: 1 }, // fundo
  { base: 54, de: 16, ate: 84, esc: 1, z: 2 },    // meio
  { base: 45, de: 20, ate: 80, esc: 1.04, z: 3 }, // frente
];
export interface Vaga { x: number; base: number; h: number; z: number; r: number }

/** alts: altura relativa de cada item, na ordem em que entraram. Devolve a vaga de cada um, na mesma ordem. */
export function arruma(alts: number[]): Vaga[] {
  const n = alts.length, nf = n <= 4 ? 1 : n <= 9 ? 2 : 3;
  const ordem = alts.map((a, i) => [a, i]).sort((p, q) => q[0] - p[0] || p[1] - q[1]).map((p) => p[1]);
  const filas = nf === 1 ? [FILEIRAS[1]] : nf === 2 ? [FILEIRAS[0], FILEIRAS[2]] : FILEIRAS;
  const saida: Vaga[] = []; let k = 0;
  filas.forEach((F, f) => {
    const m = Math.floor(n / nf) + (f < n % nf ? 1 : 0), grupo = ordem.slice(k, k + m); k += m;
    const centroFora = [...Array(m).keys()].sort((a, b) => Math.abs(a - (m - 1) / 2) - Math.abs(b - (m - 1) / 2));
    grupo.forEach((orig, j) => {
      const x = F.de + ((F.ate - F.de) * (centroFora[j] + 0.5)) / m;
      saida[orig] = { x, base: F.base, h: alts[orig] * F.esc * AUMENTO * 100, z: F.z, r: GIROS[orig % GIROS.length] };
    });
  });
  return saida;
}
export const estilo = (v: Vaga) => `left:${v.x.toFixed(1)}%;bottom:${v.base}%;height:${v.h.toFixed(1)}cqw;z-index:${v.z};--r:${v.r}deg`;
