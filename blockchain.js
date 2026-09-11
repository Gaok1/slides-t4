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
let originalChainHashes = [], chainMode = 'cascade', chainRevision = 0;
const chainAnchor = '0'.repeat(64);
const payloadDialog = document.createElement('dialog');
payloadDialog.id = 'chain-payload';
payloadDialog.innerHTML = '<div class="dialog-head"><h2 id="payload-title">Entrada do hash</h2><button class="icon-button" aria-label="Fechar entrada do hash">×</button></div><p>Todos os campos deste bloco didático entram nesta sequência JSON, codificada em UTF-8.</p><pre id="payload-json"></pre><p id="payload-bytes" class="small muted"></p><div class="hash-output-label">SHA-256 DA ENTRADA EXATA ACIMA</div><code id="payload-hash"></code><p class="small muted">O próprio hash não entra na conta: ele é o resultado. Cores e estados de validação são informações da interface.</p>';
document.body.append(payloadDialog);
$('button', payloadDialog).addEventListener('click', () => payloadDialog.close());
$$('.linked-block').forEach((block, i) => {
  const button = document.createElement('button');
  button.className = 'text-button inspect-block'; button.textContent = 'Ver entrada completa ↗';
  button.addEventListener('click', () => {
    $('#payload-title').textContent = `Bloco ${i + 1}: o que entra no hash`;
    $('#payload-json').textContent = block.dataset.payload || '';
    $('#payload-bytes').textContent = `${new TextEncoder().encode(block.dataset.payload || '').length} bytes UTF-8. Ordem: índice, hash anterior completo, dados.`;
    $('#payload-hash').textContent = $('.current-hash', block).title;
    payloadDialog.showModal();
  });
  block.append(button);
});
$$('.chain-data').forEach(input => { input.disabled = true; });
async function updateChain() {
  if (originalChainHashes.length !== 3) return;
  const revision = ++chainRevision, mode = chainMode;
  const data = $$('.chain-data').map(input => input.value), hashes = [], previous = [], payloads = [];
  $('#chain-reset').disabled = true;
  try {
    for (let i = 0; i < 3; i++) {
      previous[i] = i ? (mode === 'cascade' ? hashes[i - 1] : originalChainHashes[i - 1]) : chainAnchor;
      payloads[i] = JSON.stringify([i + 1, previous[i], data[i]]);
      hashes.push(await sha256(payloads[i]));
    }
    if (revision !== chainRevision) return;
    let broken = 0, changed = 0, inherited = false;
    $$('.linked-block').forEach((block, i) => {
      const badLink = i > 0 && previous[i] !== hashes[i - 1], modified = hashes[i] !== originalChainHashes[i];
      if (badLink) broken++;
      if (modified) changed++;
      block.classList.toggle('bad-link', badLink); block.classList.toggle('modified', modified); block.classList.toggle('affected', inherited && !badLink);
      $('.block-state', block).textContent = badLink ? 'ELO QUEBRADO' : inherited ? 'CADEIA AFETADA' : modified ? 'HASH ALTERADO' : 'ORIGINAL';
      const prev = $('.previous-hash', block), hash = $('.current-hash', block);
      prev.textContent = shortHash(previous[i]); prev.title = previous[i];
      hash.textContent = hashes[i]; hash.title = hashes[i]; block.dataset.payload = payloads[i];
      if (badLink) inherited = true;
    });
    $('#chain-status').classList.toggle('warn', changed > 0);
    $('#chain-status').textContent = broken ? `${broken} elo(s) quebrado(s): as referências antigas ficaram congeladas. Os sucessores não se atualizam sozinhos.` : changed ? (mode === 'cascade' ? `${changed} hash(es) diferente(s) do original. As novas referências propagaram a alteração, sem refazer PoW nem obter consenso.` : 'O hash do último bloco mudou. Não há sucessor neste exemplo para apresentar um elo quebrado. Isso não significa aprovação pela rede.') : mode === 'cascade' ? 'Propagação ativa: edite o bloco 1 para ver os três hashes mudarem. Edite o bloco 2 para mudar apenas os dois últimos.' : 'Referências congeladas: edite os dados e observe o elo seguinte guardar o hash antigo.';
  } catch (error) { if (revision === chainRevision) $('#chain-status').textContent = error.message; }
  finally { if (revision === chainRevision) $('#chain-reset').disabled = false; }
}
$$('.chain-data').forEach(input => input.addEventListener('input', updateChain));
$$('[data-chain-mode]').forEach(button => button.addEventListener('click', () => {
  chainMode = button.dataset.chainMode;
  $$('[data-chain-mode]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
  updateChain();
}));
$('#chain-reset').addEventListener('click', () => { $$('.chain-data').forEach((input, i) => { input.value = originalChainData[i]; }); updateChain(); });
(async () => {
  try {
    for (let i = 0; i < 3; i++) originalChainHashes.push(await sha256(JSON.stringify([i + 1, i ? originalChainHashes[i - 1] : chainAnchor, originalChainData[i]])));
    $$('.chain-data').forEach(input => { input.disabled = false; }); await updateChain();
  } catch (error) { $('#chain-status').textContent = error.message; }
})();

let mining = false, miningRevision = 0, powAttempts = 0, powStarted = 0, powElapsed = 0;
const maxNonce = 4294967295;
function renderPowMetrics() {
  $('#pow-attempts').textContent = fmt(powAttempts);
  $('#pow-elapsed').textContent = `${fmt(powElapsed / 1000, 1)} s`;
}
function setMining(active) {
  mining = active;
  $('#pow-stop').disabled = !active;
  ['pow-mine','pow-data','pow-nonce','pow-difficulty','pow-test','pow-increment','pow-clear','pow-pace'].forEach(id => document.getElementById(id).disabled = active);
}
function stopMining() {
  if (!mining) return;
  ++miningRevision; powElapsed = performance.now() - powStarted; setMining(false); renderPowMetrics();
  $('#pow-status').textContent = 'Busca interrompida. Nenhuma atividade continua em segundo plano.';
}
function getNonce() {
  const input = $('#pow-nonce'), nonce = Number(input.value);
  if (input.value.trim() === '' || !Number.isSafeInteger(nonce) || nonce < 0 || nonce > maxNonce) throw new Error('Informe um nonce inteiro entre 0 e 4.294.967.295.');
  return nonce;
}
function pendingPow(reset = false) {
  stopMining(); ++miningRevision;
  if (reset) { powAttempts = 0; powElapsed = 0; }
  renderPowMetrics();
  const d = +$('#pow-difficulty').value;
  $('#pow-expected').textContent = fmt(16 ** d);
  $('.pow-expectation p').textContent = `tentativas para ${d} ${d === 1 ? 'zero hexadecimal' : 'zeros hexadecimais'}`;
  $('#pow-hash').textContent = 'Clique em testar para calcular SHA-256.';
  $('#pow-status').classList.remove('warn');
  $('#pow-status').textContent = 'Escolha seu nonce. Editar não conta como tentativa; testar calcula um hash.';
}
async function testNonce(increment = false) {
  if (mining) return;
  const revision = ++miningRevision;
  try {
    let nonce = getNonce();
    if (increment) {
      if (nonce === maxNonce) throw new Error('Limite de 32 bits atingido. Escolha outro nonce.');
      nonce++; $('#pow-nonce').value = nonce;
    }
    const hash = await sha256(JSON.stringify([$('#pow-data').value, nonce]));
    if (revision !== miningRevision) return;
    powAttempts++; renderPowMetrics(); $('#pow-hash').textContent = hash;
    const success = hash.startsWith('0'.repeat(+$('#pow-difficulty').value));
    $('#pow-status').classList.toggle('warn', !success);
    $('#pow-status').textContent = success ? `Acertou! Nonce ${fmt(nonce)} atende ao prefixo. Repetir os mesmos dados e nonce repete este hash.` : `Nonce ${fmt(nonce)} não atende ao prefixo. Tente outro: este hash não indica qual vai funcionar.`;
  } catch (error) { if (revision === miningRevision) { $('#pow-hash').textContent = '—'; $('#pow-status').textContent = error.message; } }
}
$('#pow-test').addEventListener('click', () => testNonce());
$('#pow-increment').addEventListener('click', () => testNonce(true));
$('#pow-clear').addEventListener('click', () => pendingPow(true));
$('#pow-mine').addEventListener('click', async () => {
  if (mining) return;
  let start;
  try { start = getNonce(); } catch (error) { $('#pow-status').textContent = error.message; return; }
  const data = $('#pow-data').value, prefix = '0'.repeat(+$('#pow-difficulty').value), delay = +$('#pow-pace').value, revision = ++miningRevision;
  powStarted = performance.now(); powElapsed = 0; setMining(true);
  try {
    for (let tries = 1; tries <= 8192 && start + tries - 1 <= maxNonce && performance.now() - powStarted < 30000; tries++) {
      const nonce = start + tries - 1, hash = await sha256(JSON.stringify([data, nonce]));
      if (revision !== miningRevision) return;
      powAttempts++; powElapsed = performance.now() - powStarted;
      $('#pow-nonce').value = nonce; $('#pow-hash').textContent = hash; renderPowMetrics();
      if (hash.startsWith(prefix)) {
        $('#pow-status').classList.remove('warn');
        $('#pow-status').textContent = `Encontrado: nonce ${fmt(nonce)} em ${fmt(tries)} tentativas nesta busca. Tempo inclui pausas didáticas.`;
        return;
      }
      $('#pow-status').classList.add('warn');
      $('#pow-status').textContent = `${fmt(tries)} tentativas nesta busca. Ainda sem o prefixo ${prefix}.`;
      if (delay || tries % 32 === 0) await new Promise(resolve => setTimeout(resolve, delay));
      if (revision !== miningRevision) return;
    }
    $('#pow-status').textContent = 'Limite de 8.192 tentativas, 30 s ou faixa do nonce atingido. Sem garantia de encontrar uma solução.';
  } catch (error) { if (revision === miningRevision) $('#pow-status').textContent = error.message; }
  finally { if (revision === miningRevision) { powElapsed = performance.now() - powStarted; setMining(false); renderPowMetrics(); } }
});
$('#pow-stop').addEventListener('click', stopMining);
$('#pow-nonce').addEventListener('input', () => pendingPow());
$('#pow-data').addEventListener('input', () => pendingPow(true));
$('#pow-difficulty').addEventListener('change', () => pendingPow(true));
document.addEventListener('slidechange', () => { if (!$('#pow-slide').classList.contains('active')) stopMining(); });
pendingPow(true);

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

const posSteps = [
  ['Uma garantia econômica', 'Validadores vinculam capital ao protocolo. No Ethereum, participação correta pode gerar recompensas, ausência pode gerar penalidades e infrações específicas podem causar slashing.'],
  ['Propor não é decidir sozinho', 'O protocolo seleciona um proponente, que organiza transações em um bloco. Outros participantes ainda precisam verificar as regras e o resultado da execução.'],
  ['Validadores conferem e atestam', 'Votos são ponderados pelo stake, não apenas pelo número de pessoas. Eles sinalizam a visão dos validadores sobre blocos e checkpoints. Stake não autoriza gastos inválidos.'],
  ['Finalidade depende das regras', 'No Ethereum, supermaiorias de stake e regras entre épocas consolidam checkpoints. Finalidade não é um simples clique de aprovação. Reverter esse acordo implica graves falhas ou violações do protocolo.']
];
function renderPos(index) {
  $('#pos-number').textContent = String(index + 1).padStart(2, '0');
  $('#pos-title').textContent = posSteps[index][0]; $('#pos-detail').textContent = posSteps[index][1];
  $$('[data-pos]').forEach(button => button.setAttribute('aria-pressed', String(+button.dataset.pos === index)));
}
$$('[data-pos]').forEach(button => button.addEventListener('click', () => renderPos(+button.dataset.pos)));
renderPos(0);

let pohEntries = [], pohRevision = 0;
function renderPoh() {
  const container = $('#poh-chain'); container.replaceChildren();
  for (let i = 0; i < 5; i++) {
    const entry = pohEntries[i], card = document.createElement('div');
    card.className = `poh-node${entry ? ' recorded' : ''}`;
    const label = document.createElement('span'), event = document.createElement('b'), hash = document.createElement('code');
    label.textContent = i ? `PASSO 0${i}` : 'SEMENTE · H₀';
    event.textContent = entry ? entry.event : 'Próximo evento';
    hash.textContent = entry ? shortHash(entry.hash) : 'H(anterior, evento)';
    hash.title = entry ? entry.hash : '';
    card.append(label, event, hash); container.append(card);
  }
  $('#poh-next').disabled = pohEntries.length === 0 || pohEntries.length === 5;
}
async function resetPoh() {
  const revision = ++pohRevision;
  pohEntries = []; renderPoh();
  try {
    const hash = await sha256('inicio-poh');
    if (revision !== pohRevision) return;
    pohEntries = [{ event: 'Início da sequência', hash }]; renderPoh();
    $('#poh-status').textContent = 'A semente inicia a sequência. Digite um evento e registre: o próximo cálculo precisa do hash anterior.';
  } catch (error) { if (revision === pohRevision) $('#poh-status').textContent = error.message; }
}
$('#poh-next').addEventListener('click', async () => {
  if (!pohEntries.length || pohEntries.length >= 5) return;
  const revision = ++pohRevision, event = $('#poh-event').value;
  $('#poh-next').disabled = true;
  try {
    const hash = await sha256(JSON.stringify([pohEntries.at(-1).hash, event]));
    if (revision !== pohRevision) return;
    pohEntries.push({ event: event || '(evento vazio)', hash }); renderPoh();
    $('#poh-status').textContent = `Evento ${pohEntries.length - 1} registrado. Mesmo repetindo o texto, a entrada muda porque o hash anterior mudou. Ordem verificável não significa transação válida.${pohEntries.length === 5 ? ' Reinicie para experimentar outra ordem.' : ''}`;
  } catch (error) { if (revision === pohRevision) { $('#poh-status').textContent = error.message; renderPoh(); } }
});
$('#poh-reset').addEventListener('click', resetPoh);
resetPoh();
