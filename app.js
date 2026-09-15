'use strict';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const slides = $$('.slide');
const chapters = ['SEMINÁRIO', 'ATO I · A AMEAÇA', 'ATO II · A DEFESA', 'ATO III · A BLOCKCHAIN', 'ATO IV · O HORIZONTE'];
let current = 0;
const fmt = (n, digits = 0) => n.toLocaleString('pt-BR', { maximumFractionDigits: digits });

function goTo(index, updateHash = true) {
  current = Math.max(0, Math.min(slides.length - 1, Number.isFinite(index) ? index : 0));
  const moveFocus = slides.some((slide, i) => i !== current && slide.contains(document.activeElement));
  slides.forEach((slide, i) => {
    slide.classList.toggle('active', i === current);
    slide.setAttribute('aria-hidden', String(i !== current));
    slide.inert = i !== current;
    if (i === current) slide.scrollTop = 0;
  });
  const slide = slides[current];
  if (moveFocus) slide.focus({ preventScroll: true });
  $('#slide-current').textContent = String(current + 1).padStart(2, '0');
  $('#slide-total').textContent = slides.length;
  $('#slide-chapter').textContent = chapters[+slide.dataset.act];
  $('#deck-progress').style.width = `${(current + 1) / slides.length * 100}%`;
  $('#prev').disabled = current === 0;
  $('#next').disabled = current === slides.length - 1;
  $$('.topbar nav button').forEach((button, i) => {
    button.classList.toggle('active', i + 1 === +slide.dataset.act);
    button.setAttribute('aria-current', i + 1 === +slide.dataset.act ? 'step' : 'false');
  });
  $$('#overview-grid button').forEach((button, i) => button.setAttribute('aria-current', String(i === current)));
  $('#notes-content').innerHTML = $('.notes', slide)?.innerHTML || '';
  $('#announcer').textContent = `Slide ${current + 1} de ${slides.length}: ${slide.dataset.title}`;
  document.title = `${current + 1}. ${slide.dataset.title} · PQC & Blockchain`;
  if (updateHash) history.replaceState(null, '', `#${current + 1}`);
  document.dispatchEvent(new Event('slidechange'));
}

slides.forEach((slide, i) => {
  slide.tabIndex = -1;
  slide.setAttribute('role', 'group');
  slide.setAttribute('aria-roledescription', 'slide');
  slide.setAttribute('aria-label', `${i + 1} de ${slides.length}: ${slide.dataset.title}`);
  const button = document.createElement('button');
  button.innerHTML = `<span>${String(i + 1).padStart(2, '0')} / ${chapters[+slide.dataset.act].split(' · ')[0]}</span>${slide.dataset.title}`;
  button.addEventListener('click', () => { $('#overview').close(); goTo(i); });
  $('#overview-grid').append(button);
});

