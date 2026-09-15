# Roteiro de apresentação — 1h20

O deck tem 47 slides. A divisão abaixo soma 84 minutos de fala. Veja "Controle de tempo" para o ajuste necessário.

| Pessoa | Slides | Tema | Tempo |
|---|---:|---|---:|
| Pessoa 1 | 1–16 | fundamentos, criptografia clássica e ameaça quântica | 28 min |
| Pessoa 2 | 17–22 | criptografia pós-quântica, artigo V2V e padronização | 14 min |
| Pessoa 3 | 23–41 | blockchain: a evolução das peças e o risco quântico | 30 min |
| Pessoa 2 | 42–47 | horizonte, plano de migração, questões e fechamento | 12 min |
|  |  | **Total** | **84 min** |

## Pessoa 1 — 28 min

- Slides 1–2 (2 min): pergunta central e mapa dos quatro atos.
- Slides 3–8 (12 min): objetivos da criptografia, Diffie–Hellman, uso híbrido, RSA, ECC e assinatura digital.
- Slides 9–13 (10 min): metáfora do qubit, passo a passo de Shor, Grover, mapa de impacto e limitações do hardware.
- Slides 14–16 (5 min): ligação com Bitcoin, Store Now Decrypt Later e argumento de Mosca.

Passagem sugerida: "Vimos o que deixa de ser seguro. Agora a Pessoa 2 mostra quais alternativas já existem e por que trocar não é apenas mudar o nome de um algoritmo."

## Pessoa 2 — 14 min + 12 min

- Slides 17–18 (4 min): famílias PQC e diferença entre KEM e assinatura.
- Slides 19–20 (6 min): processo do NIST e comparador de tamanho.
- Slide 21 (2 min): descoberta do artigo V2V — 93% do acréscimo veio do tempo de transmissão no cenário estudado.
- Slide 22 (2 min): riscos de implementação e operação.
- Slides 42–44 (6 min): Falcon, prazos e projeto de migração.
- Slide 45 (5 min): três questões oficiais do ENADE.
- Slides 46–47 (1 min): conclusão e referências.

Passagem sugerida para a blockchain: "As alternativas existem, mas têm tamanhos e regras diferentes. A Pessoa 3 vai mostrar por que isso pesa mais em uma rede replicada por milhares de nós."

## Pessoa 3 — 30 min, somente blockchain

O ato é uma corrente: cada slide abre com o problema que herdou do anterior. A lacuna de um slide é o título do seguinte, e a trilha no rodapé mostra em que peça você está. Se precisar cortar, corte profundidade dentro de um slide, nunca um elo da corrente.

**A montagem da cadeia — 18 min**

| # | Slide | Fala | Tempo |
|---:|---|---|---:|
| 23 | Gasto duplo | o problema que gera todo o resto | 2 min |
| 24 | 1991—2022 | qual problema gerou cada peça | 2 min |
| 25 | SHA-256 | perceber que alguém mexeu | 2 min |
| 26 | O elo | proteger o passado, não só o último registro | 2 min |
| 27 | Nonce e proof of work | tornar a reescrita cara | 3 min |
| 28 | Recompensa e halving | quem paga o custo de escrever | 2 min |
| 29 | O bloco do Bitcoin | onde cada peça mora de verdade | 2 min |
| 30 | O ciclo da transação | as peças em movimento | 1 min |
| 31 | Contratos, 2015 | o registro passa a executar regras | 2 min |

**As variações de consenso — 6 min**

| # | Slide | Fala | Tempo |
|---:|---|---|---:|
| 32 | Proof of stake | o mesmo custo, sem queimar energia | 2 min |
| 33 | Proof of history | ordenar sem esperar acordo | 1 min |
| 34 | PoH na prática | o relógio não espera transações | 2 min |
| 35 | Três redes | as mesmas peças, três combinações | 1 min |

**O que a evolução não resolveu — 6 min**

| # | Slide | Fala | Tempo |
|---:|---|---|---:|
| 36 | Shor nas três redes | o pivô: nenhuma peça mudou a assinatura | 1 min |
| 37 | Exposição da chave | quanto tempo a chave fica à mostra | 1 min |
| 38 | Escala | o custo se multiplica pela rede | 1 min |
| 39 | BIP 360 | fechar a janela sem trocar a assinatura | 1 min |
| 40 | BIP 361 | o dilema de quem não migra | 1 min |
| 41 | Ethereum | outro caminho de migração | 1 min |

Passagem sugerida: "A blockchain não muda a matemática da ameaça; ela multiplica o custo e a coordenação da resposta. A Pessoa 2 fecha com as opções de transição."

## Controle de tempo

O deck pede 84 minutos, quatro a mais que a janela de 1h20 e sem margem para troca de apresentador. Escolha um dos ajustes antes de ensaiar:

- Cortar 4 min do Ato I (slides 9–13 comportam a redução) e manter o Ato III inteiro.
- Cortar 4 min do Ato III: juntar os slides 33 e 34 em uma fala única de 1 min, reduzir o slide 27 para 2 min e o 28 para 1 min.
- Dividir: 2 min do Ato I e 2 min do Ato III.
- Aceitar 84 min, se o horário permitir.

Marcos de passagem, já considerando 84 min:

- Chegar ao slide 17 com aproximadamente 28 minutos.
- Chegar ao slide 23 com aproximadamente 42 minutos.
- Chegar ao slide 36 com aproximadamente 66 minutos.
- Chegar ao slide 42 com aproximadamente 72 minutos.
- Iniciar as questões no minuto 78.
- Encerrar no minuto 84.
