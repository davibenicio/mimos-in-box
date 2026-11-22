# Mimos in Box · ESTADO

Atualizado em 21/11/2026 (v1 publicada como prévia).

## Objetivo
Site de vendas da Mimos in Box (cestas e presentes personalizados, Pontal, Ilhéus-BA). O cliente vê o catálogo, monta uma cesta e fecha o pedido no site. WhatsApp fica para dúvidas e para a loja receber o pedido pronto.
Cliente fechado. Ação nº 1: pedir uma cesta (pronta ou montada).

## Decisões
- Direção de arte **C, Cereja** (escolha do Davi em 21/11): fundo rosa claro, vinho-cereja em títulos e blocos, rosa do logo nos destaques. O prompt original proibia vinho; o Davi liberou.
- Fontes: Oleo Script (títulos), Caprasimo (preços, rótulos), Nunito (texto). Self-hosted.
- Site sempre claro, sem tema escuro (pedido do projeto; exceção ao padrão da casa).
- Catálogo: `src/data/produtos.json`, 38 produtos aprovados pela loja em 21/11. É a fonte única. A lista de 13 do prompt foi descartada.
- Horário de funcionamento não aparece (o Davi dispensou). Regras: cesta personalizada com 24h de antecedência; cesta pronta em qualquer dia. Só a Cesta Infantil pede 48h (está na descrição aprovada).
- Montador com **cesta e itens realistas** (pedido do Davi): fotos geradas no Magnific, sem marca no rótulo. Itens com marca (Nutella, Fini, Ferrero) esperam foto real da loja.
- Pagamento online ainda não existe. O pedido é montado no site e segue pronto para a loja pelo WhatsApp; a loja confirma e combina o pagamento.

## Estrutura (ordem da página)
Abertura (fita de presente) · Topo com carrossel de 3 cestas · Fitas cruzadas · A loja · Varal de fotos · Cardápio com prévia · Chamada "Monte a sua" · Etiquetas de categoria · Vitrine com filtros · Montador · Do clique ao laço · Contato · Rodapé. Ficha do produto e pedido em diálogo.

Padrões da casa que saíram, com motivo:
- Tema escuro: pedido do projeto.
- Voo sobre o site (2ª abertura): loja de venda direta, a ação vem antes; a abertura já ocupa 1,4 s.
- Números e gráficos: não há número estável e verificável da loja.
- LiveDiagram: o montador cumpre o papel (explica o negócio mexendo nele).

## Roteiro de movimento (cada um com função)
- Abertura: a fita cruza, o selo pousa, o papel abre em círculo (conta o negócio: embrulho). Até 1,4 s; some com movimento reduzido.
- Topo: palavras e cesta entram a cada troca; bolinha de progresso é o relógio; pausa visível, no hover e no foco.
- Fitas cruzadas e varal: vida contínua; pausam no hover, foco e toque.
- Cardápio: a cesta aparece ao passar o mouse, focar ou tocar (prévia antes do clique).
- Etiquetas: balançam como etiqueta de presente.
- Vitrine: gota do filtro, cartões chegam em sequência, cartão inclina com o mouse.
- Montador: item cai na cesta, os outros se ajeitam, total pula; no fim a cesta é remontada, o celofane sobe e o laço pousa.
- Do clique ao laço: a fita se desenha com a rolagem e acende cada passo.
- Pedido: chuva de corações na confirmação.
- Botão "Pausar animações" no rodapé. Movimento reduzido: tudo parado, conteúdo inteiro visível.

## Onde mexer
- Dados da loja, regras, tamanhos, cores de laço e itens do montador: `src/data/loja.ts`.
- Produtos: `src/data/produtos.json`. Fotos: `public/img/p` (fotos) e `public/img/c` (recortes). Gerar de novo: `python3 tools/imagens.py <fotos> <recortes> <logo>`.
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