$$('[data-goto]').forEach(button => button.addEventListener('click', () => goTo(+button.dataset.goto - 1)));
$('#prev').addEventListener('click', () => goTo(current - 1));
$('#next').addEventListener('click', () => goTo(current + 1));
$('#overview-open').addEventListener('click', () => $('#overview').showModal());
$('#help-open').addEventListener('click', () => $('#help').showModal());
$$('[data-close]').forEach(button => button.addEventListener('click', () => document.getElementById(button.dataset.close).close()));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  const r = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) dialog.close();
}));
function toggleNotes(force) {
  const show = typeof force === 'boolean' ? force : $('#notes-panel').hidden;
  $('#notes-panel').hidden = !show;
  $('#notes-toggle').setAttribute('aria-expanded', String(show));
}
$('#notes-toggle').addEventListener('click', () => toggleNotes());
$('#notes-close').addEventListener('click', () => { toggleNotes(false); $('#notes-toggle').focus(); });
let toastTimer;
function toast(message) {
  $('#toast').textContent = message; $('#toast').hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
}
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else toast('Tela cheia não está disponível neste navegador. Use a opção de tela cheia do navegador.');
  } catch { toast('O navegador bloqueou a tela cheia. Tente abrir a apresentação em uma aba própria.'); }
}
$('#fullscreen').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => $('#fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Sair da tela cheia' : 'Entrar em tela cheia'));
$('#print').addEventListener('click', () => { $('#help').close(); window.print(); });
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'Escape') { toggleNotes(false); return; }
  if ($('dialog[open]')) return;
  if (event.target.closest('input,select,textarea,[contenteditable=true]')) return;
  if (event.target.closest('button,a') && [' ', 'Enter'].includes(event.key)) return;
  const key = event.key.toLowerCase();
  if (['arrowright','pagedown',' '].includes(key)) { event.preventDefault(); goTo(current + 1); }
  if (['arrowleft','pageup'].includes(key)) { event.preventDefault(); goTo(current - 1); }
  if (key === 'home') { event.preventDefault(); goTo(0); }
  if (key === 'end') { event.preventDefault(); goTo(slides.length - 1); }
  if (key === 'f') toggleFullscreen();
  if (key === 'n') toggleNotes();
  if (key === 'g') $('#overview').showModal();
  if (key === '?') $('#help').showModal();
});
let touchStart;
$('#deck').addEventListener('touchstart', event => {
  if (event.target.closest('button,a,input,select,textarea')) { touchStart = null; return; }
  touchStart = { x: event.touches[0].clientX, y: event.touches[0].clientY };
}, { passive: true });
$('#deck').addEventListener('touchend', event => {
  if (!touchStart) return;
  const dx = event.changedTouches[0].clientX - touchStart.x;
  const dy = event.changedTouches[0].clientY - touchStart.y;
  if (Math.abs(dx) > 75 && Math.abs(dx) > Math.abs(dy) * 1.5) goTo(current + (dx < 0 ? 1 : -1));
  touchStart = null;
}, { passive: true });
window.addEventListener('hashchange', () => goTo(parseHash(), false));
function parseHash() { const n = Number(location.hash.slice(1)); return Number.isInteger(n) && n > 0 ? n - 1 : 0; }

// Demos intentionally use small public constants, never real keys or wallet data.
$('#dh-reveal').addEventListener('click', () => {
  $('#dh-result').innerHTML = '<strong class="cyan">Os dois chegaram à mesma chave: 2</strong><div class="dh-calcs"><span>Alice combina 19 com seu segredo 6 → 2</span><span>Bob combina 8 com seu segredo 15 → 2</span></div>';
  $('#dh-reveal').textContent = 'Chave compartilhada: 2';
});
let shorStep = 0;
const shorSteps = [
  ['01 / ESCOLHER','N = 15 e auxiliar a = 2','2 não divide 15; agora observamos os restos das potências.'],
  ['02 / GERAR A SEQUÊNCIA','1 → 2 → 4 → 8 → 1','São os restos de 2ˣ dividido por 15. O valor 1 apareceu novamente.'],
  ['03 / ACHAR O PERÍODO','r = 4','Do primeiro 1 ao segundo, avançamos quatro posições. Essa é a repetição procurada.'],
  ['04 / RECUPERAR OS FATORES','15 = 3 × 5','2^(4/2) = 4; MDC(4−1, 15) = 3 e MDC(4+1, 15) = 5.']
];
function renderShor() {
  const step = shorSteps[shorStep];
  $('#shor-counter').textContent = `PASSO ${shorStep + 1} / 4`;
  $('#shor-answer').innerHTML = `<span class="mono cyan">${step[0]}</span><h3>${step[1]}</h3><p>${step[2]}</p>`;
  $('#period-row').classList.toggle('revealed', shorStep > 0);
  $('#shor-step').disabled = shorStep === 3;
}
$('#shor-step').addEventListener('click', () => { shorStep = Math.min(3, shorStep + 1); renderShor(); });
$('#shor-reset').addEventListener('click', () => { shorStep = 0; renderShor(); });

