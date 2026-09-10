# Criptografia pós-quântica & Blockchain

Abra **apresentacao.html** em um navegador. É a versão portátil e funciona offline, sem instalação. Contém 24 slides em português, imagens incorporadas, notas e demonstrações locais. Somente os links de referência precisam de internet.

## Controles

- Setas ou Espaço: navegar.
- F: tela cheia, se o navegador permitir.
- G: visão geral. N: notas. ?: ajuda. Esc: fechar.
- No celular, deslize para os lados fora dos controles.
- Imprima pelo menu de ajuda para obter uma versão estática do estado atual das demonstrações.

As notas aparecem na própria tela. Mantenha-as fechadas ao projetar para a plateia.

## Edição

Edite `index.html`, `style.css` e `app.js`. Execute `node build.cjs` para atualizar o HTML portátil. Não há dependências de execução, serviços externos, telemetria ou chaves reais nas demonstrações.

Teste: `node tests/check.cjs`, com Playwright disponível via NODE_PATH ou pelo runtime incluído no Codex. A checagem usa navegador headless e valida navegação, interações e layout em desktop e celular.

## Conteúdo e imagens

Base: `roteiro_timeline_unica_pqc_blockchain_edicao_conteudo.pdf`, 7 páginas. Referências primárias complementam afirmações técnicas e temporais. O HTML distingue rascunhos de mudanças ativadas, estimativas de hardware de demonstrações e STARKs de outros sistemas ZK. As notas registram ressalvas e correções do roteiro.

As três imagens em `assets/` são ilustrações conceituais criadas com a ferramenta integrada de geração de imagens. Prompts finais:

- `quantum.png`: computador quântico com refrigerador de diluição dourado sobre um chip de obsidiana e blocos de vidro conectados, composição 16:9 com espaço negativo à esquerda, luz ciano e âmbar, sem texto ou logotipos, ilustração conceitual.
- `lattice.png`: reticulado tridimensional de vidro, ponto âmbar deslocado, fundo azul-noturno, estética científica editorial, retrato 3:4, sem texto ou equações, não é simulação de um algoritmo.
- `blockchain.png`: três blocos de vidro fumê conectados, fissura âmbar no último bloco, composição 16:9 com espaço negativo à esquerda, sem moedas, texto ou marcas, ilustração conceitual da vulnerabilidade das assinaturas.

O arquivo final é uma apresentação **HTML**, não um arquivo `.pptx`.
