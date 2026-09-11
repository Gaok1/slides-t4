# Criptografia pós-quântica & Blockchain

Abra **apresentacao.html** em um navegador. É a versão portátil e funciona offline, sem instalação. Contém 34 slides em português, imagens incorporadas, notas e demonstrações locais. Somente os links de referência precisam de internet.

## Controles

- Setas ou Espaço: navegar.
- F: tela cheia, se o navegador permitir.
- G: visão geral. N: notas. ?: ajuda. Esc: fechar. M: pausar animações.
- A preferência de movimento reduzido do sistema é respeitada.
- No celular, deslize para os lados fora dos controles.
- Imprima pelo menu de ajuda para obter uma versão estática do estado atual das demonstrações.

As notas aparecem na própria tela. Mantenha-as fechadas ao projetar para a plateia.

## Edição

Edite `index.html`, `style.css`, `app.js`, `blockchain.css` e `blockchain.js`. Execute `node build.cjs` para atualizar o HTML portátil. Não há dependências de execução, serviços externos, telemetria ou chaves reais nas demonstrações.

Teste: `node tests/check.cjs`, com Playwright disponível via NODE_PATH ou pelo runtime incluído no Codex. A checagem usa navegador headless e valida navegação, interações e layout em desktop e celular.

## Conteúdo e imagens

Base: `roteiro_timeline_unica_pqc_blockchain_edicao_conteudo.pdf`, 7 páginas. Referências primárias complementam afirmações técnicas e temporais. O HTML distingue rascunhos de mudanças ativadas, estimativas de hardware de demonstrações e STARKs de outros sistemas ZK. As notas registram ressalvas e correções do roteiro.

As três imagens em `assets/` são ilustrações conceituais criadas com a ferramenta integrada de geração de imagens. Prompts finais:

- `quantum.png`: computador quântico com refrigerador de diluição dourado sobre um chip de obsidiana e blocos de vidro conectados, composição 16:9 com espaço negativo à esquerda, luz ciano e âmbar, sem texto ou logotipos, ilustração conceitual.
- `lattice.png`: reticulado tridimensional de vidro, ponto âmbar deslocado, fundo azul-noturno, estética científica editorial, retrato 3:4, sem texto ou equações, não é simulação de um algoritmo.
- `blockchain.png`: três blocos de vidro fumê conectados, fissura âmbar no último bloco, composição 16:9 com espaço negativo à esquerda, sem moedas, texto ou marcas, ilustração conceitual da vulnerabilidade das assinaturas.

O arquivo final é uma apresentação **HTML**, não um arquivo `.pptx`.

## Expansão blockchain

O terceiro ato agora inclui fluxo de transações, comparação BTC/ETH/SOL, contratos inteligentes, paralelismo de contas da Solana e riscos quânticos nas três redes.

- **SHA-256:** edite duas entradas UTF-8, compare os hashes e a quantidade real de bits diferentes. Usa Web Crypto nativo, sem enviar dados. Espaços e acentos contam. Limite: 1.000 caracteres por entrada.
- **Blocos encadeados (16):** o modo padrão propaga novas referências e hashes aos sucessores. O modo congelado conserva as referências originais e mostra elos quebrados. Cada bloco permite inspecionar o JSON exato usado no SHA-256 e o hash completo. Recalcular restaura apenas a coerência local, não consenso, assinaturas ou prova de trabalho.
- **Nonce / PoW (17):** escolha manualmente um inteiro de 0 a 4.294.967.295, clique para testar ou incrementar. Hash real, contador de tentativas e média idealizada por dificuldade. Busca automática em ritmo didático ou rápido, limitada a 8.192 tentativas ou 30 segundos por clique. Para ao sair do slide. O tempo inclui pausas e não é benchmark de mineração. Não minera moedas.
- **Proof of stake (18):** quatro etapas clicáveis explicam garantia, proposta, votos e finalidade, com ressalvas sobre penalidades e regras de consenso.
- **Proof of History (19):** registre até quatro eventos em uma sequência real de SHA-256. Cada cálculo usa a saída anterior. Modelo didático de dependência e ordem, não implementação do PoH, relógio real ou validação de transações. PoH não substitui o consenso baseado em stake da Solana.
- **Custódia:** contrato simulado com depósito, confirmação, autorização e proteção contra dupla liberação. Não é código de contrato implantado.
- **Fundo animado:** blocos recebem dados e propagam referências. Ilustração sem conexão com redes reais, pausável no botão ou com M.

Valide a expansão com `node tests/blockchain.cjs`. O teste também verifica hashes contra o SHA-256 do Node, regras do contrato, pausa de animações e ausência de chamadas HTTP externas.

Os laboratórios precisam de Web Crypto (navegador atual, arquivo local ou localhost/HTTPS). Se indisponível, exibem uma mensagem, sem substituir hashes por valores fictícios.
