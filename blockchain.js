'use strict';

// All data stays in this page. Web Crypto supplies SHA-256; no custom crypto.
async function sha256(text) {
  if (!globalThis.crypto?.subtle) throw new Error('SHA-256 indisponível. Abra o arquivo em um navegador atual ou via localhost/HTTPS.');
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map(n => n.toString(16).padStart(2, '0')).join('');
}
const shortHash = hash => `${hash.slice(0, 12)}…${hash.slice(-8)}`;

// Decorative flow, not live network telemetry. Paused when hidden or requested.
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let motionPaused = reducedMotion.matches;
$$('.slide[data-act="3"]').forEach(slide => {
  const backdrop = document.createElement('div');
  backdrop.className = 'chain-atmosphere'; backdrop.setAttribute('aria-hidden', 'true');
  backdrop.innerHTML = '<div class="ambient-rail">' + Array.from({ length: 7 }, (_, i) => `<div class="ambient-unit" style="--order:${i}"><div class="ambient-block"><b>BLOCK ${String(i + 1).padStart(2, '0')}</b><i></i><i></i><i></i><small>HASH →</small></div><span class="ambient-link"></span></div>`).join('') + '</div>';
  slide.prepend(backdrop);
});
function syncMotion() {
  if (reducedMotion.matches) motionPaused = true;
  $('#motion-toggle').disabled = reducedMotion.matches;
  $('#motion-toggle').title = reducedMotion.matches ? 'Movimento reduzido ativo nas preferências do sistema' : 'Pausar ou retomar animações (M)';
  document.body.classList.toggle('motion-paused', motionPaused || document.hidden);
  $('#motion-toggle').textContent = motionPaused ? '▷' : '⏸';
  $('#motion-toggle').setAttribute('aria-pressed', String(motionPaused));
  $('#motion-toggle').setAttribute('aria-label', motionPaused ? 'Retomar animações de blockchain' : 'Pausar animações de blockchain');
}
$('#motion-toggle').addEventListener('click', () => { motionPaused = !motionPaused; syncMotion(); });
reducedMotion.addEventListener('change', () => { motionPaused = reducedMotion.matches; syncMotion(); });
document.addEventListener('visibilitychange', () => { syncMotion(); if (document.hidden) stopMining(); });
document.addEventListener('keydown', event => {
  if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'm' && !event.target.closest('input,textarea,select,[contenteditable=true]') && !$('dialog[open]')) { motionPaused = !motionPaused; syncMotion(); }
});
syncMotion();

const flowSteps = [
  ['AUTORIZAÇÃO', 'A carteira assina a intenção.', 'A chave privada produz uma assinatura. Ela não precisa sair da carteira para a rede.', 'aguardando'],
  ['PROPAGAÇÃO', 'A transação circula entre nós.', 'Os participantes recebem e encaminham a mensagem. A topologia e as filas variam entre redes.', 'recebendo'],
  ['VALIDAÇÃO', 'As regras decidem se o gasto é válido.', 'Assinatura, fundos disponíveis e condições de execução precisam passar nas verificações.', 'verificando'],
  ['INCLUSÃO', 'Um produtor propõe o próximo bloco.', 'Mineradores ou validadores incluem transações conforme o protocolo. Outros nós verificam o resultado.', 'bloco proposto'],
  ['CONFIRMAÇÃO', 'A rede consolida uma versão do histórico.', 'A confiança na inclusão cresce conforme as regras de consenso e finalidade de cada rede.', 'confirmado']
];
let flowIndex = 0;
function renderFlow() {
  const step = flowSteps[flowIndex];
  ['label', 'title', 'text'].forEach((key, i) => $(`#flow-${key}`).textContent = step[i]);
  $('#flow-block-state').textContent = step[3];
  $('#flow-new').classList.toggle('confirmed', flowIndex === 4);
  $('#flow-new').classList.toggle('building', flowIndex > 0 && flowIndex < 4);
  $$('[data-flow]').forEach((button, i) => { button.setAttribute('aria-pressed', String(i === flowIndex)); button.classList.toggle('done', i < flowIndex); });
  $('#flow-next').disabled = flowIndex === 4;
}
$$('[data-flow]').forEach(button => button.addEventListener('click', () => { flowIndex = +button.dataset.flow; renderFlow(); }));
$('#flow-next').addEventListener('click', () => { flowIndex = Math.min(4, flowIndex + 1); renderFlow(); });
$('#flow-reset').addEventListener('click', () => { flowIndex = 0; renderFlow(); });
renderFlow();

