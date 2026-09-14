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
  { question: 'Ao acessar um servidor web por HTTPS, quais serviços de segurança são oferecidos ao usuário em relação ao HTTP?', options: ['Autenticação do servidor e controle de acesso do cliente.', 'Autenticação do cliente e controle da velocidade.', 'Autenticação da rede e proteção contra vírus.', 'Autenticação do servidor e confidencialidade da transmissão.', 'Autenticação do cliente e temporização das ações.'], answer: 3, explanation: 'HTTPS autentica o servidor por certificado e protege a confidencialidade do canal. Fonte: ENADE Computação 2008, questão 42, gabarito D.' },
  { question: 'Para o 3DES manter compatibilidade e decifrar uma mensagem cifrada com DES, qual composição deve ser usada?', options: ['D(C(D(m, ka), kb), kc), com ka ≠ kb ≠ kc.', 'D(D(D(m, ka), kb), kc), com ka ≠ kb ≠ kc.', 'D(D(D(m, ka), kb), kc), com ka = kb = kc.', 'D(C(D(m, ka), kb), kc), com ka = kb = kc.', 'D(D(C(m, ka), kb), kc), com ka = kb = kc.'], answer: 3, explanation: 'Com ka = kb = kc, a operação central C desfaz a primeira D; resta uma decifração DES. Fonte: ENADE Engenharia de Computação 2019, questão 18, gabarito D.' },
  { question: 'Segurança de mensagens: quais afirmações estão corretas?\nI. Uma chave pública autenticada ajuda a verificar o remetente.\nII. Um vetor de inicialização variável dificulta padrões e repetições.\nIII. AES usa um par de chaves diferentes.\nIV. SHA-256 pode ajudar a verificar integridade.', options: ['I e IV.', 'II e III.', 'III e IV.', 'I, II e III.', 'I, II e IV.'], answer: 4, explanation: 'AES é simétrico; por isso a afirmação III está errada. Fonte: ENADE Ciência da Computação 2021, questão 24, gabarito E (enunciado resumido).' }
];
let quizIndex = 0, quizScore = 0, quizAnswered = false;
function renderQuiz() {
  const q = quiz[quizIndex]; quizAnswered = false;
  $('#quiz-number').textContent = `PERGUNTA ${String(quizIndex + 1).padStart(2, '0')} / 03`;
  $('#quiz-question').textContent = q.question;
  $('#quiz-options').innerHTML = '';
  q.options.forEach((option, i) => {
    const button = document.createElement('button'); button.className = 'quiz-option';
    button.innerHTML = `<span>${String.fromCharCode(65 + i)}</span>${option}`;
    button.addEventListener('click', () => answerQuiz(i));
    $('#quiz-options').append(button);
  });
  $('#quiz-feedback').classList.remove('warn');
  $('#quiz-feedback').textContent = 'Escolha uma resposta para revelar a explicação.';
  $('#quiz-next').disabled = true;
  $('#quiz-next').textContent = quizIndex === 2 ? 'Ver resultado →' : 'Próxima pergunta →';
}
function answerQuiz(answer) {
  if (quizAnswered) return;
  quizAnswered = true;
  const q = quiz[quizIndex], correct = answer === q.answer;
  if (correct) quizScore++;
  $$('.quiz-option').forEach((button, i) => { button.disabled = true; button.classList.toggle('correct', i === q.answer); button.classList.toggle('wrong', i === answer && !correct); });
  $('#quiz-feedback').classList.toggle('warn', !correct);
  $('#quiz-feedback').textContent = `${correct ? 'Correto.' : 'Veja a resposta destacada.'} ${q.explanation}`;
  $('#quiz-next').disabled = false;
}
$('#quiz-next').addEventListener('click', () => {
  if (!quizAnswered) return;
  if (quizIndex < quiz.length - 1) { quizIndex++; renderQuiz(); }
  else {
    $('#quiz-feedback').classList.remove('warn');
    $('#quiz-feedback').textContent = `${quizScore} de 3 respostas corretas. A migração combina matemática, engenharia e governança.`;
    $('#quiz-next').disabled = true;
    $('#quiz-next').textContent = 'Quiz concluído';
  }
});
$('#quiz-restart').addEventListener('click', () => { quizIndex = 0; quizScore = 0; renderQuiz(); });

renderShor(); updateMosca(); renderSizes(); renderExposure('hidden'); updateVolume(); renderQuiz(); goTo(parseHash(), false);