function updateMosca() {
  const x = +$('#secret-years').value, y = +$('#migration-years').value, z = +$('#quantum-years').value;
  $('#secret-value').textContent = `${x} ${x === 1 ? 'ano' : 'anos'}`;
  $('#migration-value').textContent = `${y} ${y === 1 ? 'ano' : 'anos'}`;
  $('#quantum-value').textContent = `${z} ${z === 1 ? 'ano' : 'anos'}`;
  const margin = z - x - y;
  $('#mosca-result').classList.toggle('warn', margin <= 0);
  $('#mosca-result').innerHTML = `<strong>${x} + ${y} ${margin > 0 ? '<' : margin === 0 ? '=' : '>'} ${z}</strong><br>${margin > 0 ? `Margem hipotética de ${margin} ${margin === 1 ? 'ano' : 'anos'}.` : margin === 0 ? 'Sem margem de segurança neste cenário.' : `O prazo necessário excede o horizonte em ${Math.abs(margin)} ${Math.abs(margin) === 1 ? 'ano' : 'anos'}.`}`;
}
['secret-years','migration-years','quantum-years'].forEach(id => document.getElementById(id).addEventListener('input', updateMosca));

const schemes = [
  { name: 'ECDSA', family: 'Base clássica · formato bruto', key: 33, sig: 64 },
  { name: 'Falcon-512', family: 'Reticulados · tamanho aproximado', key: 897, sig: 666 },
  { name: 'ML-DSA-44', family: 'Reticulados · FIPS 204', key: 1312, sig: 2420 },
  { name: 'SLH-DSA-128s', family: 'Hash · FIPS 205', key: 32, sig: 7856 }
];
function renderSizes(mode = 'signature') {
  const values = schemes.map(scheme => scheme.sig + (mode === 'total' ? scheme.key : 0));
  $('#size-chart').innerHTML = schemes.map((scheme, i) => `<div class="size-row"><div class="size-name"><strong>${scheme.name}</strong><small>${scheme.family}</small></div><div class="size-bar-track"><div class="size-bar" style="width:${values[i] / Math.max(...values) * 100}%"></div></div><div class="size-number"><strong>${fmt(values[i])} B</strong><small>${i ? `${fmt(values[i] / values[0], 1)}× a base` : 'Referência'}</small></div></div>`).join('');
  $$('[data-size-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.sizeMode === mode)));
  $('#size-chart').setAttribute('aria-label', mode === 'total' ? 'Comparação de chave pública mais assinatura, em bytes' : 'Comparação de assinaturas, em bytes');
}
$$('[data-size-mode]').forEach(button => button.addEventListener('click', () => renderSizes(button.dataset.sizeMode)));

const exposure = {
  hidden: ['P2PKH não gasto', 'não revelada', 'ainda não aberta', 'O endereço publica um hash. Isso reduz a exposição direta a Shor, sem substituir a necessidade de migração.'],
  mempool: ['P2PKH em gasto', 'revelada na transação', 'até a confirmação do gasto', 'Um atacante precisaria recuperar a chave e competir com o gasto antes da confirmação. A duração não é fixa.'],
  public: ['P2PK / P2TR / reutilização', 'visível no histórico', 'exposição prolongada', 'O atacante pode trabalhar sobre uma chave já publicada enquanto ainda houver fundos controlados por ela.']
};
function renderExposure(mode) {
  const data = exposure[mode];
  ['type','key','window','result'].forEach((key, i) => $(`#exposure-${key}`).textContent = data[i]);
  $('#exposure-result').classList.toggle('warn', mode !== 'hidden');
  $$('[data-exposure]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.exposure === mode)));
}
$$('[data-exposure]').forEach(button => button.addEventListener('click', () => renderExposure(button.dataset.exposure)));

function formatBytes(bytes) { return bytes >= 1e9 ? `${fmt(bytes / 1e9, 2)} GB` : `${fmt(bytes / 1e6, 2)} MB`; }
function updateVolume() {
  const count = +$('#signature-count').value * 1e6;
  const scheme = schemes[+$('#scheme-select').value];
  const base = count * schemes[0].sig;
  $('#count-value').textContent = fmt(count);
  $('#volume-pq').textContent = formatBytes(count * scheme.sig);
  $('#volume-label').textContent = scheme.name;
  $('#volume-base').textContent = formatBytes(base);
  $('#volume-delta').textContent = `+${formatBytes(count * scheme.sig - base)}`;
}
$('#signature-count').addEventListener('input', updateVolume);
$('#scheme-select').addEventListener('change', updateVolume);
$$('[data-decision]').forEach(button => button.addEventListener('click', () => {
  $$('[data-decision]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  $('#decision-result').classList.toggle('warn', button.dataset.decision === 'access');
  $('#decision-result').textContent = button.dataset.decision === 'protect' ? 'O custo: uma regra de proteção pode dificultar o acesso de detentores legítimos. Quem consegue provar a posse original?' : 'O custo: manter gastos legados preserva o acesso, mas pode permitir que um atacante com a chave recuperada gaste os fundos.';
}));

const quiz = [
  {
    question: 'Ao se realizar o acesso a um servidor WWW usando o protocolo HTTPS, uma sessão SSL é estabelecida sobre a conexão TCP, entre o programa navegador do usuário e o processo servidor. Para tanto, usam-se mecanismos baseados em criptografia simétrica e assimétrica para prover serviços de segurança. Em relação ao acesso HTTP, sem SSL, que serviços de segurança são providos para o usuário?',
    options: [
      'Autenticação do servidor e controle de acesso do cliente.',
      'Autenticação do cliente e controle da velocidade de transmissão.',
      'Autenticação da rede e proteção contra vírus.',
      'Autenticação do servidor e confidencialidade das transmissões.',
      'Autenticação do cliente e temporização das ações executadas.'
    ],
    answer: 3,
    rationale: [
      'Errada: sem certificado de cliente, SSL não faz "controle de acesso do cliente" — a parte de autenticação do servidor está certa, mas o resto não.',
      'Errada: autenticação do cliente exigiria um certificado de cliente, incomum nesse cenário; "controle da velocidade de transmissão" não é um serviço de segurança do SSL.',
      'Errada: SSL/TLS não autentica "a rede" nem protege contra vírus — isso pertence a outras camadas de segurança, como antivírus e firewall.',
      'Correta: SSL/TLS soma exatamente esses dois serviços ao HTTP simples — o servidor apresenta um certificado (autenticação) e a sessão cifra os dados em trânsito (confidencialidade).',
      'Errada: de novo, não há autenticação do cliente por padrão, e "temporização das ações" não é um serviço de segurança do SSL/TLS.'
    ],
    source: 'ENADE 2008 · Computação · Questão 42 · gabarito oficial: D'
  },
  {
    question: 'Analise as afirmativas a seguir sobre o algoritmo de criptografia RSA:\n\nI. É um algoritmo de criptografia simétrica, conhecido por utilizar uma única chave para encriptação e decriptação dos dados.\n\nII. É um algoritmo de chave pública que utiliza como base a dificuldade de fatorar números grandes em seus fatores primos, proporcionando segurança na transmissão de dados.\n\nIII. Gera as chaves pública e privada a partir de uma série de operações de multiplicação de números pares, o que o torna resistente a ataques de força bruta.\n\nEstá correto o que se afirma em',
    options: [
      'I, apenas.',
      'II, apenas.',
      'III, apenas.',
      'I e II, apenas.',
      'II e III, apenas.'
    ],
    answer: 1,
    rationale: [
      'Errada: a afirmativa I está errada — o RSA é um algoritmo de chave pública (assimétrico), com um par de chaves diferentes, não uma única chave simétrica.',
      'Correta: a afirmativa II descreve o RSA com precisão — chave pública apoiada na dificuldade de fatorar números grandes em seus fatores primos, exatamente como vimos no início da apresentação.',
      'Errada: a afirmativa III está errada em dois pontos — as chaves vêm de números primos, não de "números pares", e a segurança vem da dificuldade de fatoração, não de "multiplicação de números pares".',
      'Errada: inclui a afirmativa I, que é falsa (o RSA não é simétrico).',
      'Errada: inclui a afirmativa III, que descreve incorretamente a geração das chaves do RSA.'
    ],
    source: 'FGV · 2024 · Prefeitura de Cuiabá – MT · Auditor Fiscal Tributário da Receita Municipal (Tecnologia da Informação) · Segurança da Informação / Criptografia',
    sourceUrl: 'https://www.qconcursos.com/questoes-de-concursos/questoes/4208c318-d8'
  },
  {
    question: 'A criptografia de ponta a ponta do WhatsApp garante que somente você e a pessoa com quem você está se comunicando podem ler o que é enviado. Ninguém mais terá acesso a elas, nem mesmo o WhatsApp. As suas mensagens estão seguras com cadeados e somente você e a pessoa que as recebe possuem as chaves especiais necessárias para abri-los e ler as mensagens. E, para uma proteção ainda maior, cada mensagem que você envia tem um cadeado e uma chave únicos.\n(Disponível em: https://faq.whatsapp.com/pt_br/general/28030015. Acesso em: 05 mai. 2020.)\n\nCom base no texto acima, avalie as afirmações a seguir.\n\nI. Se um par de chaves é gerado durante a instalação do aplicativo e a chave pública do usuário é armazenada no servidor, é possível verificar a autenticidade de uma mensagem recebida usando a chave pública do remetente obtida do servidor.\n\nII. A estratégia de utilizar um vetor de inicialização (IV) variável para compor chaves criptográficas diferentes para cada mensagem enviada oculta padrões de dados, além de dificultar os chamados ataques de reprodução.\n\nIII. O uso do algoritmo AES nas comunicações entre dois usuários indica o emprego de criptografia simétrica, isto é, aquela que utiliza um par de chaves, uma usada pelo remetente para encriptar a mensagem, e outra para o destinatário decriptá-la.\n\nIV. A presença do algoritmo SHA-256, no protocolo de comunicação entre cliente e servidor, sugere a verificação de integridade das mensagens, visto que é possível detectar se ocorreu alguma modificação comparando-se os valores de hash da mensagem enviada e recebida.\n\nÉ correto apenas o que se afirma em',
    options: [
      'I e IV.',
      'II e III.',
      'III e IV.',
      'I, II e III.',
      'I, II e IV.'
    ],
    answer: 4,
    rationale: [
      'Incompleta: I está correta, mas a opção ignora II, que também é uma afirmação correta.',
      'Errada: II está correta, mas III está errada — ela descreve criptografia simétrica com duas chaves diferentes, o que na verdade é a definição de criptografia assimétrica.',
      'Errada: IV está correta, mas inclui III, que descreve incorretamente a criptografia simétrica.',
      'Errada: I e II estão corretas, mas inclui III, que está errada.',
      'Correta: reúne exatamente as três afirmações certas — I, II e IV — e exclui a única errada, III (que confunde simétrica com assimétrica).'
    ],
    source: 'ENADE 2021 · Ciência da Computação · Questão 24 · gabarito oficial: E'
  },
  {
    question: 'Sobre a tecnologia Blockchain, considerada um sistema de registro distribuído de transações, assinale a alternativa correta:',
    options: [
      'Baseia-se em um livro-razão distribuído, composto por blocos encadeados criptograficamente, cujos registros são imutáveis após validados por mecanismos de consenso, garantindo transparência e segurança.',
      'Trata-se de um sistema centralizado, no qual uma única autoridade governamental controla, válida e armazena os registros em blocos criptografados em todas as transações realizadas na rede, garantindo transparência, segurança e anonimato.',
      'É uma tecnologia desenvolvida exclusivamente para viabilizar criptomoedas, composto por blocos encadeados criptograficamente como o Bitcoin, garantindo transparência e segurança.',
      'Depende obrigatoriamente de um servidor central responsável por autenticar, validar e autorizar todas as transações efetuadas pelos usuários, utilizando blocos encadeados criptograficamente, cujos registros não podem ser imutáveis.',
      'Impede qualquer forma de rastreamento das operações realizadas, por mecanismos de consenso, garantindo transparência e segurança, assegurando anonimato absoluto aos participantes da rede.'
    ],
    answer: 0,
    rationale: [
      'Correta: reúne exatamente as características de uma blockchain — livro-razão distribuído, blocos encadeados por hash e imutabilidade depois que o consenso valida o bloco.',
      'Errada: o ponto central de uma blockchain é justamente não depender de uma autoridade central — vários nós replicam e validam o registro de forma distribuída, como vimos no fluxo de transação.',
      'Errada: blockchain não nasceu nem se limita a criptomoedas — a mesma estrutura de blocos encadeados sustenta contratos inteligentes, como os que vimos em Ethereum e Solana.',
      'Errada: contraria dois pilares ao mesmo tempo — não existe servidor central obrigatório (é descentralizada), e a imutabilidade dos registros validados é uma característica central, não sua ausência.',
      'Errada: contradiz a si mesma — transparência e rastreabilidade são características do modelo (o histórico é público); a maioria das blockchains oferece pseudonimato por endereços, não anonimato absoluto, como discutimos na exposição de chaves públicas do Bitcoin.'
    ],
    source: 'IVIN · 2026 · Prefeitura de Campo Grande do Piauí – PI · Professor de Ciências da Computação · Segurança da Informação / Criptografia',
    sourceUrl: 'https://www.qconcursos.com/questoes-de-concursos/questoes/f1740ede-28'
  }
];
let quizIndex = 0, quizScore = 0, quizAnswered = false;
function renderQuiz() {
  const q = quiz[quizIndex]; quizAnswered = false;
  $('#quiz-number').textContent = `PERGUNTA ${String(quizIndex + 1).padStart(2, '0')} / ${String(quiz.length).padStart(2, '0')}`;
  $('#quiz-question').textContent = q.question;
  $('#quiz-source').innerHTML = q.sourceUrl ? `Fonte: <a href="${q.sourceUrl}" target="_blank" rel="noopener">${q.source}</a>` : `Fonte: ${q.source}`;
  $('#quiz-options').classList.remove('revealed');
  $('#quiz-options').innerHTML = '';
  q.options.forEach((option, i) => {
    const button = document.createElement('button'); button.className = 'quiz-option';
    button.innerHTML = `<span>${String.fromCharCode(65 + i)}</span><b class="quiz-option-text">${option}</b><small class="quiz-rationale"></small>`;
    button.addEventListener('click', () => answerQuiz(i));
    $('#quiz-options').append(button);
  });
  $('#quiz-feedback').classList.remove('warn');
  $('#quiz-feedback').textContent = 'Escolha uma resposta: cada alternativa vai mostrar por que está certa ou errada.';
  $('#quiz-next').disabled = true;
  $('#quiz-next').textContent = quizIndex === quiz.length - 1 ? 'Ver resultado →' : 'Próxima pergunta →';
}
function answerQuiz(answer) {
  if (quizAnswered) return;
  quizAnswered = true;
  const q = quiz[quizIndex], correct = answer === q.answer;
  if (correct) quizScore++;
  $$('.quiz-option').forEach((button, i) => {
    button.disabled = true;
    button.classList.toggle('correct', i === q.answer);
    button.classList.toggle('wrong', i === answer && !correct);
    button.querySelector('.quiz-rationale').textContent = q.rationale[i];
  });
  $('#quiz-options').classList.add('revealed');
  $('#quiz-feedback').classList.toggle('warn', !correct);
  $('#quiz-feedback').textContent = correct ? 'Correto — veja o porquê de cada alternativa acima.' : 'Resposta incorreta — veja o porquê de cada alternativa acima.';
  $('#quiz-next').disabled = false;
}
$('#quiz-next').addEventListener('click', () => {
  if (!quizAnswered) return;
  if (quizIndex < quiz.length - 1) { quizIndex++; renderQuiz(); }
  else {
    $('#quiz-feedback').classList.remove('warn');
    $('#quiz-feedback').textContent = `${quizScore} de ${quiz.length} respostas corretas. A migração combina matemática, engenharia e governança.`;
    $('#quiz-next').disabled = true;
    $('#quiz-next').textContent = 'Quiz concluído';
  }
});
$('#quiz-restart').addEventListener('click', () => { quizIndex = 0; quizScore = 0; renderQuiz(); });

renderShor(); updateMosca(); renderSizes(); renderExposure('hidden'); updateVolume(); renderQuiz(); goTo(parseHash(), false);