let hashRevision = 0;
async function updateHashLab() {
  const revision = ++hashRevision;
  const a = $('#hash-reference').value, b = $('#hash-input').value;
  try {
    const [ha, hb] = await Promise.all([sha256(a), sha256(b)]);
    if (revision !== hashRevision) return;
    $('#hash-output-a').textContent = ha;
    // Only fixed hexadecimal output enters markup, never user-supplied text.
    $('#hash-output-b').innerHTML = [...hb].map((char, i) => `<span class="${char === ha[i] ? '' : 'changed'}">${char}</span>`).join('');
    const bits = [...ha].reduce((sum, digit, i) => sum + (parseInt(digit, 16) ^ parseInt(hb[i], 16)).toString(2).replace(/0/g, '').length, 0);
    $('#hash-bit-count').textContent = bits;
    $('#hash-percent').textContent = `${fmt(bits / 256 * 100, 1)}%`;
    $('#hash-bytes-a').textContent = `${new TextEncoder().encode(a).length} bytes UTF-8`;
    $('#hash-bytes-b').textContent = `${new TextEncoder().encode(b).length} bytes UTF-8`;
    $('#hash-status').textContent = a === b ? 'Entradas idênticas produzem o mesmo hash. SHA-256 é determinístico.' : 'SHA-256 real, calculado localmente. Um espaço também é um dado. Hash não é cifra nem assinatura.';
  } catch (error) { if (revision === hashRevision) $('#hash-status').textContent = error.message; }
}
['hash-reference', 'hash-input'].forEach(id => document.getElementById(id).addEventListener('input', updateHashLab));
$('#hash-match').addEventListener('click', () => { $('#hash-input').value = $('#hash-reference').value; updateHashLab(); });
$('#hash-space').addEventListener('click', () => {
  if ($('#hash-input').value.length >= 1000) { toast('Limite de 1.000 caracteres atingido. Apague um caractere para adicionar o espaço.'); return; }
  $('#hash-input').value += ' '; updateHashLab();
});
$('#hash-reset').addEventListener('click', () => { $('#hash-reference').value = 'Alice envia 10 para Bob'; $('#hash-input').value = 'Alice envia 11 para Bob'; updateHashLab(); });
updateHashLab();

const originalChainData = ['Alice envia 10 para Bob', 'Bob envia 4 para Carol', 'Carol envia 2 para Dani'];
let chainPrevious = ['0'.repeat(64), '', ''], originalChainHashes = [], chainRevision = 0;
$$('.chain-data').forEach(input => { input.disabled = true; });
async function updateChain(relink = false, reset = false) {
  const revision = ++chainRevision;
  $('#chain-relink').disabled = true;
  $('#chain-reset').disabled = true;
  if (reset) $$('.chain-data').forEach((input, i) => { input.value = originalChainData[i]; });
  const data = $$('.chain-data').map(input => input.value);
  const previous = [...chainPrevious], hashes = [];
  try {
    for (let i = 0; i < 3; i++) {
      if (i && relink) previous[i] = hashes[i - 1];
      hashes.push(await sha256(JSON.stringify([i + 1, previous[i], data[i]])));
    }
    if (revision !== chainRevision) return;
    chainPrevious = previous;
    if (reset) originalChainHashes = [...hashes];
    let broken = 0, changed = 0, inherited = false;
    $$('.linked-block').forEach((block, i) => {
      const badLink = i > 0 && previous[i] !== hashes[i - 1];
      const modified = hashes[i] !== originalChainHashes[i];
      if (badLink) broken++;
      if (modified) changed++;
      block.classList.toggle('bad-link', badLink);
      block.classList.toggle('modified', modified);
      block.classList.toggle('affected', inherited && !badLink);
      $('.block-state', block).textContent = badLink ? 'ELO QUEBRADO' : inherited ? 'CADEIA AFETADA' : modified ? 'HASH ALTERADO' : 'ORIGINAL';
      const prev = $('.previous-hash', block), hash = $('.current-hash', block);
      prev.textContent = shortHash(previous[i]); prev.title = previous[i];
      hash.textContent = shortHash(hashes[i]); hash.title = hashes[i];
      if (badLink) inherited = true;
    });
    $('#chain-status').classList.toggle('warn', broken > 0 || changed > 0);
    $('#chain-status').textContent = broken ? `${broken} ${broken === 1 ? 'elo não corresponde' : 'elos não correspondem'} ao bloco anterior. O trecho seguinte depende desse histórico alterado.` : changed ? 'Elos locais coerentes, mas os hashes diferem da cadeia original. Isso não representa aprovação da rede.' : 'Elos coerentes. Todos os hashes correspondem à cadeia original.';
  } catch (error) { if (revision === chainRevision) $('#chain-status').textContent = error.message; }
  finally { if (revision === chainRevision) { $('#chain-relink').disabled = false; $('#chain-reset').disabled = false; if (originalChainHashes.length === 3) $$('.chain-data').forEach(input => { input.disabled = false; }); } }
}
$$('.chain-data').forEach(input => input.addEventListener('input', () => updateChain()));
$('#chain-relink').addEventListener('click', () => updateChain(true));
$('#chain-reset').addEventListener('click', () => updateChain(true, true));
updateChain(true, true);

