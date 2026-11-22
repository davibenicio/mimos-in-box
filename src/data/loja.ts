// Tudo o que a loja pode querer mudar fica neste arquivo: dados de contato, regras e o montador.
// Produtos do catálogo: src/data/produtos.json (fonte única, aprovada pela loja em 21/11/2026).

export const LOJA = {
  nome: 'Mimos in Box',
  assinatura: 'Cestas e presentes personalizados',
  cidade: 'Ilhéus',
  uf: 'BA',
  endereco: 'Rua 13 de Maio, 272',
  bairro: 'Pontal',
  referencia: 'em frente à Pousada Ilhéus',
  whatsappNumero: '5573998177133',
  whatsappTexto: '(73) 99817-7133',
  whatsappLink: 'https://wa.me/message/5P7LCVRZCNO2M1',
  instagram: 'mimosinboxilheus',
  instagramLink: 'https://www.instagram.com/mimosinboxilheus/',
  mapa: 'https://www.google.com/maps/search/?api=1&query=Rua+13+de+Maio%2C+272+-+Pontal%2C+Ilh%C3%A9us+-+BA',
  regras: {
    personalizada: 'Cesta personalizada: peça com 24h de antecedência.',
    pronta: 'Cesta pronta: pode pedir em qualquer dia da semana.',
    entrega: 'Entrega pela 99, com taxa conforme o endereço, ou retirada na loja.',
    laco: 'Cor do laço e do balão à sua escolha.',
    balao: 'Balão adicional a partir de R$ 25.',
    grandes: 'Cestas para 2 ou 4 pessoas: valor sob consulta.',
  },
  pagamentos: ['Pix', 'Cartão', 'Na loja (retirada)'],
} as const;

export const CATEGORIAS = [
  { id: 'cafe-da-manha', nome: 'Café da manhã', frase: 'Para acordar alguém com carinho.', destaque: '08' },
  { id: 'kits-presente', nome: 'Kits presente', frase: 'Para agradecer, mimar e surpreender.', destaque: '19' },
  { id: 'bebe-e-infantil', nome: 'Bebê e infantil', frase: 'Para os pequenos e para quem acabou de chegar.', destaque: '29' },
] as const;

/** Produtos que pedem mais antecedência (em dias). O padrão é 1 dia. */
export const ANTECEDENCIA: Record<string, number> = { '08-cesta-cafe-da-manha-infantil': 2 };

/** Topo (mock do Davi): "PRESENTES" gigante atrás e uma cesta de cada vez girando no pedestal.
 *  Os quadros da cesta girando ficam em public/img/giro/<produto>.webp (gerar com tools/giro.py). */
export const SLIDES = [
  { produto: '35' },
  { produto: '03' },
  { produto: '04' },
] as const;

// ---- Monte a sua cesta (preços estimados, a loja confirma; edite à vontade) ----
export const TAMANHOS = [
  { id: 'P', nome: 'Pequena', limite: 6, embalagem: 20 },
  { id: 'M', nome: 'Média', limite: 10, embalagem: 30 },
  { id: 'G', nome: 'Grande', limite: 15, embalagem: 40 },
] as const;

export const LACOS = [
  { id: 'rosa', nome: 'Rosa', cor: '#F47AA3', sombra: '#C42A63' },
  { id: 'vermelho', nome: 'Vermelho', cor: '#D7263D', sombra: '#8E1326' },
  { id: 'azul', nome: 'Azul', cor: '#5AA9E6', sombra: '#2B6CA8' },
  { id: 'lilas', nome: 'Lilás', cor: '#B79CED', sombra: '#7B5CC4' },
  { id: 'amarelo', nome: 'Amarelo', cor: '#F6C945', sombra: '#B88A0B' },
  { id: 'dourado', nome: 'Dourado', cor: '#D8B25A', sombra: '#8F6A17' },
] as const;

/** alt = altura do item em relação à largura da cesta (0.30 = 30%). Fotos em public/img/m/<id>.webp (ilustrativas, sem marca). */
export const ITENS: { grupo: string; itens: { id: string; nome: string; preco: number; alt: number; aPartir?: boolean }[] }[] = [
  { grupo: 'Bebidas e café', itens: [
    { id: 'cafe-especial', nome: 'Café especial', preco: 25, alt: 0.3 },
    { id: 'cafe-graos', nome: 'Café em grãos', preco: 22, alt: 0.3 },
    { id: 'suco', nome: 'Suco', preco: 8, alt: 0.3 },
    { id: 'achocolatado', nome: 'Achocolatado', preco: 5, alt: 0.26 },
    { id: 'iogurte', nome: 'Iogurte', preco: 6, alt: 0.27 },
    { id: 'refrigerante', nome: 'Refrigerante', preco: 6, alt: 0.22 },
  ] },
  { grupo: 'Para comer', itens: [
    { id: 'biscoitos', nome: 'Biscoitos', preco: 16, alt: 0.3 },
    { id: 'bolo', nome: 'Fatia de bolo', preco: 14, alt: 0.17 },
    { id: 'croissant', nome: 'Croissant', preco: 8, alt: 0.14 },
    { id: 'frutas', nome: 'Frutas', preco: 15, alt: 0.17 },
    { id: 'salgadinhos', nome: 'Salgadinhos', preco: 18, alt: 0.3 },
  ] },
  { grupo: 'Doces', itens: [
    { id: 'nutella', nome: 'Nutella', preco: 28, alt: 0.24 },
    { id: 'fini', nome: 'Fini', preco: 9, alt: 0.26 },
    { id: 'bombons', nome: 'Bombons', preco: 22, alt: 0.22 },
    { id: 'ferrero', nome: 'Ferrero Rocher', preco: 22, alt: 0.18 },
    { id: 'chocolate', nome: 'Chocolate', preco: 12, alt: 0.17 },
  ] },
  { grupo: 'Presentes', itens: [
    { id: 'caneca', nome: 'Caneca personalizada', preco: 35, alt: 0.2 },
    { id: 'agenda', nome: 'Agenda', preco: 39, alt: 0.19 },
    { id: 'sabonetes', nome: 'Kit de sabonetes', preco: 30, alt: 0.22 },
    { id: 'vela', nome: 'Vela aromática', preco: 28, alt: 0.2 },
    { id: 'pelucia', nome: 'Pelúcia', preco: 39, alt: 0.3 },
    { id: 'mantinha', nome: 'Mantinha de bebê', preco: 29, alt: 0.17 },
  ] },
  { grupo: 'Toques finais', itens: [
    { id: 'buque', nome: 'Buquê de flores', preco: 45, alt: 0.38 },
    { id: 'cartao', nome: 'Cartão', preco: 6, alt: 0.22 },
    { id: 'balao', nome: 'Balão', preco: 25, alt: 0.62, aPartir: true },
  ] },
];
