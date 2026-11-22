# Mimos in Box · ESTADO

Atualizado em 21/11/2026, 22h (v2 publicada como prévia: mais sóbria, sem branco, fundos refeitos, cestas sem fundo).

## Objetivo
Site de vendas da Mimos in Box (cestas e presentes personalizados, Pontal, Ilhéus-BA). O cliente vê o catálogo, monta uma cesta e fecha o pedido no site. WhatsApp fica para dúvidas e para a loja receber o pedido pronto.
Cliente fechado. Ação nº 1: pedir uma cesta (pronta ou montada).

## Decisões
- Direção de arte **C, Cereja** (escolha do Davi em 21/11). O prompt original proibia vinho; o Davi liberou.
- **v2 (pedido do Davi, 21/11 à noite): mais profissional e séria.** Paleta: bordô `#6a1029`, rosé nude `#f5e4e1`, off-white `#fbf6f0` no lugar do branco (não há branco puro em superfície), ouro fosco do logo só em fio. Tudo em `src/styles/tokens.css`.
- Fundos sem estampa de festa. Três materiais: **papel** (lavagem de cor + grão), **veludo** (bordô com luz e renda tom sobre tom) e **anéis** finos atrás do produto. Saíram corações em estampa, bolinhas grandes, vichy, xadrez e raios.
- **Cestas sempre sem fundo** (pedido do Davi): topo, A loja, catálogo, ficha e pedido usam só o recorte, num nicho em arco. As fotos cruas do catálogo saíram do site (havia print de celular e arte com texto).
- Catálogo único: a lista com prévia ("Nossas cestas"). Saíram a grade de cartões, o varal de fotos, as etiquetas balançando e as fotos tortas.
- Fontes: Oleo Script (títulos), Fraunces (preços, rótulos, nomes da lista), Nunito (texto). Self-hosted.
- Site sempre claro, sem tema escuro (pedido do projeto; exceção ao padrão da casa).
- Catálogo: `src/data/produtos.json`, 38 produtos aprovados pela loja em 21/11. É a fonte única. A lista de 13 do prompt foi descartada.
- Horário de funcionamento não aparece (o Davi dispensou). Regras: cesta personalizada com 24h de antecedência; cesta pronta em qualquer dia. Só a Cesta Infantil pede 48h (está na descrição aprovada).
- Montador com **cesta e itens realistas** (pedido do Davi): fotos geradas no Magnific, sem marca no rótulo. Itens com marca (Nutella, Fini, Ferrero) esperam foto real da loja.
- Pagamento online ainda não existe. O pedido é montado no site e segue pronto para a loja pelo WhatsApp; a loja confirma e combina o pagamento.

## Estrutura (ordem da página)
Abertura (fita de presente) · Topo com carrossel de 3 cestas · Fitas cruzadas · A loja · Nossas cestas (lista com prévia no nicho; catálogo único) · Montador · Do clique ao laço · Fitas · Contato · Rodapé. Ficha do produto e pedido em diálogo.

Padrões da casa que saíram, com motivo:
- Tema escuro: pedido do projeto.
- Voo sobre o site (2ª abertura): loja de venda direta, a ação vem antes.
- Abertura de até 1,4 s: o Davi pediu mais longa. Hoje dura cerca de 2,9 s na primeira visita e 2,1 s na volta. O topo é pintado por baixo da cortina, então o LCP não espera a abertura.
- Números e gráficos: não há número estável e verificável da loja.
- LiveDiagram: o montador cumpre o papel (explica o negócio mexendo nele).

## Roteiro de movimento (cada um com função)
- Abertura: as fitas cruzam, o selo pousa, as fitas desatam e o papel abre em círculo (conta o negócio: embrulho). Some com movimento reduzido.
- Topo: palavras e cesta entram a cada troca; bolinha de progresso é o relógio; pausa visível, no hover e no foco.
- Fitas cruzadas: vida contínua e lenta; pausam no hover.
- A loja: o arco sobe como cortina e a cesta chega depois; o texto acende com a rolagem.
- Nossas cestas: a cesta aparece no nicho ao passar o mouse, focar ou tocar (prévia antes do clique); a gota marca a aba.
- Ficha: o arco sobe e a cesta chega.
- Montador: item cai na cesta, os outros se ajeitam, total pula; no fim a cesta é remontada, o celofane sobe e o laço pousa.
- Do clique ao laço: a fita se desenha com a rolagem e acende cada passo.
- Pedido: chuva de corações na confirmação.
- Botão "Pausar animações" no rodapé. Movimento reduzido: tudo parado, conteúdo inteiro visível.

## Medido no publicado (21/11, https://mimos-in-box.vercel.app)
Portão de qualidade aprovado: LCP no celular 2,46 s (4G lento, CPU 4×), CLS 0, JS 8 KB, 607 KB no 1º acesso, sem rolagem lateral de 320 a 1280, sem erro de console, axe sem falha grave.
Conferido em tela: 1440 e 390, todas as seções; fluxo montar → embrulhar → pedido → confirmação no celular e no PC.
Ainda não conferido: percurso só com teclado, percurso com movimento reduzido, GIF de rolagem.

## Onde mexer
- Dados da loja, regras, tamanhos, cores de laço e itens do montador: `src/data/loja.ts`.
- Produtos: `src/data/produtos.json`. Imagens: `public/img/c` (recortes sem fundo, 560 e 800 px). Gerar de novo: `python3 tools/imagens.py <recortes> <logo>`.
- Cores, fontes e fundos: `src/styles/tokens.css`.
- Itens do montador: `public/img/m/<id>.webp`. Arrumação na cesta: `src/data/cesta.ts`.
- Prévia com `noindex`: constante `PREVIA` em `src/layouts/Base.astro` e `public/robots.txt`.

## Pendências
- [PENDÊNCIA] Fotos reais dos itens com marca para o montador.
- [PENDÊNCIA] Preços do montador são estimados (vieram do prompt); a loja precisa confirmar.
- [PENDÊNCIA] Painel da loja e pedidos gravados (Supabase), pagamento por Pix ou cartão.
- [PENDÊNCIA] Domínio próprio, Checklist de lançamento e tirar o `noindex`.
- Teste de vídeo das cestas (câmera girando), pedido pelo Davi: ainda não feito.

## Magnific (créditos gastos)
Recorte de fundo das 38 cestas: 120. Cesta de vime e 27 itens realistas: 300 de geração + 12 de recorte. Total: cerca de 440.