let mining = false, miningRevision = 0;
function setMining(active) {
  mining = active;
  $('#pow-mine').disabled = active; $('#pow-stop').disabled = !active;
  ['pow-data', 'pow-nonce', 'pow-difficulty'].forEach(id => document.getElementById(id).disabled = active);
}
function stopMining() {
  if (!mining) return;
  ++miningRevision; setMining(false);
  $('#pow-status').textContent = 'Busca interrompida. Nenhuma atividade continua em segundo plano.';
}
function getNonce() {
  const input = $('#pow-nonce'), nonce = Number(input.value);
  if (input.value === '' || !Number.isSafeInteger(nonce) || nonce < 0 || nonce > 9999999) throw new Error('Informe um nonce inteiro entre 0 e 9.999.999.');
  return nonce;
}
async function updatePow() {
  const revision = ++miningRevision;
  try {
    const nonce = getNonce(), prefix = '0'.repeat(+$('#pow-difficulty').value);
    const hash = await sha256(JSON.stringify([$('#pow-data').value, nonce]));
    if (revision !== miningRevision) return;
    $('#pow-hash').textContent = hash;
    $('#pow-status').classList.toggle('warn', !hash.startsWith(prefix));
    $('#pow-status').textContent = hash.startsWith(prefix) ? `Nonce ${fmt(nonce)} atende ao prefixo ${prefix}. Conferir exige calcular este hash.` : `Nonce ${fmt(nonce)} não atende ao prefixo ${prefix}. Tente outro ou use a busca.`;
  } catch (error) { if (revision === miningRevision) { $('#pow-hash').textContent = '—'; $('#pow-status').textContent = error.message; } }
}
$('#pow-mine').addEventListener('click', async () => {
  if (mining) return;
  let start;
  try { start = getNonce(); } catch (error) { $('#pow-status').textContent = error.message; return; }
  const data = $('#pow-data').value, prefix = '0'.repeat(+$('#pow-difficulty').value), revision = ++miningRevision;
  setMining(true);
  try {
    for (let tries = 1; tries <= 8192 && start + tries - 1 <= 9999999; tries++) {
      const nonce = start + tries - 1;
      const hash = await sha256(JSON.stringify([data, nonce]));
      if (revision !== miningRevision) return;
      if (tries % 32 === 0 || hash.startsWith(prefix)) {
        $('#pow-nonce').value = nonce; $('#pow-hash').textContent = hash;
        $('#pow-status').textContent = `${fmt(tries)} tentativas nesta busca…`;
      }
      if (hash.startsWith(prefix)) {
        $('#pow-status').classList.remove('warn');
        $('#pow-status').textContent = `Encontrado: nonce ${fmt(nonce)} após ${fmt(tries)} tentativas. Altere os dados para conferir.`;
        return;
      }
      if (tries % 32 === 0) await new Promise(resolve => setTimeout(resolve, 0));
    }
    $('#pow-status').textContent = 'Limite desta busca atingido. Tente outro nonce inicial ou diminua a dificuldade.';
  } catch (error) { if (revision === miningRevision) $('#pow-status').textContent = error.message; }
  finally { if (revision === miningRevision) setMining(false); }
});
$('#pow-stop').addEventListener('click', stopMining);
['pow-data', 'pow-nonce'].forEach(id => document.getElementById(id).addEventListener('input', updatePow));
$('#pow-difficulty').addEventListener('change', updatePow);
document.addEventListener('slidechange', () => { if (!$('#pow-slide').classList.contains('active')) stopMining(); });
updatePow();

