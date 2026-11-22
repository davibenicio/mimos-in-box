import bruto from './produtos.json';
import medidas from './medidas.json';
import { ANTECEDENCIA } from './loja';

export interface Produto {
  id: string; nn: string; nome: string; categoria: string; preco: number; de: number | null;
  descricao: string; fotos: string[]; corte: string; cw: number; ch: number; dias: number;
}
const M = medidas as Record<string, number[]>;
export const PRODUTOS: Produto[] = bruto.produtos.map((p) => {
  const nn = p.id.slice(0, 2);
  return {
    id: p.id, nn, nome: p.nome, categoria: p.categoria, preco: p.preco, de: p.preco_original,
    descricao: p.descricao, fotos: p.fotos.map((_, i) => `/img/p/${nn}-${i + 1}`),
    corte: `/img/c/${nn}.webp`, cw: M[nn][0], ch: M[nn][1], dias: ANTECEDENCIA[p.id] ?? 1,
  };
});
export const porNN = (nn: string) => PRODUTOS.find((p) => p.nn === nn)!;
export const reais = (v: number) => 'R$ ' + v.toFixed(2).replace('.', ',');
