# Criptografia pós-quântica & Blockchain

Abra **index.html** em um navegador. Esta é a versão atual da apresentação, com 45 slides, tema branco minimalista, notas e demonstrações locais. Somente os links de referência precisam de internet.

O arquivo `ROTEIRO_80_MIN.md` divide a apresentação entre três pessoas e reserva 2 minutos de margem dentro da duração total de 1h20.

## Controles

- Setas ou Espaço: navegar.
- F: tela cheia, se o navegador permitir.
- G: visão geral. N: notas. ?: ajuda. Esc: fechar. M: pausar animações.
- A preferência de movimento reduzido do sistema é respeitada.
- No celular, deslize para os lados fora dos controles.
- Imprima pelo menu de ajuda para obter uma versão estática do estado atual das demonstrações.

As notas aparecem na própria tela. Mantenha-as fechadas ao projetar para a plateia.

## Edição

Edite `index.html`, `style.css`, `theme-light.css`, `app.js`, `blockchain.css` e `blockchain.js`. O arquivo `index.html` é a fonte principal e deve ser aberto diretamente. Não há dependências de execução, serviços externos, telemetria ou chaves reais nas demonstrações.

Teste: `node tests/check.cjs`, com Playwright disponível via NODE_PATH ou pelo runtime incluído no Codex. A checagem usa navegador headless e valida navegação, interações e layout em desktop e celular.

## Conteúdo e imagens

Base: `roteiro_timeline_unica_pqc_blockchain_edicao_conteudo.pdf`, 7 páginas. Referências primárias complementam afirmações técnicas e temporais. O HTML distingue rascunhos de mudanças ativadas, estimativas de hardware de demonstrações e STARKs de outros sistemas ZK. As notas registram ressalvas e correções do roteiro.

As três imagens em `assets/` são ilustrações conceituais criadas com a ferramenta integrada de geração de imagens. Prompts finais:

- `quantum.png`: computador quântico com refrigerador de diluição dourado sobre um chip de obsidiana e blocos de vidro conectados, composição 16:9 com espaço negativo à esquerda, luz ciano e âmbar, sem texto ou logotipos, ilustração conceitual.
- `lattice.png`: reticulado tridimensional de vidro, ponto âmbar deslocado, fundo azul-noturno, estética científica editorial, retrato 3:4, sem texto ou equações, não é simulação de um algoritmo.
- `blockchain.png`: três blocos de vidro fumê conectados, fissura âmbar no último bloco, composição 16:9 com espaço negativo à esquerda, sem moedas, texto ou marcas, ilustração conceitual da vulnerabilidade das assinaturas.

O arquivo final é uma apresentação **HTML**, não um arquivo `.pptx`.

## Expansão blockchain

O terceiro ato parte do problema do gasto duplo, mostra de onde veio cada peça entre 1991 e 2022, monta a cadeia em três laboratórios — hash, elo e prova de trabalho — e só então apresenta as variações: proof of stake, as três redes e contratos. Os slides estáticos ficam sem clique de propósito; a interação existe onde o resultado não caberia em um texto.

- **SHA-256 (25):** edite duas entradas UTF-8, compare os hashes e a quantidade real de bits diferentes. Usa Web Crypto nativo, sem enviar dados. Espaços e acentos contam. Limite: 1.000 caracteres por entrada.
- **Blocos encadeados (26):** o modo padrão propaga novas referências e hashes aos sucessores. O modo congelado conserva as referências originais e mostra elos quebrados. Cada bloco permite inspecionar o JSON exato usado no SHA-256 e o hash completo. Recalcular restaura apenas a coerência local, não consenso, assinaturas ou prova de trabalho.
- **Nonce / PoW (27):** escolha qualquer inteiro não negativo, digite livremente de 0 a 64 zeros hexadecimais e teste, ou rode a busca cronometrada. Hash real, contador de tentativas, tempo decorrido e taxa de hashes por segundo medida neste navegador, ao lado da média idealizada por dificuldade. A busca continua até encontrar um nonce, clicar em Parar ou sair do slide. O tempo inclui o custo da Web Crypto e não é benchmark de mineração. Não minera moedas. O campo real do cabeçalho Bitcoin continua sendo um inteiro de 32 bits.
- **Esqueleto do Bitcoin (28):** três blocos mostram os seis campos do cabeçalho de 80 bytes, o hash calculado, a contagem e o corpo de transações. Os hashes abreviados são ilustrativos e deixam visível o elo entre blocos.
- **Sorteio por stake (30):** distribua o stake entre quatro validadores e sorteie uma rodada ou duzentas. A proporção de turnos se aproxima da proporção de stake no agregado, sem garantia em nenhuma rodada isolada. Modelo didático: não reproduz sorteio verificável, comitês, slots, épocas nem slashing.
- **Proof of History (31):** uma sequência automática de SHA-256 marca ticks. Edite uma transação e registre-a no próximo tick para ver o hash anterior, a entrada e o novo hash. A tabela compara ordens de grandeza de Bitcoin, Ethereum L1 e Solana. PoH ordena os eventos; a Solana combina esse relógio com consenso por Proof of Stake.
- **Custódia (33):** exemplo estático com depósito, confirmação, autorização e proteção contra dupla liberação. Não é código de contrato implantado.
- **Fundo animado:** blocos recebem dados e propagam referências. Ilustração sem conexão com redes reais, pausável no botão ou com M.

Valide a expansão com `node tests/blockchain.cjs`. O teste também verifica hashes contra o SHA-256 do Node, regras do contrato, pausa de animações e ausência de chamadas HTTP externas.

Os laboratórios precisam de Web Crypto (navegador atual, arquivo local ou localhost/HTTPS). Se indisponível, exibem uma mensagem, sem substituir hashes por valores fictícios.