const networkDetails = {
  btc: 'BTC: uma transação consome saídas anteriores e cria novas saídas. Scripts definem quem pode gastar e sob quais condições, como múltiplas assinaturas ou bloqueios de tempo.',
  eth: 'ETH: uma transação pode chamar um contrato na EVM e alterar seu estado. Gas mede o trabalho de execução e participa do custo da operação.',
  sol: 'SOL: transações reúnem instruções para programs e declaram contas envolvidas. Proof of History ajuda na ordenação temporal; não substitui o consenso baseado em stake.'
};
$$('[data-network]').forEach(button => button.addEventListener('click', () => {
  $$('[data-network]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  $('#network-detail').textContent = networkDetails[button.dataset.network];
}));
$('#network-detail').textContent = networkDetails.btc;

let escrow = { deposited: false, delivered: false, released: false };
function renderEscrow(message, failed = false) {
  $('#escrow-balance').textContent = escrow.deposited && !escrow.released ? '10' : '0';
  $('#seller-balance').textContent = escrow.released ? '10' : '0';
  $('#contract-deposit').disabled = escrow.deposited;
  $('#contract-confirm').disabled = !escrow.deposited || escrow.delivered || escrow.released;
  $('#contract-result').classList.toggle('warn', failed);
  $('#contract-result').textContent = message;
}
$('#contract-deposit').addEventListener('click', () => {
  if (escrow.deposited) return;
  escrow.deposited = true; renderEscrow('10 unidades em custódia. Falta confirmar a entrega.');
});
$('#contract-confirm').addEventListener('click', () => {
  if (!escrow.deposited || escrow.released) return;
  escrow.delivered = true; renderEscrow('Comprador confirmou a entrega. A função liberar() pode conferir as condições.');
});
$('#contract-release').addEventListener('click', () => {
  let failure = '';
  if ($('#contract-caller').value !== 'buyer') failure = 'Chamador não autorizado.';
  else if (!escrow.deposited) failure = 'Falta o depósito de 10 unidades.';
  else if (!escrow.delivered) failure = 'Entrega ainda não confirmada.';
  else if (escrow.released) failure = 'Pagamento já liberado. Uma segunda retirada é rejeitada.';
  if (failure) { renderEscrow(`Rejeitada: ${failure} Saldos não mudaram.`, true); return; }
  escrow.released = true; renderEscrow('Executada: 10 unidades transferidas ao vendedor. Custódia encerrada.');
});
$('#contract-reset').addEventListener('click', () => { escrow = { deposited: false, delivered: false, released: false }; $('#contract-caller').value = 'buyer'; renderEscrow('Depósito: 0. Entrega: não confirmada.'); });

function renderParallel(conflict) {
  $('#parallel-lanes').classList.toggle('conflict', conflict);
  $('#parallel-account').textContent = `Grava na conta ${conflict ? 'X' : 'Y'}`;
  $('#parallel-result').classList.toggle('warn', conflict);
  $('#parallel-result').textContent = conflict ? 'As duas transações escrevem em X. O acesso precisa ser ordenado, evitando escritas conflitantes.' : 'A escreve em X e B escreve em Y. Sem outras dependências, ambas podem executar em paralelo.';
  $$('[data-conflict]').forEach(button => button.setAttribute('aria-pressed', String((button.dataset.conflict === 'yes') === conflict)));
}
$$('[data-conflict]').forEach(button => button.addEventListener('click', () => renderParallel(button.dataset.conflict === 'yes')));
renderParallel(false);
